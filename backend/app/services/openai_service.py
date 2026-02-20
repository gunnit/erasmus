from openai import AsyncOpenAI
from typing import Dict, List, Optional
import json
from app.core.config import settings
import logging
import asyncio
from functools import wraps

logger = logging.getLogger(__name__)

def with_timeout(timeout_seconds=60):
    """Decorator to add timeout to async OpenAI calls"""
    def decorator(func):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            try:
                return await asyncio.wait_for(
                    func(*args, **kwargs),
                    timeout=timeout_seconds
                )
            except asyncio.TimeoutError:
                logger.error(f"OpenAI API call timed out after {timeout_seconds} seconds")
                raise TimeoutError(f"AI generation timed out after {timeout_seconds} seconds. Please try again.")
        return wrapper
    return decorator

class OpenAIService:
    """Service for interacting with OpenAI API for form completion"""

    def __init__(self):
        if not settings.OPENAI_API_KEY:
            logger.error("OPENAI_API_KEY is not set in environment variables")
            raise ValueError("OPENAI_API_KEY is not configured")

        if settings.OPENAI_API_KEY == "sk-...":
            logger.error("OPENAI_API_KEY is still set to placeholder value")
            raise ValueError("OPENAI_API_KEY is not properly configured")

        logger.info(f"Initializing OpenAI client with model: {settings.OPENAI_MODEL}")
        self.client = AsyncOpenAI(
            api_key=settings.OPENAI_API_KEY,
            timeout=90.0,  # 90 second timeout for API requests
            max_retries=2   # Retry failed requests twice
        )
        self.model = settings.OPENAI_MODEL

    async def generate_project_description(self, title: str, existing_description: str = "") -> str:
        """
        Generate or enhance a project description for Erasmus+ grant
        """
        if existing_description:
            # Enhance existing description
            prompt = f"""
            You have a draft project description for an Erasmus+ KA220-ADU (Adult Education) grant application.
            Your task is to enhance, expand, and improve it to create a comprehensive grant-worthy description.

            Project Title: {title if title else "(Title to be determined)"}

            Existing Description/Ideas:
            {existing_description}

            Please enhance this into a comprehensive 600-800 word description that:

            1. PRESERVES the user's core ideas and concepts
            2. EXPANDS on their vision with specific details
            3. STRUCTURES the content professionally for grant applications
            4. ADDS missing essential elements for Erasmus+ grants:
               - European dimension and transnational relevance
               - Specific, measurable objectives
               - Clear target groups and their needs
               - Innovative methodology and activities
               - Expected results and sustainability
               - Alignment with EU priorities

            5. IMPROVES the language to be:
               - Professional and suitable for EU grants
               - Specific with concrete examples
               - Ambitious yet realistic
               - Clear and compelling

            Maintain the user's original intent while transforming it into a winning grant proposal description.
            """
        else:
            # Generate from scratch using only title
            prompt = f"""
            Create a detailed and compelling project description for an Erasmus+ KA220-ADU (Adult Education) grant application.

            Project Title: {title}

            Generate a comprehensive 600-800 word description that includes:

            1. PROJECT CONTEXT & RATIONALE (150 words)
            - Why this project is needed now
            - Current challenges in adult education it addresses
            - European dimension and transnational relevance

            2. OBJECTIVES & INNOVATION (150 words)
            - 3-4 specific, measurable objectives
            - Innovative aspects and unique approach
            - How it differs from existing solutions

            3. TARGET GROUPS & NEEDS (150 words)
            - Primary beneficiaries (adult learners, educators, organizations)
            - Specific needs being addressed
            - Expected number of participants

            4. METHODOLOGY & ACTIVITIES (150 words)
            - Key project activities and phases
            - Pedagogical approaches
            - Digital tools and resources to be developed

            5. EXPECTED RESULTS & IMPACT (150 words)
            - Tangible outputs (courses, materials, platforms)
            - Short and long-term impact
            - Sustainability measures
            - Contribution to EU policy priorities

            Make it specific, ambitious yet realistic, and aligned with Erasmus+ priorities for adult education.
            Use clear, professional language suitable for EU grant applications.
            Include concrete examples and avoid generic statements.
            """

        try:
            response = await self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {
                        "role": "developer",
                        "content": "You are an expert Erasmus+ grant writer specializing in KA220-ADU adult education projects. Write compelling, specific, and innovative project descriptions that align with EU priorities. When enhancing existing descriptions, preserve the user's original ideas while elevating them to grant-winning quality."
                    },
                    {
                        "role": "user",
                        "content": prompt
                    }
                ],
                max_tokens=2048,
                reasoning_effort="none"
            )

            return response.choices[0].message.content.strip()

        except Exception as e:
            logger.error(f"Error generating project description: {str(e)}")
            raise

    async def generate_completion(
        self,
        system_prompt: str,
        user_prompt: str,
        max_tokens: int = 1000,
        temperature: float = 0.7
    ) -> str:
        """
        Generate a completion using OpenAI API

        Args:
            system_prompt: The system role prompt
            user_prompt: The user prompt
            max_tokens: Maximum tokens to generate
            temperature: Sampling temperature (0-2)

        Returns:
            The generated text
        """
        try:
            logger.info(f"Generating completion with OpenAI {self.model}")

            response = await self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "developer", "content": system_prompt},
                    {"role": "user", "content": user_prompt}
                ],
                max_tokens=max_tokens,
                temperature=temperature,
                reasoning_effort="none"
            )

            # Check if we have a valid response
            if not response.choices:
                logger.error("OpenAI response has no choices")
                raise ValueError("OpenAI returned no response choices")

            answer = response.choices[0].message.content

            # Check if the answer is empty or None
            if answer is None:
                logger.error("OpenAI returned None as message content")
                raise ValueError("OpenAI returned empty response")

            if not answer.strip():
                logger.warning("OpenAI returned empty or whitespace-only response")
                # Don't raise an error for empty responses, let the caller handle it

            logger.info(f"Successfully generated completion of length {len(answer) if answer else 0}")
            return answer

        except Exception as e:
            error_msg = str(e)
            logger.error(f"Error generating completion: {error_msg}")

            # Handle quota exceeded error gracefully
            if "insufficient_quota" in error_msg.lower() or "exceeded your current quota" in error_msg.lower():
                logger.warning("OpenAI API quota exceeded - returning fallback message")
                raise ValueError(
                    "OpenAI API quota has been exceeded. Please check your OpenAI account billing and usage limits. "
                    "Visit https://platform.openai.com/account/billing to add credits or upgrade your plan."
                )

            raise

    async def generate_chat_completion(
        self,
        messages: List[Dict[str, str]],
        max_tokens: int = 1000,
        temperature: float = 0.7
    ) -> str:
        """
        Generate a chat completion using OpenAI API (async version)

        Args:
            messages: List of message dictionaries with 'role' and 'content'
            max_tokens: Maximum tokens to generate
            temperature: Sampling temperature (0-2)

        Returns:
            The generated text
        """
        try:
            logger.info(f"Generating chat completion with OpenAI {self.model}")

            response = await self.client.chat.completions.create(
                model=self.model,
                messages=messages,
                max_tokens=max_tokens,
                temperature=temperature,
                reasoning_effort="none"
            )

            # Check if we have a valid response
            if not response.choices:
                logger.error("OpenAI response has no choices")
                raise ValueError("OpenAI returned no response choices")

            answer = response.choices[0].message.content

            # Check if the answer is empty or None
            if answer is None:
                logger.error("OpenAI returned None as message content")
                raise ValueError("OpenAI returned empty response")

            logger.info(f"Successfully generated chat completion of length {len(answer) if answer else 0}")
            return answer

        except Exception as e:
            error_msg = str(e)
            logger.error(f"Error generating chat completion: {error_msg}")

            # Handle quota exceeded error gracefully
            if "insufficient_quota" in error_msg.lower() or "exceeded your current quota" in error_msg.lower():
                logger.warning("OpenAI API quota exceeded - returning fallback message")
                raise ValueError(
                    "OpenAI API quota has been exceeded. Please check your OpenAI account billing and usage limits. "
                    "Visit https://platform.openai.com/account/billing to add credits or upgrade your plan."
                )

            raise

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
                        "role": "developer",
                        "content": "You are an expert Erasmus+ grant writer specializing in KA220-ADU applications. Write compelling, specific answers that maximize evaluation scores."
                    },
                    {
                        "role": "user",
                        "content": prompt
                    }
                ],
                max_tokens=1500,  # Expanded for detailed grant answers
                temperature=0.7,
                reasoning_effort="none"
            )

            answer = response.choices[0].message.content

            # Return answer without trimming - let token limits control length
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