"""
Conversational AI Service for Interactive Grant Application Support
Provides real-time AI assistance for grant application development
"""
from typing import Dict, List, Optional, Any
import json
import logging
from datetime import datetime
import asyncio
from openai import AsyncOpenAI
from app.core.config import settings
from app.services.prompts_config import PromptsConfig

logger = logging.getLogger(__name__)

class ConversationalAIService:
    """
    Service for handling conversational AI interactions for grant applications
    Provides suggestions, answers questions, and helps improve proposals
    """

    def __init__(self):
        """Initialize the conversational AI service"""
        api_key = settings.OPENAI_API_KEY
        if not api_key or api_key == "your-openai-api-key-here":
            logger.error("OPENAI_API_KEY is not properly configured!")
            raise ValueError("OPENAI_API_KEY is not properly configured")

        self.client = AsyncOpenAI(
            api_key=api_key,
            max_retries=2,
            timeout=60.0,
        )
        self.model = settings.OPENAI_MODEL
        self.prompts = PromptsConfig()

    async def process_conversation(
        self,
        message: str,
        conversation_history: List[Dict],
        project_context: Optional[Dict] = None,
        current_answers: Optional[Dict] = None,
        mode: str = "general"  # "general", "improvement", "suggestion"
    ) -> Dict[str, Any]:
        """
        Process a conversational message and generate a response

        Args:
            message: User's message
            conversation_history: Previous messages in the conversation
            project_context: Current project information
            current_answers: Current form answers if available
            mode: Conversation mode

        Returns:
            Response with AI message and suggestions
        """
        try:
            # Build the conversation context
            system_prompt = self._build_conversational_system_prompt(mode)
            messages = [{"role": "developer", "content": system_prompt}]

            # Add context about the project if available
            if project_context or current_answers:
                context_message = self._build_context_message(project_context, current_answers)
                messages.append({"role": "developer", "content": context_message})

            # Add conversation history (last 10 messages to manage token usage)
            for msg in conversation_history[-10:]:
                messages.append({
                    "role": msg.get("role", "user"),
                    "content": msg.get("content", "")
                })

            # Add the current user message
            messages.append({"role": "user", "content": message})

            # Generate response
            response = await self.client.chat.completions.create(
                model=self.model,
                messages=messages,
                temperature=0.7,
                max_tokens=4096,
                presence_penalty=0.3,
                frequency_penalty=0.3,
                reasoning_effort="none"
            )

            ai_response = response.choices[0].message.content

            # Generate suggestions based on the conversation
            suggestions = await self._generate_suggestions(
                message, ai_response, project_context, current_answers, mode
            )

            return {
                "status": "success",
                "response": ai_response,
                "suggestions": suggestions,
                "mode": mode,
                "timestamp": datetime.utcnow().isoformat()
            }

        except Exception as e:
            logger.error(f"Error in conversational AI: {str(e)}")
            return {
                "status": "error",
                "error": str(e),
                "response": "I apologize, but I encountered an error processing your request. Please try again.",
                "suggestions": []
            }

    async def analyze_and_suggest_improvements(
        self,
        section: str,
        answers: Dict,
        project_context: Dict
    ) -> Dict[str, Any]:
        """
        Analyze current answers and suggest improvements autonomously

        Args:
            section: Section to analyze
            answers: Current answers
            project_context: Project information

        Returns:
            Analysis and improvement suggestions
        """
        try:
            prompt = f"""As an expert Erasmus+ grant evaluator, analyze these answers and provide specific improvement suggestions.

Section: {section}
Current Answers: {json.dumps(answers, indent=2)}
Project Context: {json.dumps(project_context, indent=2)}

Provide a detailed analysis including:
1. Strengths of current answers
2. Weaknesses and gaps
3. Specific improvement suggestions
4. Missing elements that evaluators look for
5. Scoring potential (estimated)

Format your response as:
## Strengths
- [List key strengths]

## Areas for Improvement
- [List specific weaknesses]

## Suggested Enhancements
[Provide specific, actionable suggestions for each answer]

## Missing Elements
- [List what evaluators expect but is missing]

## Estimated Score Potential
Current: X/100
Potential with improvements: Y/100
"""

            response = await self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "developer", "content": self.prompts.get_system_prompt()},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.6,
                max_tokens=4096,
                reasoning_effort="none"
            )

            analysis = response.choices[0].message.content

            # Extract specific suggestions
            suggestions = self._extract_improvement_suggestions(analysis)

            return {
                "status": "success",
                "analysis": analysis,
                "suggestions": suggestions,
                "section": section,
                "timestamp": datetime.utcnow().isoformat()
            }

        except Exception as e:
            logger.error(f"Error analyzing section {section}: {str(e)}")
            return {
                "status": "error",
                "error": str(e),
                "analysis": "",
                "suggestions": []
            }

    async def generate_alternative_answers(
        self,
        question: Dict,
        current_answer: str,
        project_context: Dict,
        style: str = "standard"  # "standard", "concise", "detailed", "innovative"
    ) -> Dict[str, Any]:
        """
        Generate alternative answers for a question

        Args:
            question: Question details
            current_answer: Current answer if available
            project_context: Project information
            style: Writing style for alternatives

        Returns:
            Alternative answers with different approaches
        """
        try:
            style_instructions = {
                "standard": "Professional and balanced approach",
                "concise": "Maximum impact with minimum words",
                "detailed": "Comprehensive with specific examples",
                "innovative": "Creative and cutting-edge approach"
            }

            prompt = f"""Generate an alternative answer for this question using a {style} approach.

Question: {question.get('question')}
Character Limit: {question.get('character_limit')}
Current Answer: {current_answer}
Project Context: {json.dumps(project_context, indent=2)}

Style Instruction: {style_instructions.get(style, 'Standard approach')}

Generate a completely different answer that:
1. Takes a fresh perspective
2. Maintains high quality and relevance
3. Fits within the character limit
4. Aligns with the {style} style
5. Addresses evaluation criteria effectively

Provide the alternative answer:"""

            response = await self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "developer", "content": self.prompts.get_system_prompt()},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.8,
                max_tokens=2048,
                reasoning_effort="none"
            )

            alternative = response.choices[0].message.content

            return {
                "status": "success",
                "alternative": alternative,
                "style": style,
                "character_count": len(alternative),
                "timestamp": datetime.utcnow().isoformat()
            }

        except Exception as e:
            logger.error(f"Error generating alternative: {str(e)}")
            return {
                "status": "error",
                "error": str(e),
                "alternative": "",
                "style": style
            }

    def _build_conversational_system_prompt(self, mode: str) -> str:
        """Build system prompt based on conversation mode"""
        base_prompt = """You are an expert Erasmus+ grant application advisor with deep knowledge of:
- EU funding mechanisms and evaluation criteria
- Adult education best practices
- Project design and management
- Partnership development
- Impact and sustainability planning

You provide helpful, specific, and actionable advice to improve grant applications.
You're conversational, supportive, and focused on helping users succeed."""

        mode_specific = {
            "general": "\nAnswer questions and provide guidance on any aspect of the grant application.",
            "improvement": "\nFocus on analyzing and improving existing content. Be critical but constructive.",
            "suggestion": "\nProactively suggest ideas and enhancements. Be creative and innovative."
        }

        return base_prompt + mode_specific.get(mode, "")

    def _build_context_message(self, project_context: Optional[Dict], current_answers: Optional[Dict]) -> str:
        """Build context message from project and answers"""
        context = "Current application context:\n"

        if project_context:
            context += f"""
Project: {project_context.get('title', 'N/A')}
Field: {project_context.get('field', 'N/A')}
Budget: €{project_context.get('budget', 'N/A')}
Duration: {project_context.get('duration', 'N/A')}
Partners: {len(project_context.get('partners', []))} organizations
"""

        if current_answers:
            context += f"\nSections completed: {list(current_answers.keys())}"

        return context

    async def _generate_suggestions(
        self,
        user_message: str,
        ai_response: str,
        project_context: Optional[Dict],
        current_answers: Optional[Dict],
        mode: str
    ) -> List[Dict]:
        """Generate contextual suggestions based on the conversation"""
        suggestions = []

        try:
            # Analyze the conversation to generate relevant suggestions
            prompt = f"""Based on this conversation, generate 3-5 specific action suggestions.

User Message: {user_message}
AI Response: {ai_response}
Mode: {mode}

Generate practical suggestions that the user can act on immediately.
Format as JSON array:
[
    {{"type": "action/question/improvement", "suggestion": "specific suggestion", "priority": "high/medium/low"}}
]"""

            response = await self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "developer", "content": "You are a helpful assistant that generates actionable suggestions for Erasmus+ grant applicants. Always respond with valid JSON."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.6,
                max_tokens=1024,
                response_format={"type": "json_object"},
                reasoning_effort="none"
            )

            result = json.loads(response.choices[0].message.content)
            suggestions = result.get("suggestions", [])

        except Exception as e:
            logger.error(f"Error generating suggestions: {str(e)}")

        return suggestions

    def _extract_improvement_suggestions(self, analysis: str) -> List[Dict]:
        """Extract specific improvement suggestions from analysis text"""
        suggestions = []

        # Parse the analysis to extract actionable suggestions
        lines = analysis.split('\n')
        current_section = ""

        for line in lines:
            line = line.strip()
            if line.startswith('##'):
                current_section = line.replace('#', '').strip()
            elif line.startswith('- ') and current_section == "Suggested Enhancements":
                suggestions.append({
                    "type": "enhancement",
                    "content": line[2:],
                    "section": current_section
                })
            elif line.startswith('- ') and current_section == "Missing Elements":
                suggestions.append({
                    "type": "missing",
                    "content": line[2:],
                    "section": current_section
                })

        return suggestions

    async def get_best_practices(self, topic: str, context: Optional[Dict] = None) -> Dict[str, Any]:
        """
        Get best practices for a specific topic

        Args:
            topic: Topic to get best practices for
            context: Optional context

        Returns:
            Best practices and examples
        """
        try:
            prompt = f"""Provide best practices and successful examples for: {topic}

Focus on Erasmus+ KA220-ADU applications.
Include:
1. Key success factors
2. Common mistakes to avoid
3. Real-world examples (anonymized)
4. Tips from evaluators' perspective
5. Links to relevant EU resources

Format as structured guidance that's immediately actionable."""

            response = await self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "developer", "content": self.prompts.get_system_prompt()},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.6,
                max_tokens=4096,
                reasoning_effort="none"
            )

            return {
                "status": "success",
                "topic": topic,
                "best_practices": response.choices[0].message.content,
                "timestamp": datetime.utcnow().isoformat()
            }

        except Exception as e:
            logger.error(f"Error getting best practices: {str(e)}")
            return {
                "status": "error",
                "error": str(e),
                "topic": topic,
                "best_practices": ""
            }