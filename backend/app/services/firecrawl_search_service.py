from typing import Dict, List, Optional
import logging
import re
from firecrawl import Firecrawl
from app.core.config import settings

logger = logging.getLogger(__name__)


class FirecrawlSearchService:
    """Service for searching real organizations using Firecrawl API"""

    def __init__(self):
        if not settings.FIRECRAWL_API_KEY:
            logger.warning("FIRECRAWL_API_KEY is not set, web search functionality will be limited")
            self.enabled = False
            self.app = None
        else:
            self.enabled = True
            self.app = Firecrawl(api_key=settings.FIRECRAWL_API_KEY)

    async def search_partners(
        self,
        search_criteria: Dict,
        num_results: int = 10
    ) -> List[Dict]:
        """
        Search for real partner organizations based on criteria using Firecrawl v2 API

        Args:
            search_criteria: Dict containing search parameters
            num_results: Number of results to return

        Returns:
            List of partner organizations with real data
        """
        if not self.enabled:
            logger.warning("Firecrawl search is not enabled")
            return []

        partners = []

        # Build search query based on criteria
        search_query = self._build_search_query(search_criteria)

        # First, use Firecrawl v2 search to find relevant organizations
        try:
            logger.info(f"Searching with Firecrawl v2 API: {search_query}")

            # Use v2 search endpoint with scraping enabled
            search_results = self.app.search(
                query=search_query,
                limit=min(num_results * 2, 20),  # Get more results to filter
                scrape_options={'formats': [{'type': 'markdown'}], 'onlyMainContent': True}
            )

            logger.info(f"Search results type: {type(search_results)}")

            if search_results and isinstance(search_results, dict):
                # v2 API returns results in data.web, data.images, data.news structure
                web_results = search_results.get('data', {}).get('web', [])

                if not web_results and 'data' in search_results and isinstance(search_results['data'], list):
                    # Handle if data is directly a list (backward compatibility)
                    web_results = search_results['data']

                logger.info(f"Found {len(web_results)} web results")

                for result in web_results:
                    partner = self._extract_partner_from_result(result, search_criteria)
                    if partner and self._validate_partner(partner):
                        partners.append(partner)

        except Exception as e:
            logger.error(f"Error with Firecrawl v2 search: {str(e)}")
            # Fall back to directory scraping if search fails
            partners.extend(await self._scrape_partner_directories(search_criteria, num_results))

        # If not enough results from search, supplement with directory scraping
        if len(partners) < num_results:
            additional_partners = await self._scrape_partner_directories(
                search_criteria,
                num_results - len(partners)
            )
            partners.extend(additional_partners)

        # Remove duplicates and limit results
        partners = self._deduplicate_partners(partners)
        return partners[:num_results]

    def _build_search_query(self, criteria: Dict) -> str:
        """Build an optimized search query from criteria"""
        query_parts = []

        # Add expertise areas
        if criteria.get('expertise_areas'):
            areas = ' OR '.join(f'"{area}"' for area in criteria['expertise_areas'][:3])
            query_parts.append(f"({areas})")

        # Add partner type
        partner_type = criteria.get('partner_type', '')
        if partner_type:
            type_keywords = {
                'NGO': 'NGO OR "non-profit" OR foundation OR association',
                'EDUCATIONAL_INSTITUTION': 'university OR college OR school OR "higher education"',
                'RESEARCH_CENTER': 'research OR laboratory OR institute',
                'PUBLIC_INSTITUTION': 'government OR ministry OR "public institution"',
                'PRIVATE_COMPANY': 'company OR enterprise OR business',
                'SOCIAL_ENTERPRISE': '"social enterprise" OR cooperative'
            }
            if partner_type in type_keywords:
                query_parts.append(f"({type_keywords[partner_type]})")

        # Add country if specified
        countries = criteria.get('countries', [])
        if countries:
            country_str = ' OR '.join(f'"{country}"' for country in countries[:2])
            query_parts.append(f"({country_str})")

        # Add base terms for Erasmus+ context
        query_parts.append('"Erasmus+" OR "adult education" OR "European partner"')

        # Join all parts
        query = ' '.join(query_parts)

        # Limit query length
        if len(query) > 200:
            query = query[:200]

        return query

    async def _scrape_partner_directories(
        self,
        search_criteria: Dict,
        num_results: int
    ) -> List[Dict]:
        """Fallback method to scrape known partner directories"""
        partners = []
        partner_directories = self._get_partner_directories(search_criteria)

        for directory_url in partner_directories[:3]:  # Limit API calls
            try:
                logger.info(f"Scraping partner directory: {directory_url}")

                # Use v2 scrape method
                scraped_data = self.app.scrape(
                    url=directory_url,
                    formats=[{'type': 'markdown'}, {'type': 'links'}]
                )

                if scraped_data is None:
                    logger.warning(f"Firecrawl returned None for URL: {directory_url}")
                    continue

                # Extract partners from scraped content
                if isinstance(scraped_data, dict):
                    markdown_content = scraped_data.get('markdown', '')
                    links = scraped_data.get('links', [])

                    extracted = self._extract_partners_from_content(
                        markdown_content,
                        links or [],
                        search_criteria
                    )
                    partners.extend(extracted)

                    if len(partners) >= num_results:
                        break

            except Exception as e:
                logger.error(f"Error scraping directory {directory_url}: {str(e)}")
                continue

        return partners

    def _get_partner_directories(self, criteria: Dict) -> List[str]:
        """Get URLs of known partner directories to scrape"""
        directories = [
            # Erasmus+ official resources
            "https://erasmus-plus.ec.europa.eu/projects",
            "https://ec.europa.eu/programmes/erasmus-plus/projects_en",

            # EPALE - European Adult Learning
            "https://epale.ec.europa.eu/en/organisations",
            "https://epale.ec.europa.eu/en/partner-search",

            # European networks
            "https://eaea.org/our-members/",  # European Association for Education of Adults
            "https://www.eucen.eu/members",  # European Universities Continuing Education Network

            # Additional resources
            "https://www.salto-youth.net/tools/otlas-partner-finding/",
            "https://europa.eu/youth/solidarity/organisations_en"
        ]

        # Add country-specific directories if countries are specified
        countries = criteria.get('countries', [])
        if countries:
            for country in countries[:2]:
                if country.lower() == 'germany':
                    directories.append("https://www.na-bibb.de/erasmus-erwachsenenbildung/")
                elif country.lower() == 'france':
                    directories.append("https://agence.erasmusplus.fr/")
                elif country.lower() == 'italy':
                    directories.append("https://www.erasmusplus.it/")

        return directories

    def _extract_partners_from_content(
        self,
        markdown_content: str,
        links: List[str],
        criteria: Dict
    ) -> List[Dict]:
        """Extract partner organizations from scraped content"""
        partners = []

        if not markdown_content:
            return partners

        # Split content into sections/paragraphs
        sections = markdown_content.split('\n\n')

        for section in sections:
            # Look for organization patterns
            if self._looks_like_organization(section):
                # Extract organization details
                partner = self._extract_organization_details(section, links, criteria)
                if partner and self._validate_partner(partner):
                    partners.append(partner)

        # Also try to extract from links directly - check if links is not None
        if links:
            for link in links[:20]:  # Limit to avoid too many
                if self._is_organization_website(link):
                    partner = self._create_partner_from_url(link, criteria)
                    if partner and self._validate_partner(partner):
                        partners.append(partner)

        return self._deduplicate_partners(partners)

    def _looks_like_organization(self, text: str) -> bool:
        """Check if text section likely describes an organization"""
        org_indicators = [
            'organization', 'organisation', 'association', 'institute',
            'university', 'college', 'foundation', 'center', 'centre',
            'ngo', 'company', 'partner', 'member'
        ]

        text_lower = text.lower()
        return any(indicator in text_lower for indicator in org_indicators)

    def _extract_organization_details(self, text: str, links: List[str], criteria: Dict) -> Optional[Dict]:
        """Extract organization details from text section"""
        # Try to extract organization name
        name_match = re.search(r'^([A-Z][\w\s\-&]+)', text)
        if not name_match:
            return None

        org_name = name_match.group(1).strip()

        # Find associated website
        website = None
        for link in links:
            if org_name.lower().replace(' ', '') in link.lower():
                website = link
                break

        if not website:
            # Try to extract website from text
            url_match = re.search(r'(https?://[^\s]+)', text)
            if url_match:
                website = url_match.group(1)

        if not website:
            return None

        # Build partner data
        return {
            'name': org_name,
            'type': self._determine_partner_type('', text, website),
            'country': self._extract_country(website, text, org_name),
            'website': self._clean_url(website),
            'description': text[:500] if len(text) > 50 else f"{org_name} - European partner organization",
            'expertise_areas': self._extract_expertise_areas(text, criteria.get('expertise_areas', [])),
            'source': 'directory_scraping',
            'is_verified': True,
            'contact_info': {'website': self._clean_url(website)}
        }

    def _is_organization_website(self, url: str) -> bool:
        """Check if URL is likely an organization website"""
        # Exclude social media and generic platforms
        exclude_domains = [
            'facebook.com', 'twitter.com', 'linkedin.com', 'youtube.com',
            'wikipedia.org', 'google.com', 'ec.europa.eu', 'europa.eu'
        ]

        return not any(domain in url.lower() for domain in exclude_domains)

    def _create_partner_from_url(self, url: str, criteria: Dict) -> Optional[Dict]:
        """Create partner data from just a URL"""
        # Extract organization name from domain
        domain_match = re.search(r'(?:https?://)?(?:www\.)?([^/]+)', url)
        if not domain_match:
            return None

        domain = domain_match.group(1)
        # Remove TLD and clean
        org_name = re.sub(r'\.(com|org|eu|edu|net|gov|int).*$', '', domain)
        org_name = org_name.replace('-', ' ').replace('_', ' ').title()

        return {
            'name': org_name,
            'type': 'NGO',  # Default type
            'country': self._extract_country_from_domain(domain),
            'website': self._clean_url(url),
            'description': f"{org_name} - Organization identified from partner directories",
            'expertise_areas': ['Adult Education', 'European Cooperation'],
            'source': 'directory_link',
            'is_verified': True,
            'contact_info': {'website': self._clean_url(url)}
        }

    def _extract_country_from_domain(self, domain: str) -> str:
        """Extract country from domain TLD"""
        country_tlds = {
            '.de': 'Germany', '.fr': 'France', '.it': 'Italy', '.es': 'Spain',
            '.pt': 'Portugal', '.nl': 'Netherlands', '.be': 'Belgium', '.at': 'Austria',
            '.pl': 'Poland', '.cz': 'Czech Republic', '.sk': 'Slovakia', '.hu': 'Hungary',
            '.ro': 'Romania', '.bg': 'Bulgaria', '.gr': 'Greece', '.se': 'Sweden',
            '.dk': 'Denmark', '.fi': 'Finland', '.no': 'Norway', '.ie': 'Ireland'
        }

        for tld, country in country_tlds.items():
            if tld in domain.lower():
                return country

        return 'Europe'

    def _extract_partner_from_result(self, result: Dict, criteria: Dict) -> Optional[Dict]:
        """Extract partner information from search result"""
        try:
            # Log the result structure for debugging
            logger.debug(f"Processing result with keys: {result.keys() if isinstance(result, dict) else 'Not a dict'}")

            # Get basic info from search result
            url = result.get('url', '')
            title = result.get('title', '')
            description = result.get('description', '') or result.get('snippet', '') or result.get('markdown', '')[:500]

            # Also check metadata if available
            if not title and 'metadata' in result:
                metadata = result.get('metadata', {})
                title = metadata.get('title', '')
                if not description:
                    description = metadata.get('description', '')

            logger.info(f"Extracted - URL: {url[:50]}..., Title: {title[:50]}...")

            if not url or not title:
                return None

            # Extract organization name from title/URL
            org_name = self._extract_organization_name(title, url)
            if not org_name:
                return None

            # Extract country from URL or description
            country = self._extract_country(url, description, title)

            # Determine partner type based on content
            partner_type = self._determine_partner_type(title, description, url)

            # Extract expertise areas from description
            expertise_areas = self._extract_expertise_areas(description, criteria.get('expertise_areas', []))

            # Extract the actual organization website
            website = self._extract_organization_website(url, description, result)

            # Build partner data
            partner = {
                'name': org_name,
                'type': partner_type,
                'country': country,
                'website': website,  # The actual organization website
                'description': description[:500] if description else f"{org_name} is an organization involved in European education and training projects.",
                'expertise_areas': expertise_areas,
                'source': 'web_search',
                'is_verified': True,
                'search_result_url': url,  # Keep original search result URL for reference
                'contact_info': {
                    'website': website
                }
            }

            logger.info(f"Created partner: {org_name} with website: {website}")

            return partner

        except Exception as e:
            logger.error(f"Error extracting partner from result: {str(e)}")
            return None

    def _extract_organization_name(self, title: str, url: str) -> str:
        """Extract organization name from title or URL"""
        # Clean common suffixes/prefixes
        name = title

        # Remove common page indicators
        patterns_to_remove = [
            r' - Home$',
            r' - About.*$',
            r' - Partners.*$',
            r' \| .*$',
            r'^Welcome to ',
            r'^Home - ',
            r' - Erasmus\+.*$'
        ]

        for pattern in patterns_to_remove:
            name = re.sub(pattern, '', name, flags=re.IGNORECASE)

        # If name is too generic, try to extract from URL
        if len(name) < 3 or name.lower() in ['home', 'about', 'welcome', 'index']:
            # Extract from domain
            domain_match = re.search(r'(?:https?://)?(?:www\.)?([^/]+)', url)
            if domain_match:
                domain = domain_match.group(1)
                # Remove TLD
                name = re.sub(r'\.(com|org|eu|edu|net|gov|int).*$', '', domain)
                # Convert hyphens to spaces and capitalize
                name = name.replace('-', ' ').replace('_', ' ').title()

        return name.strip()

    def _extract_country(self, url: str, description: str, title: str) -> str:
        """Extract country from various sources"""
        # Common European country codes and names
        country_mapping = {
            '.de': 'Germany', '.fr': 'France', '.it': 'Italy', '.es': 'Spain',
            '.pt': 'Portugal', '.nl': 'Netherlands', '.be': 'Belgium', '.at': 'Austria',
            '.pl': 'Poland', '.cz': 'Czech Republic', '.sk': 'Slovakia', '.hu': 'Hungary',
            '.ro': 'Romania', '.bg': 'Bulgaria', '.gr': 'Greece', '.se': 'Sweden',
            '.dk': 'Denmark', '.fi': 'Finland', '.no': 'Norway', '.ie': 'Ireland',
            '.lt': 'Lithuania', '.lv': 'Latvia', '.ee': 'Estonia', '.si': 'Slovenia',
            '.hr': 'Croatia', '.lu': 'Luxembourg', '.mt': 'Malta', '.cy': 'Cyprus'
        }

        # Check URL for country code
        for code, country in country_mapping.items():
            if code in url.lower():
                return country

        # Check description for country names
        text = f"{description} {title}".lower()
        for country in country_mapping.values():
            if country.lower() in text:
                return country

        # Check for EU/Europe mentions
        if any(term in text for term in ['european', 'eu ', 'europe', 'brussels']):
            if 'brussels' in text:
                return 'Belgium'
            return 'European Union'

        return 'Europe'

    def _determine_partner_type(self, title: str, description: str, url: str) -> str:
        """Determine partner type based on content analysis"""
        text = f"{title} {description} {url}".lower()

        # Check for specific type indicators
        if any(term in text for term in ['ngo', 'non-profit', 'nonprofit', 'association', 'foundation']):
            return 'NGO'
        elif any(term in text for term in ['university', 'college', 'school', 'academy', 'institute']):
            return 'EDUCATIONAL_INSTITUTION'
        elif any(term in text for term in ['research', 'laboratory', 'scientific', 'r&d']):
            return 'RESEARCH_CENTER'
        elif any(term in text for term in ['ministry', 'government', 'public', 'municipality', 'regional']):
            return 'PUBLIC_INSTITUTION'
        elif any(term in text for term in ['company', 'ltd', 'gmbh', 'enterprise', 'business']):
            return 'PRIVATE_COMPANY'
        elif any(term in text for term in ['social enterprise', 'cooperative', 'social business']):
            return 'SOCIAL_ENTERPRISE'
        else:
            return 'NGO'  # Default to NGO

    def _extract_expertise_areas(self, description: str, requested_areas: List[str]) -> List[str]:
        """Extract expertise areas from description"""
        expertise = []

        # Common expertise keywords in adult education
        expertise_keywords = {
            'digital': ['digital', 'technology', 'online', 'e-learning', 'ICT'],
            'inclusion': ['inclusion', 'diversity', 'equity', 'accessibility', 'disadvantaged'],
            'skills': ['skills', 'competences', 'training', 'professional development'],
            'language': ['language', 'linguistic', 'multilingual', 'communication'],
            'entrepreneurship': ['entrepreneur', 'business', 'startup', 'innovation'],
            'sustainability': ['sustainable', 'environment', 'green', 'climate'],
            'employment': ['employment', 'job', 'career', 'workforce', 'labour'],
            'migration': ['migration', 'refugee', 'immigrant', 'integration'],
            'health': ['health', 'wellbeing', 'mental health', 'wellness'],
            'culture': ['culture', 'arts', 'creative', 'heritage']
        }

        text = description.lower()

        # Check for requested areas first
        for area in requested_areas:
            if area.lower() in text:
                expertise.append(area)

        # Check for common expertise keywords
        for category, keywords in expertise_keywords.items():
            if any(keyword in text for keyword in keywords):
                if category not in [e.lower() for e in expertise]:
                    expertise.append(category.title())

        # Limit to 5 expertise areas
        return expertise[:5] if expertise else ['Adult Education', 'European Cooperation']

    def _extract_organization_website(self, url: str, description: str, result: Dict) -> str:
        """Extract the actual organization website from search result"""
        # First, check if this is already a homepage
        if self._is_homepage(url):
            return self._clean_url(url)

        # Check if the URL is from a directory or aggregator site
        aggregator_domains = ['ec.europa.eu', 'epale.ec.europa.eu', 'erasmus-plus.ec.europa.eu',
                             'wikipedia.org', 'linkedin.com', 'facebook.com']

        for domain in aggregator_domains:
            if domain in url:
                # Try to extract the actual org website from description or content
                website_match = re.search(r'(?:website|site|web)[:\s]*(https?://[^\s]+)', description, re.IGNORECASE)
                if website_match:
                    return self._clean_url(website_match.group(1))

                # Look for domain patterns in description
                domain_match = re.search(r'\b(?:www\.)?([a-z0-9-]+\.(?:org|eu|com|net|edu|gov)(?:\.[a-z]{2})?)', description, re.IGNORECASE)
                if domain_match:
                    domain = domain_match.group(0)
                    if not domain.startswith('http'):
                        domain = 'https://' + domain
                    return self._clean_url(domain)

        # Otherwise, extract the main domain from the URL
        match = re.match(r'(https?://[^/]+)', url)
        if match:
            return self._clean_url(match.group(1))

        return self._clean_url(url)

    def _is_homepage(self, url: str) -> bool:
        """Check if URL is likely a homepage"""
        # Remove protocol and www
        clean = re.sub(r'^https?://(www\.)?', '', url)
        # Check if it's just domain or domain with simple paths
        return bool(re.match(r'^[^/]+/?(?:index\.[a-z]+)?$', clean, re.IGNORECASE))

    def _clean_url(self, url: str) -> str:
        """Clean URL while preserving its validity"""
        # Remove fragments and trailing slashes
        url = re.sub(r'#.*$', '', url)
        url = url.rstrip('/')
        # Ensure it has a protocol
        if not url.startswith(('http://', 'https://')):
            url = 'https://' + url
        return url

    def _validate_partner(self, partner: Dict) -> bool:
        """Validate that partner data is reasonable"""
        # Must have name and website
        if not partner.get('name') or not partner.get('website'):
            return False

        # Name should not be too generic
        generic_names = ['home', 'index', 'about', 'contact', 'page', 'site']
        if partner['name'].lower() in generic_names:
            return False

        # Website should be valid
        if not partner['website'].startswith(('http://', 'https://')):
            return False

        # Should have a reasonable description
        if len(partner.get('description', '')) < 20:
            return False

        return True

    def _deduplicate_partners(self, partners: List[Dict]) -> List[Dict]:
        """Remove duplicate partners based on name and website"""
        seen = set()
        unique_partners = []

        for partner in partners:
            # Create a unique key
            key = (
                partner['name'].lower().strip(),
                partner.get('website', '').lower().strip('/')
            )

            if key not in seen:
                seen.add(key)
                unique_partners.append(partner)

        return unique_partners

    async def enrich_partner_with_crawl(self, partner: Dict) -> Dict:
        """Enrich partner data by crawling their website using Firecrawl v2"""
        if not self.enabled or not partner.get('website'):
            return partner

        try:
            # Scrape the partner's website for more details using v2 API
            scraped_data = self.app.scrape(
                url=partner['website'],
                formats=[{'type': 'markdown'}],
                only_main_content=True
            )

            if scraped_data and 'markdown' in scraped_data:
                # Extract additional information from scraped content
                content = scraped_data['markdown'][:2000]  # Limit content size

                # Update description if current one is generic
                if len(partner.get('description', '')) < 100:
                    # Extract first substantial paragraph
                    paragraphs = content.split('\n\n')
                    for para in paragraphs:
                        if len(para) > 100 and not para.startswith('#'):
                            partner['description'] = para[:500]
                            break

                # Mark as enriched
                partner['is_enriched'] = True
                partner['crawled_content'] = content

        except Exception as e:
            logger.warning(f"Could not enrich partner {partner.get('name')}: {str(e)}")

        return partner