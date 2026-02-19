from typing import Dict, List, Optional, Any
import json
import logging
from datetime import datetime
import asyncio
from openai import AsyncOpenAI
from app.core.config import settings
from app.services.prompts_config import PromptsConfig

logger = logging.getLogger(__name__)

class AIAutoFillService:
    """
    Comprehensive AI service for auto-filling Erasmus+ KA220-ADU applications
    with advanced context management and quality assurance
    """
    
    def __init__(self):
        # Configure OpenAI client with connection pooling
        api_key = settings.OPENAI_API_KEY
        if not api_key or api_key == "your-openai-api-key-here":
            logger.error("OPENAI_API_KEY is not properly configured!")
            raise ValueError("OPENAI_API_KEY is not properly configured")

        logger.info(f"Initializing OpenAI client with model: {settings.OPENAI_MODEL}")

        try:
            self.client = AsyncOpenAI(
                api_key=api_key,
                max_retries=2,  # Built-in retry logic
                timeout=60.0,    # Default timeout
            )
            self.model = settings.OPENAI_MODEL
            self.prompts = PromptsConfig()
            self.context_memory = {}
            logger.info("OpenAI client initialized successfully")
        except Exception as e:
            logger.error(f"Failed to initialize OpenAI client: {str(e)}")
            raise
        
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
        # Summary moved to end as it synthesizes all previous sections
        section_order = [
            "relevance",
            "needs_analysis",
            "partnership",
            "impact",
            "project_management",
            "project_summary"  # Now generated last with full context
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

        response = await self._call_ai(prompt, temperature=0.5, max_tokens=1000)
        
        try:
            return json.loads(response)
        except (json.JSONDecodeError, TypeError, ValueError) as e:
            logger.warning(f"Failed to parse priority analysis response: {e}")
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

        response = await self._call_ai(prompt, temperature=0.5, max_tokens=1000)
        
        try:
            return json.loads(response)
        except (json.JSONDecodeError, TypeError, ValueError) as e:
            logger.warning(f"Failed to parse partnership analysis response: {e}")
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

        response = await self._call_ai(prompt, temperature=0.7, max_tokens=1000)
        
        try:
            return json.loads(response)
        except (json.JSONDecodeError, TypeError, ValueError) as e:
            logger.warning(f"Failed to parse innovation analysis response: {e}")
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
        Process all questions in a section with controlled parallel processing
        """
        questions = section_data.get('questions', [])
        logger.info(f"Processing section {section_key} with {len(questions)} questions")

        # Process questions in smaller batches to avoid overwhelming the API
        MAX_CONCURRENT = 2  # Process 2 questions at a time
        results = []

        for i in range(0, len(questions), MAX_CONCURRENT):
            batch = questions[i:i + MAX_CONCURRENT]
            batch_tasks = []

            for question in batch:
                task = self._process_single_question(
                    question=question,
                    section_context=section_context,
                    section_key=section_key
                )
                batch_tasks.append(task)

            # Process this batch and wait for completion
            batch_results = await asyncio.gather(*batch_tasks, return_exceptions=True)
            results.extend(batch_results)

            # Small delay between batches to avoid rate limiting
            if i + MAX_CONCURRENT < len(questions):
                await asyncio.sleep(0.5)

        # Process results and build section answers
        section_answers = {}
        for i, (question, result) in enumerate(zip(questions, results)):
            field = question['field']

            if isinstance(result, Exception):
                logger.error(f"Error processing {field} in section {section_key}: {str(result)}")
                # Provide a fallback answer for failed questions
                section_answers[field] = {
                    'answer': f"[Error generating answer: {str(result)[:100]}. Please regenerate.]",
                    'question_id': question['id'],
                    'character_count': 0,
                    'character_limit': question.get('character_limit', 0),
                    'quality_score': 0
                }
            else:
                section_answers[field] = result
                logger.info(f"Successfully processed {field} ({result['character_count']} chars)")

        successful_count = sum(1 for a in section_answers.values() if a['quality_score'] > 0)
        logger.info(f"Completed section {section_key}: {successful_count}/{len(questions)} questions successful")

        return section_answers

    async def _process_single_question(
        self,
        question: Dict,
        section_context: Dict,
        section_key: str
    ) -> Dict:
        """
        Process a single question with proper error handling and retry logic
        """
        field = question['field']
        max_retries = 2  # Reduced retries for parallel processing

        for attempt in range(max_retries):
            try:
                logger.debug(f"Processing {field} in {section_key} (attempt {attempt + 1}/{max_retries})")

                # Generate answer with timeout
                answer = await asyncio.wait_for(
                    self._generate_comprehensive_answer(
                        question=question,
                        section_context=section_context,
                        section_key=section_key
                    ),
                    timeout=45.0  # Increased timeout for more reliable generation
                )

                # Ensure character limit compliance
                if question.get('character_limit'):
                    answer = self._optimize_for_length(answer, question['character_limit'])

                # Assess quality (make this async but don't wait too long)
                try:
                    quality_score = await asyncio.wait_for(
                        self._assess_answer_quality(answer, question),
                        timeout=5.0
                    )
                except (asyncio.TimeoutError, Exception) as e:
                    logger.debug(f"Quality assessment fallback for {field}: {e}")
                    quality_score = 0.7  # Default quality score if assessment fails

                return {
                    'answer': answer,
                    'question_id': question['id'],
                    'character_count': len(answer),
                    'character_limit': question.get('character_limit', 0),
                    'quality_score': quality_score
                }

            except asyncio.TimeoutError:
                logger.warning(f"Timeout for {field} in {section_key} (attempt {attempt + 1}/{max_retries})")
                if attempt < max_retries - 1:
                    await asyncio.sleep(1)  # Brief pause before retry
                    continue
                raise TimeoutError(f"Timeout after {max_retries} attempts")

            except Exception as e:
                logger.warning(f"Error for {field} in {section_key} (attempt {attempt + 1}/{max_retries}): {str(e)}")
                if attempt < max_retries - 1:
                    await asyncio.sleep(1)  # Brief pause before retry
                    continue
                raise
    
    async def _generate_comprehensive_answer(
        self,
        question: Dict,
        section_context: Dict,
        section_key: str
    ) -> str:
        """
        Generate a comprehensive, high-quality answer for a specific question
        with dynamic parameters based on question type
        """
        # Get specialized prompt based on question type
        prompt = self.prompts.get_question_prompt(
            question=question,
            project_context=self.context_memory['project'],
            section_context=section_context,
            section_key=section_key
        )

        # Get optimized parameters for this question type
        params = self._get_question_parameters(question, section_key)

        # Generate answer with optimized parameters
        try:
            response = await self._call_ai(
                prompt,
                temperature=params['temperature'],
                max_tokens=params['max_tokens']
            )

            # Validate response quality
            if len(response) > 50:  # Minimum quality check
                return response
            else:
                # If response is too short, try again with higher reasoning
                logger.warning(f"Response too short for {question['field']}, retrying with higher reasoning effort")
                response = await self._call_ai(
                    prompt,
                    temperature=0.9,  # Use higher creativity for retry
                    max_tokens=params['max_tokens']
                )
                return response

        except Exception as e:
            logger.error(f"Failed to generate answer for {question['field']}: {str(e)}")
            raise

    def _get_question_parameters(self, question: Dict, section_key: str) -> Dict:
        """
        Get optimized parameters for different question types
        """
        field = question['field'].lower()
        character_limit = question.get('character_limit', 3000)

        # Base parameters (using temperature for creativity control)
        params = {
            'temperature': 0.7,  # Balanced creativity
            'max_tokens': min(character_limit // 4, 1200)
        }

        # Question-specific optimizations
        if section_key == 'project_summary':
            params['temperature'] = 0.7
            params['max_tokens'] = min(character_limit // 4, 1000)

        elif section_key == 'relevance':
            params['temperature'] = 0.7
            params['max_tokens'] = min(character_limit // 4, 1200)

        elif section_key == 'needs_analysis':
            params['temperature'] = 0.7
            params['max_tokens'] = min(character_limit // 4, 1100)

        elif section_key == 'partnership':
            params['temperature'] = 0.7
            params['max_tokens'] = min(character_limit // 4, 1000)

        elif section_key == 'impact':
            params['temperature'] = 0.9  # Analytical depth
            params['max_tokens'] = min(character_limit // 4, 1200)

        elif section_key == 'project_management':
            params['temperature'] = 0.5  # Precise and factual
            params['max_tokens'] = min(character_limit // 4, 1100)

        # Field-specific overrides
        if 'innovation' in field or 'creative' in field:
            params['temperature'] = 0.9  # Creative thinking
        elif 'budget' in field or 'timeline' in field or 'milestone' in field:
            params['temperature'] = 0.5  # Precise for numbers
            params['max_tokens'] = min(params['max_tokens'], 800)
        elif 'risk' in field or 'quality' in field:
            params['temperature'] = 0.7  # Balanced
        elif 'dissemination' in field or 'sustainability' in field:
            params['temperature'] = 0.9  # Forward thinking

        # For shorter questions, use fewer tokens
        if character_limit < 1000:
            params['max_tokens'] = min(params['max_tokens'], 400)
        elif character_limit < 2000:
            params['max_tokens'] = min(params['max_tokens'], 700)

        logger.debug(f"Parameters for {field} in {section_key}: temperature={params['temperature']}, tokens={params['max_tokens']}")
        return params
    
    async def _call_ai(self, prompt: str, temperature: float = 0.7, max_tokens: int = 2000) -> str:
        """
        Call OpenAI API with proper error handling

        Args:
            prompt: The user prompt to send
            temperature: Sampling temperature (0-2)
            max_tokens: Maximum tokens to generate
        """
        max_retries = 2  # Reduced retries since we have parallel processing

        for attempt in range(max_retries):
            try:
                logger.debug(f"AI call attempt {attempt + 1}/{max_retries}")

                # Direct API call with built-in timeout from client config
                response = await self.client.chat.completions.create(
                    model=self.model,
                    messages=[
                        {
                            "role": "developer",
                            "content": self.prompts.get_system_prompt()
                        },
                        {
                            "role": "user",
                            "content": prompt
                        }
                    ],
                    max_tokens=max_tokens,
                    temperature=temperature,
                    reasoning_effort="none"
                )

                if response and response.choices and response.choices[0].message.content:
                    content = response.choices[0].message.content
                    logger.debug(f"AI response received: {len(content)} chars")
                    return content
                else:
                    raise Exception("Empty response from OpenAI")

            except asyncio.TimeoutError:
                logger.error(f"AI call timeout (attempt {attempt + 1}/{max_retries})")
                if attempt == max_retries - 1:
                    raise Exception("OpenAI API timeout")
                await asyncio.sleep(1.5)  # Shorter wait for parallel processing

            except Exception as e:
                error_msg = str(e)
                if "500" in error_msg or "502" in error_msg or "503" in error_msg:
                    logger.error(f"OpenAI API server error (attempt {attempt + 1}/{max_retries}): {error_msg}")
                    if attempt == max_retries - 1:
                        raise Exception(f"OpenAI API server error: {error_msg[:100]}")
                    await asyncio.sleep(2)  # Longer wait for server errors
                elif "rate_limit" in error_msg.lower():
                    logger.warning(f"Rate limit hit (attempt {attempt + 1}/{max_retries})")
                    if attempt == max_retries - 1:
                        raise Exception("Rate limit exceeded")
                    await asyncio.sleep(5)  # Longer wait for rate limits
                else:
                    logger.error(f"AI call failed (attempt {attempt + 1}/{max_retries}): {error_msg}")
                    if attempt == max_retries - 1:
                        raise Exception(f"API error: {error_msg[:100]}")
                    await asyncio.sleep(1.5)

        # Should not reach here
        raise Exception("Failed to get AI response")
    
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
        Assess the quality of a generated answer using content-aware checks.
        Checks for: length, structure, specificity, EU priority references,
        partner mentions, measurable indicators, and target group references.
        """
        import re
        quality_score = 0.0
        answer_lower = answer.lower()

        # 1. Length appropriateness (max 0.15)
        char_limit = question.get('character_limit', 2000)
        length_ratio = len(answer) / char_limit if char_limit > 0 else 0
        if length_ratio >= 0.7:
            quality_score += 0.15
        elif length_ratio >= 0.5:
            quality_score += 0.10
        elif length_ratio >= 0.3:
            quality_score += 0.05

        # 2. Tips coverage (max 0.15)
        tips = question.get('tips', [])
        if tips:
            tips_matched = sum(
                1 for tip in tips
                if any(keyword in answer_lower for keyword in tip.lower().split() if len(keyword) > 3)
            )
            quality_score += 0.15 * (tips_matched / len(tips))

        # 3. Structure quality (max 0.10)
        has_paragraphs = answer.count('\n\n') >= 1
        has_lists = bool(re.search(r'[\n][\s]*[-•\d]+[.)\s]', answer))
        if has_paragraphs and has_lists:
            quality_score += 0.10
        elif has_paragraphs or has_lists:
            quality_score += 0.05

        # 4. Measurable indicators - numbers, percentages, timeframes (max 0.15)
        has_numbers = bool(re.search(r'\d+', answer))
        has_percentages = bool(re.search(r'\d+\s*%', answer))
        has_timeframes = bool(re.search(r'\d+\s*(month|year|week|quarter|day)', answer_lower))
        has_currency = bool(re.search(r'[€$£]\s*[\d,]+', answer))
        indicator_count = sum([has_numbers, has_percentages, has_timeframes, has_currency])
        quality_score += min(0.15, indicator_count * 0.05)

        # 5. EU priority references (max 0.15)
        # Check if the answer references the SPECIFIC priorities from the project context
        project_priorities = self.context_memory.get('project', {}).get('selected_priorities', [])
        if project_priorities:
            priorities_text = ' '.join(str(p) for p in project_priorities).lower()
            # Extract key terms from priorities (words longer than 4 chars)
            priority_terms = set(
                word for word in re.findall(r'\b\w{5,}\b', priorities_text)
                if word not in {'these', 'those', 'their', 'which', 'would', 'could', 'should', 'about', 'through', 'between'}
            )
            if priority_terms:
                matched_terms = sum(1 for term in priority_terms if term in answer_lower)
                priority_coverage = matched_terms / len(priority_terms)
                quality_score += 0.15 * min(1.0, priority_coverage * 2)  # 50% coverage = full score
        else:
            # Fallback: check for generic EU priority keywords
            eu_keywords = ['inclusion', 'digital', 'sustainable', 'green', 'democratic', 'innovation',
                           'european', 'erasmus', 'adult education', 'lifelong learning']
            matched = sum(1 for kw in eu_keywords if kw in answer_lower)
            quality_score += 0.15 * min(1.0, matched / 3)

        # 6. Partner organization mentions (max 0.15)
        partner_names = []
        lead_org = self.context_memory.get('project', {}).get('lead_org', {})
        if lead_org and lead_org.get('name'):
            partner_names.append(lead_org['name'].lower())
        for partner in self.context_memory.get('project', {}).get('partners', []):
            if isinstance(partner, dict) and partner.get('name'):
                partner_names.append(partner['name'].lower())
            elif isinstance(partner, str):
                partner_names.append(partner.lower())

        if partner_names:
            partners_mentioned = sum(1 for name in partner_names if name in answer_lower)
            # For some questions (like summary), mentioning 1-2 partners is enough
            partner_coverage = partners_mentioned / max(len(partner_names), 1)
            quality_score += 0.15 * min(1.0, partner_coverage * 2)  # 50% coverage = full score
        else:
            quality_score += 0.05  # Partial credit if no partners to check against

        # 7. Target group references (max 0.15)
        target_groups_text = self.context_memory.get('project', {}).get('target_groups', '')
        if target_groups_text:
            target_terms = set(
                word.lower() for word in re.findall(r'\b\w{5,}\b', str(target_groups_text))
                if word.lower() not in {'these', 'those', 'their', 'which', 'would', 'could', 'should', 'about', 'through'}
            )
            if target_terms:
                matched = sum(1 for term in target_terms if term in answer_lower)
                target_coverage = matched / len(target_terms)
                quality_score += 0.15 * min(1.0, target_coverage * 2)
            else:
                quality_score += 0.05
        else:
            # Check for generic target group language
            target_keywords = ['participant', 'beneficiar', 'learner', 'educator', 'adult', 'target group', 'stakeholder']
            matched = sum(1 for kw in target_keywords if kw in answer_lower)
            quality_score += 0.15 * min(1.0, matched / 2)

        final_score = min(quality_score, 1.0)
        logger.debug(
            f"Quality assessment for {question.get('field', 'unknown')}: {final_score:.2f} "
            f"(length={length_ratio:.1f}, indicators={indicator_count}, partners={len(partner_names)})"
        )
        return final_score
    
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
        Comprehensive consistency checking across all answers.
        Extracts key entities and checks for mismatches in partner names,
        budget figures, timeline references, and thematic coherence.
        """
        import re
        inconsistencies = []

        # Collect all answer texts indexed by section.field
        all_texts = {}
        for section_key, section_answers in answers.items():
            for field, data in section_answers.items():
                answer = data.get('answer', '')
                if answer and not answer.startswith('[Error'):
                    all_texts[f"{section_key}.{field}"] = answer

        if not all_texts:
            return inconsistencies

        # --- 1. Budget consistency ---
        budget_mentions = {}
        for key, text in all_texts.items():
            budgets_found = re.findall(r'€\s*[\d,]+(?:\.\d+)?', text)
            if budgets_found:
                budget_mentions[key] = budgets_found

        if len(budget_mentions) >= 2:
            # Extract unique budget figures across sections
            all_budget_values = set()
            for budgets in budget_mentions.values():
                for b in budgets:
                    normalized = b.replace(' ', '').replace(',', '')
                    all_budget_values.add(normalized)
            # If there are very different budget totals, flag it
            # (We look for total budget figures > €10,000 to avoid flagging small amounts)
            large_budgets = set()
            for b in all_budget_values:
                try:
                    val = float(b.replace('€', ''))
                    if val > 10000:
                        large_budgets.add(b)
                except ValueError:
                    pass
            if len(large_budgets) > 1:
                inconsistencies.append({
                    'type': 'budget',
                    'sections': list(budget_mentions.keys()),
                    'details': f"Multiple different large budget figures found: {', '.join(large_budgets)}. "
                               f"Ensure total budget is consistent across all sections."
                })

        # --- 2. Partner name consistency ---
        # Extract partner names from project context
        project = self.context_memory.get('project', {})
        expected_partners = []
        lead_org = project.get('lead_org', {})
        if lead_org and lead_org.get('name'):
            expected_partners.append(lead_org['name'])
        for partner in project.get('partners', []):
            if isinstance(partner, dict) and partner.get('name'):
                expected_partners.append(partner['name'])
            elif isinstance(partner, str):
                expected_partners.append(partner)

        if expected_partners:
            # Check which sections mention partner names
            partner_sections = {
                'partnership': ['partnership_formation', 'task_allocation', 'coordination'],
                'impact': ['organizational_impact'],
            }
            for section_key, fields in partner_sections.items():
                for field in fields:
                    key = f"{section_key}.{field}"
                    if key in all_texts:
                        text_lower = all_texts[key].lower()
                        missing = [p for p in expected_partners if p.lower() not in text_lower]
                        if missing and len(missing) < len(expected_partners):
                            # Some partners mentioned but not all
                            inconsistencies.append({
                                'type': 'partner_names',
                                'sections': [key],
                                'details': f"Partners not mentioned in {key}: {', '.join(missing)}. "
                                           f"This section should reference all partners."
                            })

        # --- 3. Timeline/duration consistency ---
        duration_mentions = {}
        for key, text in all_texts.items():
            # Look for project duration mentions
            durations = re.findall(r'(\d+)\s*[-–]?\s*months?', text.lower())
            if durations:
                duration_mentions[key] = [int(d) for d in durations]

        if len(duration_mentions) >= 2:
            # Check if project duration references are consistent
            project_duration = project.get('duration', '')
            expected_months = None
            dur_match = re.search(r'(\d+)', str(project_duration))
            if dur_match:
                expected_months = int(dur_match.group(1))

            if expected_months:
                for key, months_list in duration_mentions.items():
                    for m in months_list:
                        # Only flag significantly different durations (not sub-period references)
                        if m > 12 and abs(m - expected_months) > 6:
                            inconsistencies.append({
                                'type': 'duration',
                                'sections': [key],
                                'details': f"Duration mismatch in {key}: mentions {m} months, "
                                           f"but project duration is {expected_months} months."
                            })

        # --- 4. Key theme consistency ---
        # Check that themes mentioned in objectives appear in later sections
        objectives_text = all_texts.get('relevance.objectives_results', '')
        if objectives_text:
            # Extract capitalized multi-word phrases as potential key themes
            key_phrases = re.findall(r'\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)+\b', objectives_text)
            if key_phrases:
                # Check if key phrases from objectives appear in impact/management sections
                impact_text = ' '.join(
                    text for key, text in all_texts.items()
                    if key.startswith('impact.')
                )
                if impact_text and key_phrases:
                    missing_themes = [
                        phrase for phrase in key_phrases[:5]  # Check top 5 themes
                        if phrase.lower() not in impact_text.lower()
                    ]
                    if len(missing_themes) > 2:
                        inconsistencies.append({
                            'type': 'thematic_coherence',
                            'sections': ['relevance.objectives_results', 'impact'],
                            'details': f"Key themes from objectives not found in impact section: "
                                       f"{', '.join(missing_themes[:3])}. Consider reinforcing thematic coherence."
                        })

        return inconsistencies

    def _extract_budget_info(self, section_answers: Dict) -> Optional[str]:
        """
        Extract budget information from answers
        """
        import re
        for field, data in section_answers.items():
            answer = data.get('answer', '')
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
        Log identified inconsistencies clearly for review.
        We flag but do NOT auto-fix to avoid introducing new errors.
        The logged inconsistencies serve as quality signals for the user.
        """
        if not inconsistencies:
            return answers

        logger.warning(f"=== CONSISTENCY CHECK: {len(inconsistencies)} issue(s) found ===")
        for i, inconsistency in enumerate(inconsistencies, 1):
            issue_type = inconsistency.get('type', 'unknown')
            sections = inconsistency.get('sections', [])
            details = inconsistency.get('details', 'No details')
            logger.warning(
                f"  [{i}] Type: {issue_type} | "
                f"Sections: {', '.join(sections)} | "
                f"Details: {details}"
            )
        logger.warning(f"=== END CONSISTENCY CHECK ===")

        # Store inconsistencies in context for potential future use (e.g., UI display)
        self.context_memory['inconsistencies'] = inconsistencies

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