from typing import Dict, List, Optional, Any
import json
import logging
from datetime import datetime
import asyncio
from openai import OpenAI
from app.core.config import settings
from app.services.prompts_config import PromptsConfig

logger = logging.getLogger(__name__)

class AIAutoFillService:
    """
    Comprehensive AI service for auto-filling Erasmus+ KA220-ADU applications
    with advanced context management and quality assurance
    """
    
    def __init__(self):
        self.client = OpenAI(api_key=settings.OPENAI_API_KEY)
        self.model = settings.OPENAI_MODEL
        self.prompts = PromptsConfig()
        self.context_memory = {}
        
    async def auto_fill_complete_application(
        self,
        project_context: Dict,
        form_questions: Dict,
        language: str = "en"
    ) -> Dict[str, Any]:
        """
        Auto-fill the entire application with comprehensive answers
        """
        logger.info(f"Starting auto-fill for project: {project_context.get('title')}")
        
        # Initialize application context
        self.context_memory = {
            "project": project_context,
            "language": language,
            "answers": {},
            "priorities_analysis": await self._analyze_priorities(project_context),
            "partner_analysis": await self._analyze_partnerships(project_context),
            "innovation_points": await self._identify_innovation_points(project_context)
        }
        
        # Process sections in logical order for context building
        section_order = [
            "project_summary",
            "relevance",
            "needs_analysis",
            "partnership",
            "impact",
            "project_management"
        ]
        
        all_answers = {}
        
        for section_key in section_order:
            if section_key in form_questions['sections']:
                logger.info(f"Processing section: {section_key}")
                section_data = form_questions['sections'][section_key]
                
                # Generate section-specific context
                section_context = await self._build_section_context(section_key)
                
                # Process each question in the section
                section_answers = await self._process_section(
                    section_key,
                    section_data,
                    section_context
                )
                
                all_answers[section_key] = section_answers
                
                # Update context memory with generated answers
                self.context_memory["answers"][section_key] = section_answers
                
                # Add delay to avoid rate limiting
                await asyncio.sleep(0.5)
        
        # Perform quality checks and consistency validation
        validated_answers = await self._validate_and_enhance(all_answers, form_questions)
        
        return validated_answers
    
    async def _analyze_priorities(self, project_context: Dict) -> Dict:
        """
        Deep analysis of selected priorities and their alignment
        """
        priorities = project_context.get('selected_priorities', [])
        project_idea = project_context.get('project_idea', '')
        
        prompt = self.prompts.get_priority_analysis_prompt(priorities, project_idea)
        
        response = await self._call_ai(prompt, temperature=0.3)
        
        try:
            return json.loads(response)
        except:
            return {
                "main_priority": priorities[0] if priorities else "",
                "alignment_points": [],
                "key_themes": []
            }
    
    async def _analyze_partnerships(self, project_context: Dict) -> Dict:
        """
        Analyze partner organizations and their roles
        """
        lead_org = project_context.get('lead_org', {})
        partners = project_context.get('partners', [])
        
        prompt = self.prompts.get_partnership_analysis_prompt(lead_org, partners)
        
        response = await self._call_ai(prompt, temperature=0.3)
        
        try:
            return json.loads(response)
        except:
            return {
                "complementarity": [],
                "expertise_map": {},
                "collaboration_strengths": []
            }
    
    async def _identify_innovation_points(self, project_context: Dict) -> List[str]:
        """
        Identify innovative aspects of the project
        """
        project_idea = project_context.get('project_idea', '')
        field = project_context.get('field', 'Adult Education')
        
        prompt = self.prompts.get_innovation_analysis_prompt(project_idea, field)
        
        response = await self._call_ai(prompt, temperature=0.5)
        
        try:
            return json.loads(response)
        except:
            return ["Digital transformation", "Inclusive methodologies", "Cross-sector collaboration"]
    
    async def _build_section_context(self, section_key: str) -> Dict:
        """
        Build specific context for each section
        """
        base_context = {
            "section": section_key,
            "previous_answers": self.context_memory.get("answers", {}),
            "priorities_analysis": self.context_memory.get("priorities_analysis", {}),
            "partner_analysis": self.context_memory.get("partner_analysis", {}),
            "innovation_points": self.context_memory.get("innovation_points", [])
        }
        
        # Add section-specific enhancements
        if section_key == "relevance":
            base_context["eu_priorities"] = self._get_eu_priorities_detail()
        elif section_key == "impact":
            base_context["dissemination_channels"] = self._get_dissemination_channels()
        elif section_key == "project_management":
            base_context["quality_frameworks"] = self._get_quality_frameworks()
            
        return base_context
    
    async def _process_section(
        self,
        section_key: str,
        section_data: Dict,
        section_context: Dict
    ) -> Dict:
        """
        Process all questions in a section with context awareness
        """
        section_answers = {}
        
        for question in section_data.get('questions', []):
            field = question['field']
            
            # Generate comprehensive answer
            answer = await self._generate_comprehensive_answer(
                question=question,
                section_context=section_context,
                section_key=section_key
            )
            
            # Ensure character limit compliance
            if question.get('character_limit'):
                answer = self._optimize_for_length(answer, question['character_limit'])
            
            section_answers[field] = {
                'answer': answer,
                'question_id': question['id'],
                'character_count': len(answer),
                'character_limit': question.get('character_limit', 0),
                'quality_score': await self._assess_answer_quality(answer, question)
            }
            
            # Small delay between questions
            await asyncio.sleep(0.2)
        
        return section_answers
    
    async def _generate_comprehensive_answer(
        self,
        question: Dict,
        section_context: Dict,
        section_key: str
    ) -> str:
        """
        Generate a comprehensive, high-quality answer for a specific question
        """
        # Get specialized prompt based on question type
        prompt = self.prompts.get_question_prompt(
            question=question,
            project_context=self.context_memory['project'],
            section_context=section_context,
            section_key=section_key
        )
        
        # Adjust temperature based on question type
        temperature = 0.7
        if 'innovation' in question['field']:
            temperature = 0.8
        elif 'budget' in question['field'] or 'management' in question['field']:
            temperature = 0.3
        
        # Generate answer with retry logic
        max_retries = 3
        for attempt in range(max_retries):
            try:
                response = await self._call_ai(prompt, temperature=temperature)
                
                # Validate response quality
                if len(response) > 50:  # Minimum quality check
                    return response
                    
            except Exception as e:
                logger.error(f"Attempt {attempt + 1} failed: {str(e)}")
                if attempt == max_retries - 1:
                    raise
                await asyncio.sleep(1)
        
        return response
    
    async def _call_ai(self, prompt: str, temperature: float = 0.7) -> str:
        """
        Call OpenAI API with proper error handling
        """
        try:
            response = self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {
                        "role": "system",
                        "content": self.prompts.get_system_prompt()
                    },
                    {
                        "role": "user",
                        "content": prompt
                    }
                ],
                max_tokens=2000,
                temperature=temperature
            )
            
            return response.choices[0].message.content
            
        except Exception as e:
            logger.error(f"AI call failed: {str(e)}")
            raise
    
    def _optimize_for_length(self, text: str, limit: int) -> str:
        """
        Optimize text to fit within character limit while maintaining quality
        """
        if len(text) <= limit:
            return text
        
        # Try to cut at paragraph boundary
        paragraphs = text.split('\n\n')
        optimized = ""
        
        for para in paragraphs:
            if len(optimized) + len(para) + 2 <= limit:
                if optimized:
                    optimized += '\n\n'
                optimized += para
            else:
                # Add partial paragraph if possible
                remaining = limit - len(optimized) - 5
                if remaining > 100:
                    words = para.split()
                    partial = ""
                    for word in words:
                        if len(partial) + len(word) + 1 <= remaining:
                            if partial:
                                partial += " "
                            partial += word
                        else:
                            break
                    if partial:
                        optimized += '\n\n' + partial + "..."
                break
        
        return optimized[:limit]
    
    async def _assess_answer_quality(self, answer: str, question: Dict) -> float:
        """
        Assess the quality of generated answer
        """
        quality_score = 0.0
        
        # Check length appropriateness
        char_limit = question.get('character_limit', 2000)
        if len(answer) >= char_limit * 0.7:
            quality_score += 0.3
        
        # Check for key tips coverage
        tips = question.get('tips', [])
        for tip in tips:
            if any(keyword in answer.lower() for keyword in tip.lower().split()):
                quality_score += 0.2 / len(tips) if tips else 0
        
        # Check structure (paragraphs, lists)
        if '\n\n' in answer or '• ' in answer or '- ' in answer:
            quality_score += 0.2
        
        # Check specificity (numbers, percentages, concrete examples)
        import re
        if re.search(r'\d+', answer):
            quality_score += 0.1
        if re.search(r'\d+%', answer):
            quality_score += 0.1
        
        # Check priority keywords
        priority_keywords = ['inclusion', 'digital', 'sustainable', 'democratic', 'innovation']
        if any(keyword in answer.lower() for keyword in priority_keywords):
            quality_score += 0.1
        
        return min(quality_score, 1.0)
    
    async def _validate_and_enhance(
        self,
        answers: Dict,
        form_questions: Dict
    ) -> Dict:
        """
        Validate consistency and enhance answers where needed
        """
        logger.info("Validating and enhancing answers...")
        
        # Check cross-section consistency
        inconsistencies = await self._check_consistency(answers)
        
        if inconsistencies:
            logger.warning(f"Found {len(inconsistencies)} inconsistencies, fixing...")
            answers = await self._fix_inconsistencies(answers, inconsistencies)
        
        # Ensure all required fields are filled
        for section_key, section_data in form_questions['sections'].items():
            if section_key not in answers:
                logger.error(f"Missing section: {section_key}")
                continue
                
            for question in section_data.get('questions', []):
                field = question['field']
                if question.get('required', False):
                    if field not in answers[section_key] or not answers[section_key][field]['answer']:
                        logger.warning(f"Missing required field: {section_key}.{field}")
                        # Generate missing answer
                        answer = await self._generate_comprehensive_answer(
                            question=question,
                            section_context=await self._build_section_context(section_key),
                            section_key=section_key
                        )
                        answers[section_key][field] = {
                            'answer': answer,
                            'question_id': question['id'],
                            'character_count': len(answer),
                            'character_limit': question.get('character_limit', 0)
                        }
        
        return answers
    
    async def _check_consistency(self, answers: Dict) -> List[Dict]:
        """
        Check for inconsistencies across answers
        """
        inconsistencies = []
        
        # Check budget consistency
        if 'project_summary' in answers and 'project_management' in answers:
            summary_budget = self._extract_budget_info(answers['project_summary'])
            management_budget = self._extract_budget_info(answers['project_management'])
            
            if summary_budget and management_budget and summary_budget != management_budget:
                inconsistencies.append({
                    'type': 'budget',
                    'sections': ['project_summary', 'project_management'],
                    'details': f"Budget mismatch: {summary_budget} vs {management_budget}"
                })
        
        # Check duration consistency
        # Add more consistency checks as needed
        
        return inconsistencies
    
    def _extract_budget_info(self, section_answers: Dict) -> Optional[str]:
        """
        Extract budget information from answers
        """
        for field, data in section_answers.items():
            answer = data.get('answer', '')
            import re
            budget_match = re.search(r'€[\d,]+', answer)
            if budget_match:
                return budget_match.group()
        return None
    
    async def _fix_inconsistencies(
        self,
        answers: Dict,
        inconsistencies: List[Dict]
    ) -> Dict:
        """
        Fix identified inconsistencies
        """
        # Implementation would fix specific inconsistencies
        # For now, just log them
        for inconsistency in inconsistencies:
            logger.warning(f"Inconsistency: {inconsistency}")
        
        return answers
    
    def _get_eu_priorities_detail(self) -> Dict:
        """
        Get detailed EU priorities information
        """
        return {
            "horizontal": {
                "inclusion": "Promoting equal opportunities and access",
                "digital": "Digital transformation and readiness",
                "green": "Environmental sustainability and climate action",
                "participation": "Active citizenship and democratic values"
            },
            "sectoral": {
                "adult_education": [
                    "Improving key competences",
                    "Creating learning pathways",
                    "Professional development of educators"
                ]
            }
        }
    
    def _get_dissemination_channels(self) -> List[str]:
        """
        Get standard dissemination channels
        """
        return [
            "Project website and social media",
            "Academic publications and conferences",
            "Policy briefs and recommendations",
            "Workshops and training events",
            "EPALE platform",
            "National agencies networks",
            "Partner organizations' channels"
        ]
    
    def _get_quality_frameworks(self) -> Dict:
        """
        Get quality assurance frameworks
        """
        return {
            "standards": ["ISO 9001", "EFQM", "PDCA cycle"],
            "tools": ["Gantt charts", "Risk registers", "KPI dashboards"],
            "methods": ["Regular monitoring", "Peer reviews", "External evaluation"]
        }