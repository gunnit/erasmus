from typing import Dict, List, Optional
import logging
import re
from firecrawl import FirecrawlApp
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
            self.app = FirecrawlApp(api_key=settings.FIRECRAWL_API_KEY)

    async def search_partners(
        self,
        search_criteria: Dict,
        num_results: int = 10
    ) -> List[Dict]:
        """
        Search for real partner organizations based on criteria

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

        # Build search queries based on criteria
        search_queries = self._build_search_queries(search_criteria)

        for query in search_queries[:3]:  # Limit to 3 queries to avoid too many API calls
            try:
                logger.info(f"Searching for partners with query: {query}")

                # Perform the search
                search_results = self.app.search(
                    query=query,
                    limit=num_results
                )

                if search_results and 'data' in search_results:
                    for result in search_results['data']:
                        partner = self._extract_partner_from_result(result, search_criteria)
                        if partner and self._validate_partner(partner):
                            partners.append(partner)

            except Exception as e:
                logger.error(f"Error searching with Firecrawl: {str(e)}")
                continue

        # Remove duplicates based on name and website
        partners = self._deduplicate_partners(partners)

        # Limit to requested number
        return partners[:num_results]

    def _build_search_queries(self, criteria: Dict) -> List[str]:
        """Build effective search queries for finding real organizations"""
        queries = []

        # Extract criteria
        partner_types = criteria.get('partner_types', [])
        countries = criteria.get('countries', [])
        expertise_areas = criteria.get('expertise_areas', [])
        project_field = criteria.get('project_field', 'Adult Education')
        custom_requirements = criteria.get('custom_requirements', '')

        # Build targeted queries for Erasmus+ partners
        base_terms = [
            "Erasmus+ partner organization",
            "EU funded project partner",
            "European education organization",
            "adult education NGO Europe",
            "vocational training organization EU"
        ]

        # Query 1: General Erasmus+ partners with country
        if countries:
            country_str = ' OR '.join([f'"{country}"' for country in countries[:3]])
            queries.append(f'Erasmus+ partner organizations ({country_str}) adult education')
        else:
            queries.append('Erasmus+ partner organizations Europe adult education')

        # Query 2: Specific expertise areas
        if expertise_areas:
            expertise_str = ' '.join(expertise_areas[:2])
            queries.append(f'{expertise_str} organization Europe education training')

        # Query 3: Partner type specific
        if partner_types:
            for ptype in partner_types[:2]:
                if ptype == 'NGO':
                    queries.append('NGO adult education Europe Erasmus partnership')
                elif ptype == 'EDUCATIONAL_INSTITUTION':
                    queries.append('university college adult education Europe international cooperation')
                elif ptype == 'PUBLIC_INSTITUTION':
                    queries.append('public institution adult education Europe EU projects')
                elif ptype == 'RESEARCH_CENTER':
                    queries.append('research center education Europe EU funded projects')

        # Query 4: Custom requirements
        if custom_requirements:
            queries.append(f'{custom_requirements} organization Europe')

        # Query 5: Search partner databases
        queries.append('site:ec.europa.eu/programmes/erasmus-plus partner organization')
        queries.append('site:epale.ec.europa.eu organization adult learning')

        return queries

    def _extract_partner_from_result(self, result: Dict, criteria: Dict) -> Optional[Dict]:
        """Extract partner information from search result"""
        try:
            # Get basic info from search result
            url = result.get('url', '')
            title = result.get('title', '')
            description = result.get('description', '') or result.get('snippet', '')

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

            # Clean and validate website URL
            website = self._clean_website_url(url)

            # Build partner data
            partner = {
                'name': org_name,
                'type': partner_type,
                'country': country,
                'website': website,
                'description': description[:500] if description else f"{org_name} is an organization involved in European education and training projects.",
                'expertise_areas': expertise_areas,
                'source': 'web_search',
                'is_verified': True,
                'search_result_url': url,
                'contact_info': {
                    'website': website
                }
            }

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

    def _clean_website_url(self, url: str) -> str:
        """Clean and validate website URL"""
        # Remove trailing slashes and fragments
        url = re.sub(r'[#?].*$', '', url)
        url = url.rstrip('/')

        # Extract main domain if it's a subpage
        if url.count('/') > 2:
            # Keep only the domain
            match = re.match(r'(https?://[^/]+)', url)
            if match:
                url = match.group(1)

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
        """Enrich partner data by crawling their website"""
        if not self.enabled or not partner.get('website'):
            return partner

        try:
            # Scrape the partner's website for more details
            scraped_data = self.app.scrape_url(
                url=partner['website'],
                params={
                    'formats': ['markdown'],
                    'onlyMainContent': True
                }
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