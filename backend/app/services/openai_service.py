from openai import AsyncOpenAI
from typing import Dict, List, Optional
import json
from app.core.config import settings
import logging

logger = logging.getLogger(__name__)

class OpenAIService:
    """Service for interacting with OpenAI API for form completion"""
    
    def __init__(self):
        self.client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY)
        self.model = settings.OPENAI_MODEL
        
    async def generate_answer(
        self,
        question: Dict,
        project_context: Dict,
        priorities_data: Dict,
        evaluation_criteria: Dict,
        previous_answers: Optional[Dict] = None
    ) -> str:
        """Generate an answer for a specific form question"""
        
        prompt = self._build_prompt(
            question, 
            project_context, 
            priorities_data, 
            evaluation_criteria,
            previous_answers
        )
        
        try:
            response = await self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {
                        "role": "system",
                        "content": "You are an expert Erasmus+ grant writer specializing in KA220-ADU applications. Write compelling, specific answers that maximize evaluation scores."
                    },
                    {
                        "role": "user",
                        "content": prompt
                    }
                ],
                max_tokens=1000,
                temperature=0.7
            )
            
            answer = response.choices[0].message.content
            
            # Ensure answer fits character limit
            if question.get("character_limit"):
                answer = self._trim_to_limit(answer, question["character_limit"])
            
            return answer
            
        except Exception as e:
            logger.error(f"Error generating answer for question {question.get('id')}: {str(e)}")
            raise
    
    def _build_prompt(
        self,
        question: Dict,
        project_context: Dict,
        priorities_data: Dict,
        evaluation_criteria: Dict,
        previous_answers: Optional[Dict] = None
    ) -> str:
        """Build a comprehensive prompt for OpenAI"""
        
        prompt = f"""
PROJECT CONTEXT:
- Title: {project_context.get('title', 'N/A')}
- Field: {project_context.get('field', 'Adult Education')}
- Duration: {project_context.get('duration', '24 months')}
- Budget: €{project_context.get('budget', '250,000')}
- Lead Organization: {project_context.get('lead_org', {})}
- Partner Organizations: {json.dumps(project_context.get('partners', []))}

PROJECT IDEA:
{project_context.get('project_idea', '')}

SELECTED PRIORITIES:
{json.dumps(priorities_data, indent=2)}

QUESTION TO ANSWER:
- Question ID: {question.get('id')}
- Question: {question.get('question')}
- Character Limit: {question.get('character_limit', 'No limit')}
- Evaluation Weight: {question.get('evaluation_weight', 'N/A')}/10

EVALUATION CRITERIA FOR THIS SECTION:
{json.dumps(evaluation_criteria, indent=2)}

TIPS FOR THIS QUESTION:
{json.dumps(question.get('tips', []))}

"""
        
        if previous_answers:
            prompt += f"""
PREVIOUS ANSWERS (for context and consistency):
{json.dumps(previous_answers, indent=2)}
"""
        
        prompt += f"""
INSTRUCTIONS:
1. Write a compelling, specific answer that directly addresses the question
2. Ensure alignment with selected EU priorities
3. Use concrete examples and measurable outcomes
4. Stay within {question.get('character_limit', 2000)} characters
5. Score maximum points according to evaluation criteria
6. Be professional, clear, and persuasive
7. Include specific details about activities, methods, and expected results
8. Demonstrate European added value where relevant

Generate the answer now:"""
        
        return prompt
    
    def _trim_to_limit(self, text: str, limit: int) -> str:
        """Trim text to character limit while maintaining coherence"""
        if len(text) <= limit:
            return text
        
        # Try to cut at sentence boundary
        trimmed = text[:limit]
        last_period = trimmed.rfind('.')
        if last_period > limit * 0.8:  # If we have a period in last 20%
            return trimmed[:last_period + 1]
        
        # Otherwise cut at word boundary
        last_space = trimmed.rfind(' ')
        if last_space > 0:
            return trimmed[:last_space] + "..."
        
        return trimmed[:limit-3] + "..."
    
    async def generate_full_application(
        self,
        project_context: Dict,
        form_questions: Dict
    ) -> Dict:
        """Generate answers for all questions in the application"""
        
        answers = {}
        
        # Load priorities and evaluation data
        priorities_data = self._load_priorities(project_context.get('selected_priorities', []))
        
        # Process each section
        for section_key, section_data in form_questions['sections'].items():
            section_answers = {}
            
            # Get evaluation criteria for this section
            evaluation_criteria = self._get_evaluation_criteria(section_key)
            
            for question in section_data['questions']:
                answer = await self.generate_answer(
                    question=question,
                    project_context=project_context,
                    priorities_data=priorities_data,
                    evaluation_criteria=evaluation_criteria,
                    previous_answers=answers
                )
                
                section_answers[question['field']] = {
                    'answer': answer,
                    'question_id': question['id'],
                    'character_count': len(answer),
                    'character_limit': question.get('character_limit', 0)
                }
            
            answers[section_key] = section_answers
        
        return answers
    
    def _load_priorities(self, selected_priorities: List[str]) -> Dict:
        """Load priority data from the knowledge base"""
        # This would load from the ERASMUS_PRIORITIES_2024.md file
        # For now, returning a simplified structure
        return {
            'horizontal': [
                'Inclusion and diversity',
                'Digital transformation',
                'Environment and fight against climate change',
                'Participation in democratic life'
            ],
            'selected': selected_priorities
        }
    
    def _get_evaluation_criteria(self, section: str) -> Dict:
        """Get evaluation criteria for a specific section"""
        # This would load from EVALUATION_CRITERIA_SCORING.md
        # Simplified structure for now
        criteria_map = {
            'relevance': {
                'max_score': 30,
                'focus': 'Alignment with priorities, needs analysis, innovation'
            },
            'partnership': {
                'max_score': 20,
                'focus': 'Partner complementarity, task distribution, coordination'
            },
            'impact': {
                'max_score': 25,
                'focus': 'Sustainability, dissemination, wider impact'
            },
            'project_management': {
                'max_score': 25,
                'focus': 'Quality assurance, risk management, accessibility'
            }
        }
        return criteria_map.get(section, {})