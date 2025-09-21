from typing import Dict, List, Optional
import json
import logging
from app.services.openai_service import OpenAIService
from app.services.firecrawl_search_service import FirecrawlSearchService
from app.db.models import Partner, PartnerType, Proposal
from sqlalchemy.orm import Session

logger = logging.getLogger(__name__)

class AIPartnerFinderService:
    """Service for AI-powered partner discovery and matching using real data"""

    def __init__(self):
        self.openai_service = OpenAIService()
        self.search_service = FirecrawlSearchService()

    async def find_partners_by_criteria(
        self,
        criteria: Dict,
        num_partners: int = 5
    ) -> List[Dict]:
        """
        Find REAL partners based on custom search criteria using web search

        Args:
            criteria: Dict containing search parameters like:
                - partner_types: List of partner types
                - countries: List of preferred countries
                - expertise_areas: List of required expertise
                - custom_requirements: Free text requirements
                - project_field: Field of the project
            num_partners: Number of partners to find (1-10)

        Returns:
            List of partner dictionaries with real organization details
        """

        # First, search for real organizations
        logger.info("Searching for real partner organizations")
        real_partners = await self.search_service.search_partners(
            search_criteria=criteria,
            num_results=num_partners * 2  # Search for more to have options
        )

        if not real_partners:
            logger.warning("No real partners found via web search, falling back to AI suggestions")
            return await self._generate_ai_partner_suggestions(criteria, num_partners)

        # Use AI to analyze and rank the real partners
        system_prompt = """You are an expert in European grant partnerships and Erasmus+ projects.
        Analyze these REAL organizations and evaluate their suitability for Erasmus+ KA220-ADU projects.
        Rank them based on their alignment with the criteria and potential contribution to the project."""

        user_prompt = f"""Analyze these real organizations found through web search:

ORGANIZATIONS FOUND:
{json.dumps(real_partners, indent=2)}

SEARCH CRITERIA:
- Partner Types: {criteria.get('partner_types', ['Any type'])}
- Preferred Countries: {criteria.get('countries', ['Any EU country'])}
- Required Expertise: {criteria.get('expertise_areas', [])}
- Custom Requirements: {criteria.get('custom_requirements', 'None specified')}
- Project Field: {criteria.get('project_field', 'Adult Education')}

For each organization:
1. Evaluate their suitability for Erasmus+ KA220-ADU projects
2. Score their compatibility (0-100) based on:
   - Alignment with search criteria
   - Relevance to adult education
   - European/international experience
   - Complementarity with other partners
3. Enhance their description with relevant details
4. Identify their key expertise areas
5. Explain why they're a good match

Select the top {num_partners} organizations and return them with enhanced information.

IMPORTANT:
- These are REAL organizations - do not change their names or websites
- You can enhance descriptions but keep them factual
- Focus on their actual capabilities and experience
- Rank by true compatibility with the project needs

Return as JSON array with this structure:
[
  {{
    "name": "[Keep original name]",
    "type": "[Determined type]",
    "country": "[Keep original country]",
    "website": "[Keep original website]",
    "description": "[Enhanced description based on real information]",
    "expertise_areas": ["Based on actual expertise"],
    "match_reason": "Why this real organization matches the criteria",
    "contact_info": {{
      "website": "[Original website]"
    }},
    "compatibility_score": 85,
    "is_verified": true
  }}
]"""

        try:
            response = await self.openai_service.generate_completion(
                system_prompt=system_prompt,
                user_prompt=user_prompt,
                max_tokens=2000,
                temperature=0.8
            )

            # Parse the JSON response
            partners_data = json.loads(response)

            # Add temporary IDs and validate data
            for i, partner in enumerate(partners_data):
                partner['temp_id'] = f"ai_suggested_{i}"
                partner['is_ai_generated'] = True

                # Ensure compatibility score is present
                if 'compatibility_score' not in partner:
                    partner['compatibility_score'] = 75  # Default score

                # Validate partner type
                if partner.get('type', '').upper() not in [t.name for t in PartnerType]:
                    partner['type'] = 'NGO'  # Default to NGO if invalid

            return partners_data

        except json.JSONDecodeError as e:
            logger.error(f"Failed to parse AI response as JSON: {e}")
            # Try to extract JSON from the response
            try:
                import re
                json_match = re.search(r'\[.*\]', response, re.DOTALL)
                if json_match:
                    partners_data = json.loads(json_match.group())
                    for i, partner in enumerate(partners_data):
                        partner['temp_id'] = f"ai_suggested_{i}"
                        partner['is_ai_generated'] = True
                    return partners_data
            except:
                pass

            raise ValueError("Failed to generate valid partner suggestions")

        except Exception as e:
            logger.error(f"Error generating partners by criteria: {str(e)}")
            raise

    async def _generate_ai_partner_suggestions(
        self,
        criteria: Dict,
        num_partners: int
    ) -> List[Dict]:
        """
        Fallback to AI suggestions when no real partners are found.
        Makes it clear these are suggestions, not real organizations.
        """

        system_prompt = """You are an expert in European grant partnerships.
        Since no real organizations were found through search, suggest TYPES of organizations
        that would be ideal partners. Make it clear these are suggestions for what to look for,
        not real organizations."""

        user_prompt = f"""No real organizations were found matching the criteria.
        Suggest {num_partners} TYPES of partner organizations to search for:

CRITERIA:
- Partner Types: {criteria.get('partner_types', ['Any type'])}
- Countries: {criteria.get('countries', ['Any EU country'])}
- Expertise: {criteria.get('expertise_areas', [])}
- Requirements: {criteria.get('custom_requirements', '')}
- Field: {criteria.get('project_field', 'Adult Education')}

For each suggestion, provide:
1. Suggested type of organization
2. Recommended country/region
3. Key expertise to look for
4. Why this type would be valuable
5. Where to search for such partners

Make it CLEAR these are suggestions, not real organizations.
Use phrases like "Look for...", "Search for...", "Consider organizations that..."

Return as JSON array:
[
  {{
    "name": "SUGGESTION: Type of organization to look for",
    "type": "NGO",
    "country": "Recommended country",
    "website": "N/A - This is a suggestion",
    "description": "Look for organizations that...",
    "expertise_areas": ["Expertise to search for"],
    "match_reason": "Why this type of partner would be valuable",
    "is_suggestion": true,
    "search_tips": "Where and how to find such organizations"
  }}
]"""

        try:
            response = await self.openai_service.generate_completion(
                system_prompt=system_prompt,
                user_prompt=user_prompt,
                max_tokens=1500,
                temperature=0.7
            )

            suggestions = json.loads(response)
            for suggestion in suggestions:
                suggestion['is_ai_generated'] = True
                suggestion['is_suggestion'] = True
                suggestion['is_verified'] = False

            return suggestions

        except Exception as e:
            logger.error(f"Error generating partner suggestions: {str(e)}")
            return []

    async def find_partners_for_proposal(
        self,
        proposal: Proposal,
        num_partners: int = 5
    ) -> List[Dict]:
        """
        Find REAL partners that match a specific proposal using web search

        Args:
            proposal: The proposal object to match partners for
            num_partners: Number of partners to find

        Returns:
            List of real partner dictionaries with compatibility scores
        """

        # Extract relevant information from the proposal
        project_context = {
            'title': proposal.title,
            'project_idea': proposal.project_idea,
            'priorities': proposal.priorities,
            'target_groups': proposal.target_groups,
            'duration': proposal.duration_months,
            'budget': proposal.budget,
            'existing_partners': proposal.partners or []
        }

        # Build search criteria from proposal
        criteria = {
            'project_field': 'Adult Education',
            'expertise_areas': self._extract_expertise_from_proposal(proposal),
            'countries': self._suggest_countries_for_proposal(proposal),
            'custom_requirements': f"{proposal.title} {proposal.project_idea[:200]}"
        }

        # Search for real partners
        real_partners = await self.search_service.search_partners(
            search_criteria=criteria,
            num_results=num_partners * 2
        )

        if not real_partners:
            logger.warning("No real partners found for proposal, using AI suggestions")
            return await self._generate_ai_partner_suggestions(criteria, num_partners)

        system_prompt = """You are an expert in Erasmus+ KA220-ADU partnerships.
        Analyze these REAL organizations and evaluate their fit for this specific proposal.
        Consider the project's objectives, priorities, and existing partnerships."""

        user_prompt = f"""Analyze these REAL organizations for the Erasmus+ project and select the best {num_partners}:

REAL ORGANIZATIONS FOUND:
{json.dumps(real_partners, indent=2)}

PROJECT DETAILS:
Title: {project_context['title']}
Duration: {project_context.get('duration', 24)} months
Budget: {project_context.get('budget', '€250,000')}

PROJECT IDEA:
{project_context['project_idea'][:500]}...

PRIORITIES:
{json.dumps(project_context.get('priorities', []), indent=2)}

TARGET GROUPS:
{json.dumps(project_context.get('target_groups', []), indent=2)}

EXISTING PARTNERS:
{json.dumps(project_context.get('existing_partners', []), indent=2)}

EVALUATION CRITERIA:
1. How well they complement existing partners (avoid duplication)
2. Geographic diversity across EU
3. Specific expertise matching project needs
4. Alignment with project priorities
5. Unique value they bring to the consortium

For each organization:
1. Keep their REAL name and website unchanged
2. Enhance their description based on project relevance
3. Identify their expertise areas relevant to this project
4. Explain their specific contribution
5. Score their compatibility (0-100)

Return the top {num_partners} as JSON:
[
  {{
    "name": "[Keep real name]",
    "type": "[Determined type]",
    "country": "[Keep real country]",
    "website": "[Keep real website]",
    "description": "Enhanced description showing project relevance...",
    "expertise_areas": ["Real expertise areas"],
    "project_contribution": "Specific contribution to this project",
    "match_reason": "Why this real partner fits this project",
    "contact_info": {{
      "website": "[Keep real website]"
    }},
    "compatibility_score": 92,
    "is_verified": true
  }}
]"""

        try:
            response = await self.openai_service.generate_completion(
                system_prompt=system_prompt,
                user_prompt=user_prompt,
                max_tokens=2500,
                temperature=0.7
            )

            # Parse the JSON response
            partners_data = json.loads(response)

            # Enhance partner data with project-specific information
            for i, partner in enumerate(partners_data):
                partner['temp_id'] = f"ai_proposal_{proposal.id}_{i}"
                partner['is_ai_generated'] = True
                partner['matched_for_proposal'] = proposal.id
                partner['proposal_title'] = proposal.title

                # Ensure all required fields are present
                if 'compatibility_score' not in partner:
                    partner['compatibility_score'] = 80

                if 'project_contribution' in partner and 'match_reason' not in partner:
                    partner['match_reason'] = partner['project_contribution']

            # Sort by compatibility score
            partners_data.sort(key=lambda x: x.get('compatibility_score', 0), reverse=True)

            return partners_data

        except json.JSONDecodeError as e:
            logger.error(f"Failed to parse AI response as JSON: {e}")
            # Try to extract JSON from the response
            try:
                import re
                json_match = re.search(r'\[.*\]', response, re.DOTALL)
                if json_match:
                    partners_data = json.loads(json_match.group())
                    for i, partner in enumerate(partners_data):
                        partner['temp_id'] = f"ai_proposal_{proposal.id}_{i}"
                        partner['is_ai_generated'] = True
                    return partners_data
            except:
                pass

            raise ValueError("Failed to generate valid partner suggestions")

        except Exception as e:
            logger.error(f"Error generating partners for proposal: {str(e)}")
            raise

    async def enrich_partner_data(self, partner_data: Dict) -> Dict:
        """
        Enrich AI-generated partner data with additional details

        Args:
            partner_data: Basic partner information

        Returns:
            Enriched partner dictionary
        """

        system_prompt = """You are an expert in European organizations and Erasmus+ partnerships.
        Enrich the partner information with realistic, detailed data that would be found on their website."""

        user_prompt = f"""Enrich this partner organization's data with additional realistic details:

CURRENT DATA:
{json.dumps(partner_data, indent=2)}

Please add or enhance:
1. Extended description (200-250 words)
2. Mission statement
3. Key achievements or projects (2-3 examples)
4. Team size estimate
5. Years of experience
6. Specific methodologies or approaches they use
7. Previous EU project experience (if applicable)
8. Languages spoken
9. Social media presence (LinkedIn, Twitter)

Keep all existing data and add the new information. Return as JSON with the enhanced data."""

        try:
            response = await self.openai_service.generate_completion(
                system_prompt=system_prompt,
                user_prompt=user_prompt,
                max_tokens=1000,
                temperature=0.7
            )

            enriched_data = json.loads(response)

            # Merge with original data (preserving original fields)
            for key, value in partner_data.items():
                if key not in enriched_data:
                    enriched_data[key] = value

            enriched_data['is_enriched'] = True

            return enriched_data

        except Exception as e:
            logger.error(f"Error enriching partner data: {str(e)}")
            # Return original data if enrichment fails
            return partner_data

    def validate_partner_data(self, partner_data: Dict) -> bool:
        """
        Validate that partner data has all required fields

        Args:
            partner_data: Partner dictionary to validate

        Returns:
            True if valid, False otherwise
        """
        required_fields = ['name', 'type', 'country']

        for field in required_fields:
            if field not in partner_data or not partner_data[field]:
                return False

        # Validate partner type
        try:
            if partner_data.get('type', '').upper() not in [t.name for t in PartnerType]:
                return False
        except:
            return False

        return True

    async def analyze_partnership_gaps(
        self,
        existing_partners: List[Partner],
        project_context: Dict
    ) -> Dict:
        """
        Analyze gaps in the current partnership and suggest what's missing

        Args:
            existing_partners: List of current partners
            project_context: Project details

        Returns:
            Analysis of partnership gaps and recommendations
        """

        # Analyze current partnership composition
        countries = [p.country for p in existing_partners if p.country]
        types = [p.type.value if hasattr(p.type, 'value') else p.type for p in existing_partners]
        expertise = []
        for p in existing_partners:
            if p.expertise_areas:
                expertise.extend(p.expertise_areas)

        system_prompt = """You are an expert in Erasmus+ partnership requirements.
        Analyze the partnership composition and identify gaps or areas for improvement."""

        user_prompt = f"""Analyze this Erasmus+ partnership and identify gaps:

PROJECT CONTEXT:
{json.dumps(project_context, indent=2)}

CURRENT PARTNERSHIP:
- Countries represented: {countries}
- Partner types: {types}
- Combined expertise: {list(set(expertise))}
- Number of partners: {len(existing_partners)}

Please provide:
1. Geographic gaps (which regions/countries would strengthen the partnership)
2. Expertise gaps (what skills or knowledge areas are missing)
3. Partner type gaps (what types of organizations would add value)
4. Strategic recommendations for partnership improvement
5. EU funding compliance issues (if any)

Return as JSON with clear, actionable recommendations."""

        try:
            response = await self.openai_service.generate_completion(
                system_prompt=system_prompt,
                user_prompt=user_prompt,
                max_tokens=800,
                temperature=0.6
            )

            analysis = json.loads(response)
            return analysis

        except Exception as e:
            logger.error(f"Error analyzing partnership gaps: {str(e)}")
            # Return basic analysis if AI fails
            return {
                "geographic_gaps": f"Consider adding partners from {'Southern Europe' if 'Spain' not in countries else 'Northern Europe'}",
                "expertise_gaps": "Unable to determine specific gaps",
                "recommendations": ["Add more diverse partners", "Ensure all work packages have expert partners"]
            }

    def _extract_expertise_from_proposal(self, proposal: Proposal) -> List[str]:
        """Extract expertise areas from proposal content"""
        expertise = []

        # Extract from priorities
        if proposal.priorities:
            for priority in proposal.priorities:
                if 'digital' in priority.lower():
                    expertise.append('Digital transformation')
                elif 'inclusion' in priority.lower():
                    expertise.append('Social inclusion')
                elif 'environment' in priority.lower():
                    expertise.append('Sustainability')
                elif 'democratic' in priority.lower():
                    expertise.append('Civic engagement')

        # Extract from project idea
        if proposal.project_idea:
            idea_lower = proposal.project_idea.lower()
            if 'technology' in idea_lower or 'digital' in idea_lower:
                expertise.append('Digital skills')
            if 'training' in idea_lower or 'education' in idea_lower:
                expertise.append('Adult education')
            if 'employment' in idea_lower or 'job' in idea_lower:
                expertise.append('Employment')

        # Extract from target groups
        if proposal.target_groups:
            for group in proposal.target_groups:
                if 'educator' in group.lower():
                    expertise.append('Teacher training')
                elif 'migrant' in group.lower() or 'refugee' in group.lower():
                    expertise.append('Migration and integration')

        # Remove duplicates
        return list(set(expertise))

    def _suggest_countries_for_proposal(self, proposal: Proposal) -> List[str]:
        """Suggest countries for partners based on existing partners"""
        countries = []

        # Get existing partner countries
        existing_countries = set()
        if proposal.partners:
            for partner in proposal.partners:
                if isinstance(partner, dict) and partner.get('country'):
                    existing_countries.add(partner['country'])

        # Suggest complementary countries
        all_eu_countries = [
            'Germany', 'France', 'Italy', 'Spain', 'Portugal', 'Netherlands',
            'Belgium', 'Austria', 'Poland', 'Czech Republic', 'Slovakia',
            'Hungary', 'Romania', 'Bulgaria', 'Greece', 'Sweden', 'Denmark',
            'Finland', 'Ireland', 'Croatia', 'Slovenia', 'Lithuania', 'Latvia',
            'Estonia', 'Luxembourg', 'Malta', 'Cyprus'
        ]

        # Prioritize countries not yet in partnership
        for country in all_eu_countries:
            if country not in existing_countries:
                countries.append(country)
                if len(countries) >= 5:
                    break

        return countries if countries else ['Germany', 'France', 'Italy', 'Spain', 'Netherlands']