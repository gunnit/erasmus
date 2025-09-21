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

                logger.info(f"Firecrawl API response structure: {type(search_results)}")

                # Handle different response formats
                results_list = []
                if search_results:
                    if isinstance(search_results, dict):
                        if 'data' in search_results:
                            # Check for v2 format (data.web) or v1 format (data as list)
                            if isinstance(search_results['data'], dict):
                                # v2 format - data is an object with 'web', 'images', etc.
                                if 'web' in search_results['data']:
                                    results_list = search_results['data']['web']
                                    logger.info(f"Using v2 format, found {len(results_list)} web results")
                            elif isinstance(search_results['data'], list):
                                # v1 format - data is directly a list
                                results_list = search_results['data']
                                logger.info(f"Using v1 format, found {len(results_list)} results")
                    elif isinstance(search_results, list):
                        # Direct list response
                        results_list = search_results
                        logger.info(f"Direct list format, found {len(results_list)} results")

                for result in results_list:
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

        # Query 5: Search for specific known partner databases and networks
        queries.append('Erasmus+ project results platform partners')
        queries.append('EPALE adult learning organizations Europe')
        queries.append('European adult education association members')

        # Query 6: Direct organization searches
        if not any('site:' in q for q in queries):
            queries.append('European NGO adult education contact website')
            queries.append('EU partner organizations education training contacts')

        return queries

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