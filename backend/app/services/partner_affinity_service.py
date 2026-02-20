import json
import logging
from typing import Dict, Any, List
from openai import AsyncOpenAI
import os
from ..db.models import Partner
from ..core.config import settings

logger = logging.getLogger(__name__)

class PartnerAffinityService:
    """Service to calculate affinity between partners and projects using AI"""

    def __init__(self):
        self.openai_api_key = os.getenv("OPENAI_API_KEY")
        if not self.openai_api_key:
            raise ValueError("OPENAI_API_KEY environment variable is not set")
        self.client = AsyncOpenAI(api_key=self.openai_api_key)
        self.model = settings.OPENAI_MODEL

    async def calculate_affinity(self, partner: Partner, project_context: Dict[str, Any]) -> Dict[str, Any]:
        """
        Calculate affinity score between a partner and a project

        Returns:
            Dict with score (0-100), explanation, and contributing factors
        """
        try:
            # Prepare partner information
            partner_info = {
                "name": partner.name,
                "type": partner.type.value if partner.type else "Unknown",
                "country": partner.country,
                "description": partner.description or "",
                "expertise_areas": partner.expertise_areas or [],
                "website": partner.website
            }

            # Add crawled data if available
            if partner.crawled_data:
                partner_info["services"] = partner.crawled_data.get("services", [])
                partner_info["additional_expertise"] = partner.crawled_data.get("expertise", [])

            # Create the prompt for affinity analysis
            prompt = self._create_affinity_prompt(partner_info, project_context)

            # Call OpenAI API using async client
            response = await self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "developer", "content": "You are an expert in analyzing partner compatibility for Erasmus+ projects. Provide detailed analysis of how well a partner fits with a project."},
                    {"role": "user", "content": prompt}
                ],
                max_tokens=1500,
                temperature=0.7,
                reasoning_effort="none"
            )

            # Parse the response
            result = self._parse_affinity_response(response.choices[0].message.content)

            return result

        except Exception as e:
            logger.error(f"Error calculating affinity: {str(e)}")
            # Return a default score with error explanation
            return {
                "score": 50.0,
                "explanation": f"Could not calculate precise affinity due to an error: {str(e)}. Default score assigned.",
                "factors": []
            }

    def _create_affinity_prompt(self, partner_info: Dict, project_context: Dict) -> str:
        """Create a detailed prompt for affinity calculation"""

        prompt = f"""Analyze the compatibility between this partner and Erasmus+ project.

PARTNER INFORMATION:
- Name: {partner_info['name']}
- Type: {partner_info['type']}
- Country: {partner_info['country']}
- Description: {partner_info['description']}
- Expertise Areas: {', '.join(partner_info['expertise_areas']) if partner_info['expertise_areas'] else 'Not specified'}
- Services: {', '.join(partner_info.get('services', [])) if partner_info.get('services') else 'Not specified'}

PROJECT INFORMATION:
- Title: {project_context.get('title', 'Not specified')}
- Project Idea: {project_context.get('project_idea', 'Not specified')}
- Target Groups: {', '.join(project_context.get('target_groups', [])) if project_context.get('target_groups') else 'Not specified'}
- EU Priorities: {', '.join(project_context.get('priorities', [])) if project_context.get('priorities') else 'Not specified'}
- Duration: {project_context.get('duration_months', 'Not specified')} months
- Budget: {project_context.get('budget', 'Not specified')}
- Key Objectives: {project_context.get('objectives', 'Not specified')}

Please analyze and provide:
1. An affinity score from 0-100 (where 100 is perfect match)
2. A brief explanation (2-3 sentences) of why this score was given
3. List 3-5 key factors that contributed to this score

Format your response as JSON:
{{
    "score": [0-100],
    "explanation": "Brief explanation of the score",
    "factors": [
        {{"factor": "Factor name", "impact": "positive/negative", "description": "Brief description"}},
        ...
    ]
}}
"""
        return prompt

    def _parse_affinity_response(self, response_text: str) -> Dict[str, Any]:
        """Parse the AI response into structured data"""
        try:
            # Try to extract JSON from the response
            import re
            json_match = re.search(r'\{.*\}', response_text, re.DOTALL)

            if json_match:
                result = json.loads(json_match.group())

                # Validate and clean the result
                score = float(result.get('score', 50))
                score = max(0, min(100, score))  # Ensure score is between 0-100

                return {
                    "score": score,
                    "explanation": result.get('explanation', 'No explanation provided'),
                    "factors": result.get('factors', [])
                }
            else:
                # Fallback parsing if JSON extraction fails
                lines = response_text.strip().split('\n')
                score = 50.0

                # Try to extract score from text
                for line in lines:
                    if 'score' in line.lower():
                        numbers = re.findall(r'\d+', line)
                        if numbers:
                            score = float(numbers[0])
                            break

                return {
                    "score": score,
                    "explanation": "Analysis completed but formatting was unclear",
                    "factors": []
                }

        except json.JSONDecodeError:
            return {
                "score": 50.0,
                "explanation": "Could not parse the affinity analysis properly",
                "factors": []
            }

    async def batch_calculate_affinity(self, partners: List[Partner], project_context: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Calculate affinity for multiple partners"""
        results = []

        for partner in partners:
            result = await self.calculate_affinity(partner, project_context)
            results.append({
                "partner_id": partner.id,
                "partner_name": partner.name,
                **result
            })

        # Sort by score (highest first)
        results.sort(key=lambda x: x['score'], reverse=True)

        return results

    async def suggest_partner_improvements(self, partner: Partner, project_context: Dict[str, Any]) -> Dict[str, Any]:
        """Suggest improvements to increase partner affinity"""
        prompt = f"""Based on this partner and project, suggest specific improvements:

PARTNER: {partner.name} ({partner.type.value if partner.type else 'Unknown'})
Current expertise: {', '.join(partner.expertise_areas or [])}

PROJECT: {project_context.get('title', 'Erasmus+ Project')}
Priorities: {', '.join(project_context.get('priorities', []))}

Suggest 3-5 specific improvements the partner could make to better align with this project.
Format as a JSON list of improvements with priority (high/medium/low).
"""

        try:
            response = await self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "developer", "content": "You are an Erasmus+ partnership expert."},
                    {"role": "user", "content": prompt}
                ],
                max_tokens=1024,
                temperature=0.7,
                reasoning_effort="none"
            )

            # Parse and return suggestions
            suggestions = response.choices[0].message.content
            return {"suggestions": suggestions}

        except Exception as e:
            logger.error(f"Error suggesting partner improvements: {str(e)}")
            return {"error": str(e), "suggestions": []}
