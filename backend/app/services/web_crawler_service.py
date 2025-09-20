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
        """Extract organization description"""
        description = ""

        # Try meta description first
        if main_data.get('soup'):
            meta_desc = main_data['soup'].find('meta', attrs={'name': 'description'})
            if meta_desc and meta_desc.get('content'):
                description = meta_desc['content']

        # Try to find description in about page
        if not description and about_data.get('soup'):
            # Common patterns for mission/description sections
            patterns = ['mission', 'about', 'who we are', 'what we do']

            for pattern in patterns:
                # Look for headings
                for heading in about_data['soup'].find_all(['h1', 'h2', 'h3']):
                    if pattern in heading.get_text().lower():
                        # Get the next paragraph
                        next_elem = heading.find_next_sibling(['p', 'div'])
                        if next_elem:
                            description = next_elem.get_text().strip()[:500]
                            break
                if description:
                    break

        # Fallback to first substantial paragraph
        if not description:
            soup = about_data.get('soup') or main_data.get('soup')
            if soup:
                for p in soup.find_all('p'):
                    text = p.get_text().strip()
                    if len(text) > 100:
                        description = text[:500]
                        break

        return description.strip() if description else ""

    def _extract_services(self, main_data: Dict, about_data: Dict) -> List[str]:
        """Extract services or areas of work"""
        services = set()

        for data in [main_data, about_data]:
            if not data.get('soup'):
                continue

            # Look for services sections
            service_keywords = ['services', 'what we do', 'our work', 'solutions', 'programs']

            for keyword in service_keywords:
                # Find sections with these keywords
                for elem in data['soup'].find_all(['h1', 'h2', 'h3', 'h4']):
                    if keyword in elem.get_text().lower():
                        # Get list items or paragraphs following this heading
                        parent = elem.find_parent(['div', 'section', 'article'])
                        if parent:
                            for li in parent.find_all('li')[:10]:
                                service = li.get_text().strip()[:100]
                                if service:
                                    services.add(service)

        return list(services)[:10]  # Limit to 10 services

    def _extract_expertise(self, main_data: Dict, about_data: Dict) -> List[str]:
        """Extract areas of expertise"""
        expertise = set()

        expertise_keywords = [
            'expertise', 'specializ', 'focus', 'expert', 'skills',
            'competenc', 'capabilit', 'strength', 'domain'
        ]

        for data in [main_data, about_data]:
            if not data.get('soup'):
                continue

            text = data['soup'].get_text().lower()

            # Look for expertise-related sections
            for keyword in expertise_keywords:
                if keyword in text:
                    # Find elements containing these keywords
                    for elem in data['soup'].find_all(['p', 'li', 'div']):
                        elem_text = elem.get_text().lower()
                        if keyword in elem_text:
                            # Extract meaningful phrases
                            sentences = elem.get_text().split('.')
                            for sentence in sentences[:3]:
                                if len(sentence.strip()) > 20 and len(sentence.strip()) < 150:
                                    expertise.add(sentence.strip())

        return list(expertise)[:8]  # Limit to 8 areas

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