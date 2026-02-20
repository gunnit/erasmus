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

        # Generate Work Packages based on the complete answers
        logger.info("Generating Work Packages based on completed answers...")
        work_packages = None
        try:
            work_packages = await self._generate_work_packages(
                project_context=project_context,
                all_answers=validated_answers
            )
            if work_packages:
                validated_answers["work_packages"] = work_packages
                logger.info(f"Generated {len(work_packages)} Work Packages successfully")
            else:
                logger.warning("Work Package generation returned empty result")
        except Exception as e:
            logger.error(f"Work Package generation failed: {str(e)}")
            # Don't fail the entire generation if WPs fail

        # Generate Budget Breakdown (requires Work Packages)
        if work_packages:
            logger.info("Generating Budget Breakdown...")
            try:
                budget_breakdown = await self._generate_budget_breakdown(
                    project_context=project_context,
                    work_packages=work_packages
                )
                if budget_breakdown:
                    validated_answers["budget_breakdown"] = budget_breakdown
                    logger.info("Budget Breakdown generated successfully")
                else:
                    logger.warning("Budget Breakdown generation returned empty result")
            except Exception as e:
                logger.error(f"Budget Breakdown generation failed: {str(e)}")
        else:
            logger.warning("Skipping Budget Breakdown - no Work Packages available")

        # Generate Project Timeline (requires Work Packages)
        if work_packages:
            logger.info("Generating Project Timeline...")
            try:
                timeline = await self._generate_project_timeline(
                    project_context=project_context,
                    work_packages=work_packages
                )
                if timeline:
                    validated_answers["timeline"] = timeline
                    logger.info(f"Timeline generated with {len(timeline)} quarters")
                else:
                    logger.warning("Timeline generation returned empty result")
            except Exception as e:
                logger.error(f"Timeline generation failed: {str(e)}")

        # Count verification placeholders that need user attention
        verification_needed = self._count_verification_needed(validated_answers)
        if verification_needed:
            logger.info(f"Generation complete with {len(verification_needed)} [VERIFY:] placeholder(s) requiring user review")
            self.context_memory['verification_needed'] = verification_needed

        return validated_answers
    
    async def _analyze_priorities(self, project_context: Dict) -> Dict:
        """
        Deep analysis of selected priorities and their alignment
        """
        priorities = project_context.get('selected_priorities', [])
        project_idea = project_context.get('project_idea', '')
        
        prompt = self.prompts.get_priority_analysis_prompt(priorities, project_idea)

        response = await self._call_ai(prompt, temperature=0.5, max_tokens=1500)

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

        response = await self._call_ai(prompt, temperature=0.5, max_tokens=1500)

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

        response = await self._call_ai(prompt, temperature=0.7, max_tokens=1500)
        
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
        # GPT-5.2 is efficient with tokens - use character_limit // 3 for better coverage
        params = {
            'temperature': 0.7,  # Balanced creativity
            'max_tokens': min(character_limit // 3, 2048)
        }

        # Question-specific optimizations
        if section_key == 'project_summary':
            params['temperature'] = 0.7
            params['max_tokens'] = min(character_limit // 3, 1500)

        elif section_key == 'relevance':
            params['temperature'] = 0.7
            params['max_tokens'] = min(character_limit // 3, 2048)

        elif section_key == 'needs_analysis':
            params['temperature'] = 0.7
            params['max_tokens'] = min(character_limit // 3, 1800)

        elif section_key == 'partnership':
            params['temperature'] = 0.7
            params['max_tokens'] = min(character_limit // 3, 1500)

        elif section_key == 'impact':
            params['temperature'] = 0.9  # Analytical depth
            params['max_tokens'] = min(character_limit // 3, 2048)

        elif section_key == 'project_management':
            params['temperature'] = 0.5  # Precise and factual
            params['max_tokens'] = min(character_limit // 3, 1800)

        # Field-specific overrides
        if 'innovation' in field or 'creative' in field:
            params['temperature'] = 0.9  # Creative thinking
        elif 'budget' in field or 'timeline' in field or 'milestone' in field:
            params['temperature'] = 0.5  # Precise for numbers
            params['max_tokens'] = min(params['max_tokens'], 1200)
        elif 'risk' in field or 'quality' in field:
            params['temperature'] = 0.7  # Balanced
        elif 'dissemination' in field or 'sustainability' in field:
            params['temperature'] = 0.9  # Forward thinking

        # For shorter questions, use fewer tokens
        if character_limit < 1000:
            params['max_tokens'] = min(params['max_tokens'], 600)
        elif character_limit < 2000:
            params['max_tokens'] = min(params['max_tokens'], 1200)

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
                    max_completion_tokens=max_tokens,
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

        # 8. [VERIFY:] tags - note them but don't penalize
        verify_tags = re.findall(r'\[VERIFY:\s*[^\]]+\]', answer)
        if verify_tags:
            logger.info(
                f"Answer for {question.get('field', 'unknown')} contains {len(verify_tags)} "
                f"[VERIFY:] tag(s) requiring user review"
            )

        final_score = min(quality_score, 1.0)
        logger.debug(
            f"Quality assessment for {question.get('field', 'unknown')}: {final_score:.2f} "
            f"(length={length_ratio:.1f}, indicators={indicator_count}, partners={len(partner_names)})"
        )
        return final_score
    
    async def _generate_work_packages(
        self,
        project_context: Dict,
        all_answers: Dict,
        num_implementation_wps: int = 3
    ) -> List[Dict]:
        """
        Generate Work Packages derived from the completed application answers.
        WP0 = Project Management (max 20% budget), WP1-WPN = implementation WPs.
        Returns a list of WP dicts or an empty list on failure.
        """
        import re

        prompt = self.prompts.get_work_package_prompt(
            project_context=project_context,
            all_answers=all_answers,
            num_implementation_wps=num_implementation_wps
        )

        # Use lower temperature for structured output
        response = await self._call_ai(prompt, temperature=0.5, max_tokens=3000)

        # Parse JSON response - handle markdown code fences
        cleaned = response.strip()
        if cleaned.startswith("```"):
            # Remove markdown code block wrapper
            cleaned = re.sub(r'^```(?:json)?\s*', '', cleaned)
            cleaned = re.sub(r'\s*```$', '', cleaned)

        try:
            work_packages = json.loads(cleaned)
        except (json.JSONDecodeError, TypeError, ValueError) as e:
            logger.error(f"Failed to parse Work Packages JSON: {e}")
            logger.debug(f"Raw WP response: {response[:500]}")
            return []

        if not isinstance(work_packages, list):
            logger.error(f"Work Packages response is not a list: {type(work_packages)}")
            return []

        # Validate and normalize each WP
        validated_wps = []
        for wp in work_packages:
            if not isinstance(wp, dict):
                continue
            # Ensure required fields exist with defaults
            validated_wp = {
                "wp_number": wp.get("wp_number", len(validated_wps)),
                "title": wp.get("title", f"Work Package {wp.get('wp_number', len(validated_wps))}"),
                "objectives": wp.get("objectives", []),
                "activities": wp.get("activities", []),
                "deliverables": wp.get("deliverables", []),
                "lead_partner": wp.get("lead_partner", ""),
                "participating_partners": wp.get("participating_partners", []),
                "start_month": wp.get("start_month", 1),
                "end_month": wp.get("end_month", 24),
                "budget_percentage": wp.get("budget_percentage", 0),
            }

            # Cap WP0 budget at 20%
            if validated_wp["wp_number"] == 0 and validated_wp["budget_percentage"] > 20:
                validated_wp["budget_percentage"] = 20

            validated_wps.append(validated_wp)

        # Ensure budget percentages sum to ~100%
        total_budget_pct = sum(wp["budget_percentage"] for wp in validated_wps)
        if validated_wps and total_budget_pct > 0 and abs(total_budget_pct - 100) > 5:
            # Normalize to 100%
            factor = 100.0 / total_budget_pct
            for wp in validated_wps:
                wp["budget_percentage"] = round(wp["budget_percentage"] * factor, 1)
            # Ensure WP0 stays <= 20% after normalization
            for wp in validated_wps:
                if wp["wp_number"] == 0 and wp["budget_percentage"] > 20:
                    excess = wp["budget_percentage"] - 20
                    wp["budget_percentage"] = 20
                    # Distribute excess to implementation WPs
                    impl_wps = [w for w in validated_wps if w["wp_number"] != 0]
                    if impl_wps:
                        per_wp = excess / len(impl_wps)
                        for w in impl_wps:
                            w["budget_percentage"] = round(w["budget_percentage"] + per_wp, 1)

        logger.info(f"Validated {len(validated_wps)} Work Packages")
        return validated_wps

    async def _generate_budget_breakdown(
        self,
        project_context: Dict,
        work_packages: List[Dict]
    ) -> Optional[Dict]:
        """
        Generate a detailed budget breakdown per WP and per partner,
        with cost categories and co-financing narrative.
        Returns a budget dict or None on failure.
        """
        import re

        prompt = self.prompts.get_budget_breakdown_prompt(
            project_context=project_context,
            work_packages=work_packages
        )

        response = await self._call_ai(prompt, temperature=0.3, max_tokens=2500)

        # Parse JSON response - handle markdown code fences
        cleaned = response.strip()
        if cleaned.startswith("```"):
            cleaned = re.sub(r'^```(?:json)?\s*', '', cleaned)
            cleaned = re.sub(r'\s*```$', '', cleaned)

        try:
            budget = json.loads(cleaned)
        except (json.JSONDecodeError, TypeError, ValueError) as e:
            logger.error(f"Failed to parse budget breakdown JSON: {e}")
            logger.debug(f"Raw budget response: {response[:500]}")
            return None

        if not isinstance(budget, dict):
            logger.error(f"Budget breakdown is not a dict: {type(budget)}")
            return None

        total_budget = project_context.get('budget', 250000)
        if isinstance(total_budget, str):
            total_budget = int(total_budget.replace(',', '').replace(' ', ''))

        # Validate and normalize amounts
        budget["total_grant"] = total_budget
        budget["currency"] = "EUR"

        # Validate per_work_package totals sum to total_grant
        per_wp = budget.get("per_work_package", [])
        if per_wp:
            wp_total = sum(wp.get("total_amount", 0) for wp in per_wp)
            if wp_total > 0 and abs(wp_total - total_budget) > 100:
                # Normalize WP amounts to match total budget
                factor = total_budget / wp_total
                for wp in per_wp:
                    wp["total_amount"] = round(wp.get("total_amount", 0) * factor)
                    # Normalize cost categories
                    cats = wp.get("cost_categories", {})
                    if cats:
                        cat_total = sum(cats.values())
                        if cat_total > 0:
                            cat_factor = wp["total_amount"] / cat_total
                            for cat_key in cats:
                                cats[cat_key] = round(cats[cat_key] * cat_factor)
                    wp["percentage"] = round((wp["total_amount"] / total_budget) * 100, 1)

            # Enforce WP0 max 20%
            for wp in per_wp:
                if wp.get("wp_number") == 0:
                    max_mgmt = int(total_budget * 0.20)
                    if wp.get("total_amount", 0) > max_mgmt:
                        wp["total_amount"] = max_mgmt
                        wp["percentage"] = 20.0

        # Validate per_partner totals
        per_partner = budget.get("per_partner", [])
        if per_partner:
            partner_total = sum(p.get("total_amount", 0) for p in per_partner)
            if partner_total > 0 and abs(partner_total - total_budget) > 100:
                factor = total_budget / partner_total
                for p in per_partner:
                    p["total_amount"] = round(p.get("total_amount", 0) * factor)
                    p["percentage"] = round((p["total_amount"] / total_budget) * 100, 1)
                    # Normalize WP allocations
                    wp_alloc = p.get("wp_allocations", {})
                    if wp_alloc:
                        alloc_total = sum(wp_alloc.values())
                        if alloc_total > 0:
                            alloc_factor = p["total_amount"] / alloc_total
                            for k in wp_alloc:
                                wp_alloc[k] = round(wp_alloc[k] * alloc_factor)

        # Ensure co-financing section exists
        if "co_financing" not in budget:
            estimated_costs = int(total_budget * 1.2)
            budget["co_financing"] = {
                "total_estimated_costs": estimated_costs,
                "eu_grant": total_budget,
                "partner_co_financing": estimated_costs - total_budget,
                "co_financing_percentage": round(((estimated_costs - total_budget) / estimated_costs) * 100, 1),
                "narrative": "Partner organisations will contribute in-kind resources including staff time, office space, and institutional infrastructure to cover costs exceeding the EU lump sum grant."
            }

        logger.info(f"Budget breakdown validated: €{total_budget:,} across {len(per_wp)} WPs and {len(per_partner)} partners")
        return budget

    async def _generate_project_timeline(
        self,
        project_context: Dict,
        work_packages: List[Dict]
    ) -> Optional[List[Dict]]:
        """
        Generate a quarterly project timeline derived from Work Packages.
        Returns a list of quarter dicts or None on failure.
        """
        import re

        prompt = self.prompts.get_timeline_prompt(
            project_context=project_context,
            work_packages=work_packages
        )

        response = await self._call_ai(prompt, temperature=0.3, max_tokens=2000)

        # Parse JSON response
        cleaned = response.strip()
        if cleaned.startswith("```"):
            cleaned = re.sub(r'^```(?:json)?\s*', '', cleaned)
            cleaned = re.sub(r'\s*```$', '', cleaned)

        try:
            timeline = json.loads(cleaned)
        except (json.JSONDecodeError, TypeError, ValueError) as e:
            logger.error(f"Failed to parse timeline JSON: {e}")
            logger.debug(f"Raw timeline response: {response[:500]}")
            return None

        if not isinstance(timeline, list):
            logger.error(f"Timeline response is not a list: {type(timeline)}")
            return None

        # Validate each quarter entry
        validated = []
        for entry in timeline:
            if not isinstance(entry, dict):
                continue
            validated.append({
                "quarter": entry.get("quarter", f"Q{len(validated) + 1}"),
                "months": entry.get("months", ""),
                "phase": entry.get("phase", ""),
                "active_wps": entry.get("active_wps", []),
                "activities": entry.get("activities", []),
                "milestones": entry.get("milestones", []),
                "deliverables": entry.get("deliverables", []),
            })

        logger.info(f"Generated timeline with {len(validated)} quarters")
        return validated

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
            # Skip generated-only sections (e.g., work_packages) - not question-based
            if section_data.get('generated'):
                continue
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
            # Skip non-dict sections (e.g., work_packages is a list)
            if not isinstance(section_answers, dict):
                continue
            for field, data in section_answers.items():
                if not isinstance(data, dict):
                    continue
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

        # --- 5. Target group number consistency ---
        # Extract target group quantities from answers
        target_numbers = {}
        target_patterns = [
            r'(\d[\d,]*)\s*(?:adult\s+learners?|participants?|beneficiar)',
            r'(\d[\d,]*)\s*(?:directly|direct\s+participants?)',
            r'(\d[\d,]*)\s*(?:indirectly|indirect)',
        ]
        for key, text in all_texts.items():
            text_lower = text.lower()
            for pattern in target_patterns:
                matches = re.findall(pattern, text_lower)
                if matches:
                    if key not in target_numbers:
                        target_numbers[key] = []
                    target_numbers[key].extend(matches)

        if len(target_numbers) >= 2:
            # Check for significant discrepancies in participant numbers
            all_nums = set()
            for nums in target_numbers.values():
                for n in nums:
                    try:
                        val = int(n.replace(',', ''))
                        if val > 10:  # Skip small numbers
                            all_nums.add(val)
                    except ValueError:
                        pass
            # Flag if the same category number varies significantly
            if len(all_nums) > 3:
                sorted_nums = sorted(all_nums)
                if sorted_nums[-1] > sorted_nums[0] * 5:
                    inconsistencies.append({
                        'type': 'target_numbers',
                        'sections': list(target_numbers.keys()),
                        'details': f"Target group numbers vary significantly across sections: "
                                   f"{', '.join(str(n) for n in sorted_nums[:5])}. "
                                   f"Ensure participant numbers are consistent."
                    })

        # --- 6. All partners mentioned in partnership section ---
        if expected_partners:
            partnership_texts = []
            for key, text in all_texts.items():
                if key.startswith('partnership.'):
                    partnership_texts.append(text)
            if partnership_texts:
                combined_partnership = ' '.join(partnership_texts).lower()
                missing_in_partnership = [
                    p for p in expected_partners
                    if p.lower() not in combined_partnership
                ]
                if missing_in_partnership:
                    inconsistencies.append({
                        'type': 'missing_partners_in_partnership',
                        'sections': ['partnership'],
                        'details': f"Partners not mentioned anywhere in partnership section: "
                                   f"{', '.join(missing_in_partnership)}. "
                                   f"All partners should be referenced in the partnership section."
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
    
    def _count_verification_needed(self, answers: Dict) -> List[Dict]:
        """
        Count [VERIFY:] tags across all generated answers and return them
        as a list of {field, placeholder_text} dicts for user review.
        """
        import re
        verification_items = []

        for section_key, section_answers in answers.items():
            # Skip non-dict sections (e.g., work_packages is a list)
            if not isinstance(section_answers, dict):
                continue
            for field, data in section_answers.items():
                if not isinstance(data, dict):
                    continue
                answer = data.get('answer', '')
                if not answer:
                    continue
                tags = re.findall(r'\[VERIFY:\s*([^\]]+)\]', answer)
                for tag_text in tags:
                    verification_items.append({
                        'field': f"{section_key}.{field}",
                        'placeholder_text': tag_text.strip()
                    })

        return verification_items

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