from typing import Dict, List, Optional, Any
import json
import logging
from datetime import datetime
import asyncio
import anthropic
import os
from dotenv import load_dotenv

load_dotenv()

logger = logging.getLogger(__name__)

class AIAutoFillService:
    """
    Real AI service for auto-filling Erasmus+ KA220-ADU applications
    using Anthropic Claude API for high-quality answer generation
    """
    
    def __init__(self):
        api_key = os.getenv("ANTHROPIC_API_KEY")
        if api_key and api_key != "your_anthropic_key_here":
            self.client = anthropic.Anthropic(api_key=api_key)
            self.use_real_ai = True
        else:
            self.client = None
            self.use_real_ai = False
            logger.warning("Anthropic API key not configured - using fallback mode")
        
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
            "answers": {}
        }
        
        # Process sections in logical order
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
                
                # Process each question in the section
                section_answers = await self._process_section(
                    section_key,
                    section_data,
                    project_context
                )
                
                all_answers[section_key] = section_answers
                self.context_memory["answers"][section_key] = section_answers
                
                # Small delay to avoid rate limiting
                if self.use_real_ai:
                    await asyncio.sleep(0.5)
        
        return all_answers
    
    async def _process_section(
        self,
        section_key: str,
        section_data: Dict,
        project_context: Dict
    ) -> Dict[str, Any]:
        """
        Process all questions in a section
        """
        section_answers = {}
        
        for question in section_data.get('questions', []):
            field = question['field']
            question_text = question['question']
            char_limit = question.get('character_limit', 3000)
            
            # Generate answer for this question
            answer = await self._generate_answer(
                section_key,
                field,
                question_text,
                char_limit,
                project_context
            )
            
            section_answers[field] = {
                'question_id': question.get('id', field),
                'answer': answer,
                'character_count': len(answer),
                'character_limit': char_limit
            }
        
        return section_answers
    
    async def _generate_answer(
        self,
        section: str,
        field: str,
        question: str,
        char_limit: int,
        project_context: Dict
    ) -> str:
        """
        Generate a specific answer using AI or fallback
        """
        if self.use_real_ai:
            return await self._generate_ai_answer(section, field, question, char_limit, project_context)
        else:
            return self._generate_fallback_answer(section, field, question, char_limit, project_context)
    
    async def _generate_ai_answer(
        self,
        section: str,
        field: str,
        question: str,
        char_limit: int,
        project_context: Dict
    ) -> str:
        """
        Generate answer using Anthropic Claude API
        """
        try:
            # Build context from previous answers
            context_summary = self._build_context_summary()
            
            prompt = f"""You are helping complete an Erasmus+ KA220-ADU grant application.

Project Context:
- Title: {project_context.get('title')}
- Field: {project_context.get('field')}
- Idea: {project_context.get('project_idea')}
- Duration: {project_context.get('duration')}
- Budget: €{project_context.get('budget')}
- Lead Organization: {project_context.get('lead_org', {}).get('name')}
- Partners: {len(project_context.get('partners', []))} organizations
- Priorities: {', '.join(project_context.get('selected_priorities', []))}
- Target Groups: {project_context.get('target_groups')}

{context_summary}

Current Section: {section}
Question: {question}

Please provide a comprehensive, specific answer that:
1. Directly addresses the question
2. Uses concrete examples from the project context
3. Aligns with Erasmus+ evaluation criteria
4. Is between {int(char_limit * 0.7)} and {char_limit} characters
5. Uses professional grant writing language

Answer:"""

            response = self.client.messages.create(
                model="claude-3-haiku-20240307",
                max_tokens=1000,
                temperature=0.7,
                messages=[
                    {"role": "user", "content": prompt}
                ]
            )
            
            answer = response.content[0].text.strip()
            
            # Ensure answer fits within character limit
            if len(answer) > char_limit:
                answer = answer[:char_limit-3] + "..."
            
            return answer
            
        except Exception as e:
            logger.error(f"AI generation failed: {e}")
            return self._generate_fallback_answer(section, field, question, char_limit, project_context)
    
    def _generate_fallback_answer(
        self,
        section: str,
        field: str,
        question: str,
        char_limit: int,
        project_context: Dict
    ) -> str:
        """
        Generate a reasonable fallback answer when AI is not available
        """
        title = project_context.get('title', 'Project')
        idea = project_context.get('project_idea', '')[:200]
        org = project_context.get('lead_org', {}).get('name', 'Organization')
        priorities = project_context.get('selected_priorities', [])
        
        # Section-specific templates
        templates = {
            'project_summary': {
                'default': f"The {title} project addresses critical needs in adult education through innovative approaches. {idea}. Our consortium of experienced partners will implement targeted activities over {project_context.get('duration', '24 months')} to achieve measurable impact in line with Erasmus+ priorities."
            },
            'relevance': {
                'priorities_addressed': f"This project directly addresses the following EU priorities: {', '.join(priorities)}. Through targeted interventions and innovative methodologies, we will contribute to European policy objectives in adult education, fostering inclusion, digital transformation, and quality learning opportunities.",
                'default': f"The {title} project is highly relevant to current European challenges in adult education. It addresses identified gaps through evidence-based approaches, ensuring alignment with local, national, and European priorities."
            },
            'needs_analysis': {
                'target_needs': f"Our comprehensive needs analysis identified critical gaps in adult education provision for {project_context.get('target_groups', 'adult learners')}. Key challenges include limited access to quality learning, digital skills gaps, and social exclusion.",
                'default': f"Through stakeholder consultations, surveys, and desk research, we identified pressing needs that the {title} project will address through targeted interventions."
            },
            'partnership': {
                'partner_roles': f"Our consortium brings together {len(project_context.get('partners', []) + 1)} complementary organizations. {org} leads the project with expertise in project management and adult education. Partners contribute specialized knowledge in their respective fields.",
                'default': f"The partnership combines diverse expertise essential for project success, ensuring comprehensive coverage of all project aspects and sustainable impact."
            },
            'impact': {
                'expected_impact': f"The {title} project will generate significant impact at multiple levels. Direct beneficiaries include {project_context.get('target_groups', 'adult learners')}, while indirect impact extends to communities and institutions.",
                'default': f"Through systematic implementation and quality assurance, we expect lasting positive changes in adult education provision and learner outcomes."
            },
            'project_management': {
                'management_structure': f"{org} will coordinate the project through established management structures. Work packages are clearly defined with specific deliverables, timelines, and responsible partners.",
                'default': f"Professional project management ensures efficient implementation, risk mitigation, and achievement of objectives within budget and timeline constraints."
            }
        }
        
        # Get appropriate template
        section_templates = templates.get(section, {})
        answer = section_templates.get(field, section_templates.get('default', ''))
        
        if not answer:
            # Generic fallback
            answer = f"The {title} project addresses this aspect through comprehensive planning and implementation. Our approach ensures alignment with Erasmus+ objectives and maximum impact for beneficiaries."
        
        # Extend answer if too short
        while len(answer) < min(500, char_limit * 0.3):
            answer += f" This will be achieved through collaborative efforts of all partners, ensuring sustainability and transferability of results."
        
        # Trim if too long
        if len(answer) > char_limit:
            answer = answer[:char_limit-3] + "..."
        
        return answer
    
    def _build_context_summary(self) -> str:
        """
        Build a summary of previously answered questions for context
        """
        if not self.context_memory.get("answers"):
            return ""
        
        summary_parts = ["Previously provided information:"]
        
        for section, answers in self.context_memory["answers"].items():
            if answers:
                summary_parts.append(f"\n{section.replace('_', ' ').title()}:")
                for field, answer_data in list(answers.items())[:2]:  # Limit to avoid token overflow
                    summary_parts.append(f"- {field}: {answer_data['answer'][:100]}...")
        
        return "\n".join(summary_parts) if len(summary_parts) > 1 else ""