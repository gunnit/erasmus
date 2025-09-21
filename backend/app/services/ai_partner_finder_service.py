from typing import Dict, List, Optional
import json
import logging
from app.services.openai_service import OpenAIService
from app.db.models import Partner, PartnerType, Proposal
from sqlalchemy.orm import Session

logger = logging.getLogger(__name__)

class AIPartnerFinderService:
    """Service for AI-powered partner discovery and matching"""

    def __init__(self):
        self.openai_service = OpenAIService()

    async def find_partners_by_criteria(
        self,
        criteria: Dict,
        num_partners: int = 5
    ) -> List[Dict]:
        """
        Find partners based on custom search criteria

        Args:
            criteria: Dict containing search parameters like:
                - partner_types: List of partner types
                - countries: List of preferred countries
                - expertise_areas: List of required expertise
                - custom_requirements: Free text requirements
                - project_field: Field of the project
            num_partners: Number of partners to generate (1-10)

        Returns:
            List of partner dictionaries with all details
        """

        system_prompt = """You are an expert in European grant partnerships and Erasmus+ projects.
        Generate realistic partner organizations that would be suitable for Erasmus+ KA220-ADU projects.
        Focus on creating diverse, complementary partners that meet EU funding requirements."""

        user_prompt = f"""Generate {num_partners} partner organizations based on these criteria:

SEARCH CRITERIA:
- Partner Types: {criteria.get('partner_types', ['Any type'])}
- Preferred Countries: {criteria.get('countries', ['Any EU country'])}
- Required Expertise: {criteria.get('expertise_areas', [])}
- Custom Requirements: {criteria.get('custom_requirements', 'None specified')}
- Project Field: {criteria.get('project_field', 'Adult Education')}

For each partner, provide:
1. Organization name (realistic, avoid generic names)
2. Type (NGO, PUBLIC_INSTITUTION, PRIVATE_COMPANY, EDUCATIONAL_INSTITUTION, RESEARCH_CENTER, or SOCIAL_ENTERPRISE)
3. Country (EU member state or program country)
4. Website (realistic format, e.g., www.org-name.country-code)
5. Description (100-150 words, specific to their expertise and role)
6. Expertise areas (3-5 specific areas relevant to the criteria)
7. Why they're a good match (brief explanation)
8. Contact info (realistic email format using organization domain)

IMPORTANT:
- Create diverse partners from different countries
- Ensure complementary expertise across partners
- Make organizations sound real and credible
- Consider Erasmus+ partnership requirements
- Include at least one organization from each specified country if possible

Return as JSON array with this structure:
[
  {{
    "name": "Organization Name",
    "type": "NGO",
    "country": "Germany",
    "website": "www.example.de",
    "description": "Detailed description...",
    "expertise_areas": ["Digital literacy", "Adult education", "Social inclusion"],
    "match_reason": "Why this partner matches the criteria",
    "contact_info": {{
      "email": "contact@example.de",
      "phone": "+49 30 12345678"
    }},
    "compatibility_score": 85
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

    async def find_partners_for_proposal(
        self,
        proposal: Proposal,
        num_partners: int = 5
    ) -> List[Dict]:
        """
        Find partners that match a specific proposal

        Args:
            proposal: The proposal object to match partners for
            num_partners: Number of partners to generate

        Returns:
            List of partner dictionaries with compatibility scores
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

        system_prompt = """You are an expert in Erasmus+ KA220-ADU partnerships.
        Analyze the project and generate partner organizations that would strengthen this specific proposal.
        Consider the project's objectives, priorities, and existing partnerships to suggest complementary partners."""

        user_prompt = f"""Based on this Erasmus+ project, suggest {num_partners} ideal partner organizations:

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

REQUIREMENTS:
1. Suggest partners that complement existing partners (avoid duplication)
2. Ensure geographic diversity across EU
3. Include organizations with specific expertise needed for the project
4. Consider the project priorities when matching expertise
5. Each partner should bring unique value to the consortium

For each suggested partner, provide:
1. Organization name (realistic, specific to their field)
2. Type (NGO, PUBLIC_INSTITUTION, PRIVATE_COMPANY, EDUCATIONAL_INSTITUTION, RESEARCH_CENTER, or SOCIAL_ENTERPRISE)
3. Country (different from existing partners if possible)
4. Website (realistic format)
5. Description (focusing on relevance to this project)
6. Expertise areas (directly relevant to project needs)
7. Specific contribution to this project
8. Why they complement the existing consortium
9. Compatibility score (0-100) based on project fit

Return as JSON array with this structure:
[
  {{
    "name": "Organization Name",
    "type": "NGO",
    "country": "Country",
    "website": "www.example.org",
    "description": "Description focused on project relevance...",
    "expertise_areas": ["Relevant area 1", "Relevant area 2"],
    "project_contribution": "Specific contribution to this project",
    "match_reason": "Why this partner is ideal for this project",
    "contact_info": {{
      "email": "contact@example.org"
    }},
    "compatibility_score": 92
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