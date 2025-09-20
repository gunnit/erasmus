import asyncio
import aiohttp
from bs4 import BeautifulSoup
import re
from typing import Dict, Any, List, Optional
from urllib.parse import urljoin, urlparse
import logging

logger = logging.getLogger(__name__)

class WebCrawlerService:
    """Service to crawl partner websites and extract relevant information"""

    def __init__(self):
        self.timeout = aiohttp.ClientTimeout(total=30)
        self.headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }

    async def crawl_website(self, url: str) -> Dict[str, Any]:
        """
        Crawl a website and extract relevant information
        """
        if not url.startswith(('http://', 'https://')):
            url = f'https://{url}'

        try:
            async with aiohttp.ClientSession(timeout=self.timeout) as session:
                # Fetch main page
                main_page_data = await self._fetch_page(session, url)

                # Try to find and fetch about page
                about_url = await self._find_about_page(session, url, main_page_data['soup'])
                about_data = {}
                if about_url:
                    about_data = await self._fetch_page(session, about_url)

                # Extract information
                result = {
                    'description': self._extract_description(main_page_data, about_data),
                    'services': self._extract_services(main_page_data, about_data),
                    'expertise': self._extract_expertise(main_page_data, about_data),
                    'contact': self._extract_contact(main_page_data, about_data),
                    'social_links': self._extract_social_links(main_page_data),
                    'meta_info': self._extract_meta_info(main_page_data),
                    'crawled_pages': [url]
                }

                if about_url:
                    result['crawled_pages'].append(about_url)

                return result

        except asyncio.TimeoutError:
            logger.error(f"Timeout while crawling {url}")
            raise Exception("Website took too long to respond")
        except Exception as e:
            logger.error(f"Error crawling {url}: {str(e)}")
            raise Exception(f"Failed to crawl website: {str(e)}")

    async def _fetch_page(self, session: aiohttp.ClientSession, url: str) -> Dict[str, Any]:
        """Fetch and parse a single page"""
        try:
            async with session.get(url, headers=self.headers, ssl=False) as response:
                if response.status != 200:
                    raise Exception(f"HTTP {response.status}")

                html = await response.text()
                soup = BeautifulSoup(html, 'html.parser')

                return {
                    'url': url,
                    'html': html,
                    'soup': soup
                }
        except Exception as e:
            logger.error(f"Failed to fetch {url}: {str(e)}")
            return {'url': url, 'html': '', 'soup': BeautifulSoup('', 'html.parser')}

    async def _find_about_page(self, session: aiohttp.ClientSession, base_url: str, soup: BeautifulSoup) -> Optional[str]:
        """Find the about page URL"""
        about_patterns = [
            r'/about',
            r'/about-us',
            r'/who-we-are',
            r'/our-story',
            r'/mission',
            r'/company'
        ]

        # Look for links containing "about" text
        for link in soup.find_all('a', href=True):
            href = link['href'].lower()
            text = link.get_text().lower()

            if 'about' in text or 'who we are' in text or 'our story' in text:
                return urljoin(base_url, link['href'])

            for pattern in about_patterns:
                if pattern in href:
                    return urljoin(base_url, link['href'])

        return None

    def _extract_description(self, main_data: Dict, about_data: Dict) -> str:
        """Extract comprehensive organization description"""
        descriptions = []

        # 1. Try meta description first
        if main_data.get('soup'):
            # Standard meta description
            meta_desc = main_data['soup'].find('meta', attrs={'name': 'description'})
            if meta_desc and meta_desc.get('content'):
                descriptions.append(meta_desc['content'].strip())

            # Open Graph description
            og_desc = main_data['soup'].find('meta', attrs={'property': 'og:description'})
            if og_desc and og_desc.get('content'):
                og_content = og_desc['content'].strip()
                if og_content not in descriptions:
                    descriptions.append(og_content)

        # 2. Extract from about page with expanded patterns
        if about_data.get('soup'):
            # Expanded patterns for organization descriptions
            patterns = [
                'mission', 'about us', 'who we are', 'what we do',
                'our story', 'vision', 'purpose', 'overview',
                'introduction', 'company profile', 'organization'
            ]

            for pattern in patterns:
                # Look for headings
                for heading in about_data['soup'].find_all(['h1', 'h2', 'h3', 'h4']):
                    heading_text = heading.get_text().lower()
                    if pattern in heading_text:
                        # Get next few paragraphs for better context
                        content_parts = []
                        next_elem = heading.find_next_sibling()
                        collected_chars = 0

                        while next_elem and collected_chars < 500:
                            if next_elem.name in ['p', 'div', 'span']:
                                text = next_elem.get_text().strip()
                                # Filter out navigation/menu text
                                if text and len(text) > 50 and not any(skip in text.lower() for skip in ['cookie', 'privacy policy', 'terms of use', 'copyright']):
                                    content_parts.append(text)
                                    collected_chars += len(text)
                            next_elem = next_elem.find_next_sibling()
                            if next_elem and next_elem.name in ['h1', 'h2', 'h3']:
                                break  # Stop at next heading

                        if content_parts:
                            combined = ' '.join(content_parts)[:600]
                            if combined not in descriptions:
                                descriptions.append(combined)
                                break

        # 3. Look for description in main page hero/banner section
        if main_data.get('soup'):
            # Look for hero/banner sections
            hero_selectors = [
                {'class': re.compile(r'hero|banner|jumbotron|masthead|header-content', re.I)},
                {'id': re.compile(r'hero|banner|intro|about', re.I)}
            ]

            for selector in hero_selectors:
                hero = main_data['soup'].find('div', selector) or main_data['soup'].find('section', selector)
                if hero:
                    # Extract substantial text from hero
                    hero_text = []
                    for elem in hero.find_all(['p', 'h2', 'h3', 'span']):
                        text = elem.get_text().strip()
                        if len(text) > 30 and len(text) < 300:
                            hero_text.append(text)

                    if hero_text:
                        hero_description = ' '.join(hero_text[:3])[:500]
                        if hero_description not in descriptions:
                            descriptions.append(hero_description)
                            break

        # 4. Fallback to first substantial paragraphs
        if not descriptions:
            soup = about_data.get('soup') or main_data.get('soup')
            if soup:
                for p in soup.find_all('p'):
                    text = p.get_text().strip()
                    # More intelligent filtering
                    if (len(text) > 100 and
                        not any(skip in text.lower() for skip in
                               ['cookie', 'javascript', 'browser', 'privacy', 'subscribe', 'newsletter'])):
                        descriptions.append(text[:500])
                        if len(descriptions) >= 2:
                            break

        # 5. Combine and clean descriptions intelligently
        if descriptions:
            # Remove duplicates while preserving order
            seen = set()
            unique_descriptions = []
            for desc in descriptions:
                # Normalize for comparison
                normalized = ' '.join(desc.lower().split())
                if normalized not in seen and len(desc) > 50:
                    seen.add(normalized)
                    unique_descriptions.append(desc)

            # Combine up to 2-3 best descriptions
            if len(unique_descriptions) > 1:
                # Prefer longer, more informative descriptions
                unique_descriptions.sort(key=lambda x: len(x), reverse=True)
                combined = unique_descriptions[0]
                # Add second description if it adds value
                if len(unique_descriptions) > 1 and len(combined) < 400:
                    second = unique_descriptions[1]
                    if not any(word in combined.lower() for word in second.lower().split()[:5]):
                        combined = f"{combined} {second}"
                return combined[:800].strip()
            elif unique_descriptions:
                return unique_descriptions[0][:800].strip()

        return ""

    def _extract_services(self, main_data: Dict, about_data: Dict) -> List[str]:
        """Extract services, programs, and offerings"""
        services = set()
        service_details = {}

        for data in [main_data, about_data]:
            if not data.get('soup'):
                continue

            # Expanded keywords for service detection
            service_keywords = [
                'services', 'what we do', 'our work', 'solutions',
                'programs', 'offerings', 'products', 'portfolio',
                'how we help', 'we provide', 'we offer', 'activities'
            ]

            # 1. Look for dedicated service sections
            for keyword in service_keywords:
                # Find headings with service keywords
                for elem in data['soup'].find_all(['h1', 'h2', 'h3', 'h4', 'h5']):
                    heading_text = elem.get_text().lower()
                    if keyword in heading_text:
                        # Get the parent container
                        parent = elem.find_parent(['div', 'section', 'article', 'main'])
                        if parent:
                            # Extract list items
                            for li in parent.find_all('li')[:15]:
                                service_text = li.get_text().strip()
                                if service_text and 10 < len(service_text) < 200:
                                    # Check if there's a nested description
                                    title = li.find(['strong', 'b', 'h4', 'h5'])
                                    if title:
                                        title_text = title.get_text().strip()
                                        desc_text = li.get_text().replace(title_text, '').strip()
                                        if title_text:
                                            services.add(title_text[:100])
                                            if desc_text and len(desc_text) > 20:
                                                service_details[title_text[:100]] = desc_text[:150]
                                    else:
                                        services.add(service_text[:150])

                            # Also check for cards/boxes within the section
                            for card in parent.find_all(['div', 'article'], class_=re.compile(r'card|service|box|item', re.I))[:10]:
                                # Get service title
                                title = card.find(['h3', 'h4', 'h5', 'strong', 'b'])
                                if title:
                                    title_text = title.get_text().strip()
                                    if 5 < len(title_text) < 100:
                                        services.add(title_text)

                                        # Get service description if available
                                        desc = card.find('p')
                                        if desc:
                                            desc_text = desc.get_text().strip()[:150]
                                            if len(desc_text) > 20:
                                                service_details[title_text] = desc_text

            # 2. Look for service patterns in navigation/menus
            nav_elements = data['soup'].find_all(['nav', 'ul'], class_=re.compile(r'menu|nav', re.I))
            for nav in nav_elements[:3]:
                # Look for service-related menu items
                for link in nav.find_all('a'):
                    link_text = link.get_text().strip()
                    href = link.get('href', '').lower()
                    if (any(keyword in href for keyword in ['service', 'solution', 'product', 'program']) and
                        5 < len(link_text) < 50):
                        services.add(link_text)

            # 3. Extract from accordion or expandable sections
            accordions = data['soup'].find_all(['div', 'details'], class_=re.compile(r'accordion|collapse|expand', re.I))
            for accordion in accordions[:5]:
                # Get title from summary or header
                title_elem = accordion.find(['summary', 'h3', 'h4', 'button'])
                if title_elem:
                    title = title_elem.get_text().strip()
                    if 10 < len(title) < 100:
                        services.add(title)

        # 4. Clean and format services
        cleaned_services = []
        seen_normalized = set()

        for service in services:
            # Clean the service text
            cleaned = re.sub(r'\s+', ' ', service).strip()
            cleaned = re.sub(r'^[•\-\*\d]+\.?\s*', '', cleaned)  # Remove bullets and numbers
            cleaned = re.sub(r'\([^)]*\)', '', cleaned).strip()  # Remove parenthetical notes

            # Normalize for duplicate detection
            normalized = cleaned.lower()

            if (normalized not in seen_normalized and
                len(cleaned) > 5 and
                not any(skip in normalized for skip in
                       ['read more', 'click here', 'learn more', 'contact', 'about', 'home'])):
                seen_normalized.add(normalized)

                # Add detail if available
                if cleaned in service_details:
                    combined = f"{cleaned}: {service_details[cleaned]}"
                    if len(combined) < 200:
                        cleaned_services.append(combined)
                    else:
                        cleaned_services.append(cleaned)
                else:
                    cleaned_services.append(cleaned)

        # Sort by length (prefer more descriptive services)
        cleaned_services.sort(key=lambda x: len(x), reverse=True)

        # Return a mix of detailed and brief service descriptions
        result = []
        for i, service in enumerate(cleaned_services):
            if len(result) >= 15:
                break
            result.append(service)

        return result

    def _extract_expertise(self, main_data: Dict, about_data: Dict) -> List[str]:
        """Extract comprehensive areas of expertise and capabilities"""
        expertise = set()
        capabilities = set()

        # Expanded keywords for better expertise detection
        expertise_patterns = [
            # Skills and expertise
            r'(?:we |our )(?:expertise|specializ|focus)(?:e[ds]?)? (?:in |on )?([^.]+)',
            r'(?:areas? of |core )?(?:expertise|specialization|competenc)(?:ies)?:?\s*([^.]+)',
            r'(?:technical |key )?(?:skills|capabilities|competencies):?\s*([^.]+)',

            # What we do patterns
            r'we (?:provide|offer|deliver|work on|help with)\s+([^.]+)',
            r'our (?:services include|work includes|expertise includes)\s+([^.]+)',
            r'specialized in\s+([^.]+)',

            # Industry and sectors
            r'(?:sectors?|industries|domains?):?\s*([^.]+)',
            r'working (?:in|with)\s+(?:the )?([\w\s,&]+)(?:sector|industry)',

            # Technologies and methodologies
            r'(?:technologies|platforms?|tools?):?\s*([^.]+)',
            r'(?:using|leveraging|working with)\s+([A-Z][\w\s,]+)',

            # Certifications and standards
            r'(?:certified|accredited) (?:in|for)\s+([^.]+)',
            r'(?:ISO|compliance|standards?):?\s*([\d\w\s,]+)'
        ]

        for data in [main_data, about_data]:
            if not data.get('soup'):
                continue

            # 1. Look for structured expertise sections
            expertise_sections = data['soup'].find_all(
                ['div', 'section', 'article'],
                class_=re.compile(r'expertise|capabilities|skills|services|competenc', re.I)
            )

            for section in expertise_sections:
                # Extract from lists
                for li in section.find_all('li')[:15]:
                    text = li.get_text().strip()
                    if 20 < len(text) < 150:
                        expertise.add(text)

                # Extract from cards/boxes
                for card in section.find_all(['div', 'article'], class_=re.compile(r'card|box|item', re.I))[:10]:
                    title = card.find(['h3', 'h4', 'h5', 'strong'])
                    if title:
                        title_text = title.get_text().strip()
                        if 5 < len(title_text) < 100:
                            expertise.add(title_text)

                    # Also get description if available
                    desc = card.find('p')
                    if desc:
                        desc_text = desc.get_text().strip()[:150]
                        if len(desc_text) > 30:
                            capabilities.add(desc_text)

            # 2. Apply regex patterns to find expertise mentions
            full_text = data['soup'].get_text()
            for pattern in expertise_patterns:
                matches = re.findall(pattern, full_text, re.IGNORECASE | re.MULTILINE)
                for match in matches[:5]:  # Limit matches per pattern
                    if isinstance(match, str):
                        # Clean and split the match
                        items = re.split(r'[,;]|\sand\s', match)
                        for item in items:
                            cleaned = item.strip().strip('.')
                            if 10 < len(cleaned) < 100:
                                expertise.add(cleaned)

            # 3. Look for technology stacks and tools
            tech_keywords = [
                'Python', 'Java', 'JavaScript', 'React', 'Angular', 'Vue',
                'AWS', 'Azure', 'Google Cloud', 'Docker', 'Kubernetes',
                'Machine Learning', 'AI', 'Data Science', 'Analytics',
                'Blockchain', 'IoT', 'Cloud Computing', 'DevOps',
                'Agile', 'Scrum', 'Project Management', 'Design Thinking',
                'Digital Transformation', 'Consulting', 'Training',
                'Research', 'Development', 'Innovation'
            ]

            text_lower = full_text.lower()
            for tech in tech_keywords:
                if tech.lower() in text_lower:
                    # Find context around the technology mention
                    pattern = r'[^.]*' + re.escape(tech) + r'[^.]*'
                    contexts = re.findall(pattern, full_text, re.IGNORECASE)
                    for context in contexts[:2]:
                        if 30 < len(context) < 150:
                            capabilities.add(context.strip())
                        else:
                            expertise.add(tech)

            # 4. Extract from feature lists or grids
            feature_containers = data['soup'].find_all(
                ['ul', 'div'],
                class_=re.compile(r'features?|services?|offerings?|solutions?', re.I)
            )

            for container in feature_containers[:3]:
                items = container.find_all(['li', 'h3', 'h4', 'strong'])[:10]
                for item in items:
                    text = item.get_text().strip()
                    if 10 < len(text) < 100:
                        expertise.add(text)

        # 5. Combine and clean results
        all_expertise = list(expertise) + list(capabilities)

        # Remove duplicates and clean
        cleaned_expertise = []
        seen_normalized = set()

        for item in all_expertise:
            # Clean the text
            cleaned = re.sub(r'\s+', ' ', item).strip()
            cleaned = re.sub(r'^[•\-\*]\s*', '', cleaned)  # Remove bullet points
            cleaned = re.sub(r'\d+\.\s*', '', cleaned)  # Remove numbering

            # Normalize for duplicate detection
            normalized = cleaned.lower()

            if (normalized not in seen_normalized and
                len(cleaned) > 10 and
                not any(skip in normalized for skip in
                       ['cookie', 'privacy', 'terms', 'copyright', 'reserved', 'subscribe'])):
                seen_normalized.add(normalized)
                cleaned_expertise.append(cleaned)

        # Sort by length (prefer more descriptive items) and return top items
        cleaned_expertise.sort(key=lambda x: len(x), reverse=True)

        # Mix longer descriptions with shorter keywords
        result = []
        long_items = [x for x in cleaned_expertise if len(x) > 50]
        short_items = [x for x in cleaned_expertise if len(x) <= 50]

        # Interleave long and short items
        for i in range(min(8, len(cleaned_expertise))):
            if i % 2 == 0 and long_items:
                result.append(long_items.pop(0))
            elif short_items:
                result.append(short_items.pop(0))
            elif long_items:
                result.append(long_items.pop(0))

        return result[:12]  # Return up to 12 expertise areas

    def _extract_contact(self, main_data: Dict, about_data: Dict) -> Dict[str, str]:
        """Extract contact information"""
        contact = {}

        for data in [main_data, about_data]:
            if not data.get('soup'):
                continue

            # Email
            if not contact.get('email'):
                email_pattern = r'[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}'
                emails = re.findall(email_pattern, data['soup'].get_text())
                if emails:
                    # Filter out common non-contact emails
                    for email in emails:
                        if not any(x in email.lower() for x in ['example', 'domain', 'email']):
                            contact['email'] = email
                            break

            # Phone
            if not contact.get('phone'):
                phone_pattern = r'[\+]?[(]?[0-9]{1,4}[)]?[-\s\.]?[(]?[0-9]{1,4}[)]?[-\s\.]?[0-9]{1,5}[-\s\.]?[0-9]{1,5}'
                phones = re.findall(phone_pattern, data['soup'].get_text())
                if phones:
                    for phone in phones:
                        if len(phone) >= 10:  # Minimum valid phone length
                            contact['phone'] = phone
                            break

            # Address - look for address tags or common patterns
            if not contact.get('address'):
                address_elem = data['soup'].find('address')
                if address_elem:
                    contact['address'] = address_elem.get_text().strip()
                else:
                    # Look for elements with address-like content
                    for elem in data['soup'].find_all(['p', 'div']):
                        text = elem.get_text().strip()
                        if any(keyword in text.lower() for keyword in ['street', 'avenue', 'road', 'city', 'postal', 'zip']):
                            if len(text) < 200:
                                contact['address'] = text
                                break

        return contact

    def _extract_social_links(self, main_data: Dict) -> Dict[str, str]:
        """Extract social media links"""
        social = {}

        if not main_data.get('soup'):
            return social

        social_patterns = {
            'linkedin': r'linkedin\.com/(?:company/|in/)[^/\s]+',
            'twitter': r'twitter\.com/[^/\s]+',
            'facebook': r'facebook\.com/[^/\s]+',
            'instagram': r'instagram\.com/[^/\s]+',
            'youtube': r'youtube\.com/(?:c/|channel/|user/)[^/\s]+'
        }

        for link in main_data['soup'].find_all('a', href=True):
            href = link['href']
            for platform, pattern in social_patterns.items():
                if platform not in social and re.search(pattern, href):
                    social[platform] = href

        return social

    def _extract_meta_info(self, main_data: Dict) -> Dict[str, str]:
        """Extract meta information from the page"""
        meta_info = {}

        if not main_data.get('soup'):
            return meta_info

        # Title
        title = main_data['soup'].find('title')
        if title:
            meta_info['title'] = title.get_text().strip()

        # Meta tags
        meta_tags = ['keywords', 'author', 'og:title', 'og:description', 'og:type']
        for tag_name in meta_tags:
            meta = main_data['soup'].find('meta', attrs={'name': tag_name}) or \
                   main_data['soup'].find('meta', attrs={'property': tag_name})
            if meta and meta.get('content'):
                meta_info[tag_name] = meta['content']

        return meta_info