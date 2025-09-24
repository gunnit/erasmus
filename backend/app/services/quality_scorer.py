"""
Quality Scoring Service for Erasmus+ Grant Applications
Evaluates proposals against official Erasmus+ evaluation criteria
"""
from typing import Dict, List, Optional, Any, Tuple
import re
import json
import logging
from datetime import datetime
from collections import defaultdict

logger = logging.getLogger(__name__)

class QualityScorer:
    """
    Comprehensive quality scoring system for Erasmus+ KA220-ADU applications
    Based on official evaluation criteria:
    - Relevance of the project (25 points)
    - Quality of the project design and implementation (30 points)
    - Quality of the partnership and cooperation arrangements (20 points)
    - Impact (25 points)
    Total: 100 points (minimum 70 to pass)
    """

    def __init__(self):
        # Official Erasmus+ section weights
        self.section_weights = {
            'relevance': 25.0,
            'quality_design': 30.0,
            'partnership': 20.0,
            'impact': 25.0
        }

        # Minimum score thresholds (must score at least half the maximum points)
        self.thresholds = {
            'total': 70,
            'relevance': 13,  # Half of 25 rounded up
            'quality_design': 15,  # Half of 30
            'partnership': 10,  # Half of 20
            'impact': 13  # Half of 25 rounded up
        }

        # EU priority keywords for relevance scoring
        self.priority_keywords = {
            'inclusion': ['inclusive', 'inclusion', 'diversity', 'equal', 'accessibility',
                         'disadvantaged', 'marginalized', 'barrier-free'],
            'digital': ['digital', 'technology', 'online', 'e-learning', 'virtual',
                       'digitalization', 'ICT', 'digital transformation'],
            'green': ['sustainable', 'environmental', 'green', 'climate', 'eco-friendly',
                     'carbon', 'renewable', 'circular economy'],
            'participation': ['democratic', 'civic', 'participation', 'engagement',
                            'citizenship', 'values', 'active citizenship']
        }

        # Load question metadata
        self.question_metadata = self._load_question_metadata()

    def _load_question_metadata(self) -> Dict:
        """Load question metadata from form_questions.json"""
        try:
            import os
            json_path = os.path.join(os.path.dirname(__file__), '..', '..', 'data', 'form_questions.json')
            with open(json_path, 'r') as f:
                return json.load(f)
        except Exception as e:
            logger.error(f"Failed to load question metadata: {e}")
            return {}

    async def calculate_proposal_score(
        self,
        proposal: Dict,
        detailed_feedback: bool = True
    ) -> Dict[str, Any]:
        """
        Calculate comprehensive quality score for a proposal

        Args:
            proposal: Complete proposal data with answers
            detailed_feedback: Whether to generate detailed improvement suggestions

        Returns:
            Dict containing overall score, section scores, feedback, and recommendations
        """
        logger.info(f"Calculating quality score for proposal: {proposal.get('title', 'Unknown')}")

        # Extract answers from proposal
        answers = proposal.get('answers', {})
        if not answers:
            return self._generate_empty_score_result("No answers found in proposal")

        # Calculate section scores
        section_results = {}
        for section_key in ['project_summary', 'relevance', 'needs_analysis',
                           'partnership', 'impact', 'project_management']:
            if section_key in answers:
                section_results[section_key] = await self._evaluate_section(
                    section_key,
                    answers[section_key],
                    proposal
                )

        # Map to evaluation categories and apply weights
        weighted_scores = self._calculate_weighted_scores(section_results)

        # Calculate overall score
        overall_score = sum(weighted_scores.values())

        # Check threshold compliance
        thresholds_met = self._check_thresholds(overall_score, weighted_scores)

        # Generate feedback and recommendations
        feedback = None
        if detailed_feedback:
            feedback = await self._generate_comprehensive_feedback(
                section_results,
                weighted_scores,
                thresholds_met,
                proposal
            )

        return {
            'overall_score': round(overall_score, 1),
            'section_scores': {k: round(v, 1) for k, v in weighted_scores.items()},
            'raw_section_scores': section_results,
            'thresholds_met': thresholds_met,
            'pass_evaluation': thresholds_met['all_thresholds_met'],
            'feedback': feedback,
            'calculated_at': datetime.utcnow().isoformat(),
            'scoring_version': '1.0'
        }

    async def _evaluate_section(
        self,
        section_key: str,
        section_answers: Dict,
        proposal: Dict
    ) -> Dict[str, Any]:
        """Evaluate a single section of the proposal"""

        section_score = 0
        question_scores = {}
        max_possible = 0

        # Get section metadata
        section_data = self.question_metadata.get('sections', {}).get(section_key, {})
        questions = section_data.get('questions', [])

        for question in questions:
            field = question.get('field')
            if field not in section_answers:
                continue

            answer_data = section_answers[field]
            answer_text = answer_data.get('answer', '') if isinstance(answer_data, dict) else str(answer_data)

            # Calculate question score components
            question_result = await self._score_single_answer(
                answer_text,
                question,
                section_key,
                proposal
            )

            # Weight by evaluation weight from metadata
            eval_weight = question.get('evaluation_weight', 5) / 10.0
            weighted_score = question_result['score'] * eval_weight

            section_score += weighted_score
            max_possible += eval_weight * 100
            question_scores[field] = {
                **question_result,
                'weighted_score': weighted_score,
                'weight': eval_weight
            }

        # Normalize to 0-100 scale
        normalized_score = (section_score / max_possible * 100) if max_possible > 0 else 0

        return {
            'score': normalized_score,
            'question_scores': question_scores,
            'strengths': self._identify_section_strengths(question_scores),
            'weaknesses': self._identify_section_weaknesses(question_scores)
        }

    async def _score_single_answer(
        self,
        answer: str,
        question: Dict,
        section_key: str,
        proposal: Dict
    ) -> Dict[str, float]:
        """Score a single answer based on multiple criteria"""

        if not answer:
            return {
                'score': 0,
                'completeness': 0,
                'keyword_coverage': 0,
                'structure_quality': 0,
                'specificity': 0,
                'priority_alignment': 0
            }

        # Calculate component scores
        completeness = self._calculate_completeness(answer, question.get('character_limit', 2000))
        keyword_coverage = self._calculate_keyword_coverage(answer, question)
        structure_quality = self._calculate_structure_quality(answer)
        specificity = self._calculate_specificity(answer)
        priority_alignment = self._calculate_priority_alignment(answer, proposal)

        # Different weight distributions based on section
        if section_key == 'relevance':
            weights = {
                'completeness': 0.2,
                'keyword_coverage': 0.25,
                'structure_quality': 0.15,
                'specificity': 0.2,
                'priority_alignment': 0.2
            }
        elif section_key == 'project_management':
            weights = {
                'completeness': 0.25,
                'keyword_coverage': 0.15,
                'structure_quality': 0.2,
                'specificity': 0.3,
                'priority_alignment': 0.1
            }
        else:
            weights = {
                'completeness': 0.25,
                'keyword_coverage': 0.2,
                'structure_quality': 0.2,
                'specificity': 0.25,
                'priority_alignment': 0.1
            }

        # Calculate weighted average
        final_score = (
            completeness * weights['completeness'] +
            keyword_coverage * weights['keyword_coverage'] +
            structure_quality * weights['structure_quality'] +
            specificity * weights['specificity'] +
            priority_alignment * weights['priority_alignment']
        )

        return {
            'score': final_score,
            'completeness': completeness,
            'keyword_coverage': keyword_coverage,
            'structure_quality': structure_quality,
            'specificity': specificity,
            'priority_alignment': priority_alignment
        }

    def _calculate_completeness(self, answer: str, char_limit: int) -> float:
        """Calculate answer completeness based on character usage"""
        if not answer:
            return 0

        answer_length = len(answer)

        if answer_length >= char_limit * 0.9:
            return 100
        elif answer_length >= char_limit * 0.7:
            return 85
        elif answer_length >= char_limit * 0.5:
            return 70
        elif answer_length >= char_limit * 0.3:
            return 50
        else:
            # Linear scaling for very short answers
            return (answer_length / (char_limit * 0.3)) * 50

    def _calculate_keyword_coverage(self, answer: str, question: Dict) -> float:
        """Calculate coverage of expected keywords from tips"""
        tips = question.get('tips', [])
        if not tips:
            return 70  # Default score if no tips available

        answer_lower = answer.lower()
        keywords_found = 0
        total_keywords = 0

        for tip in tips:
            # Extract key phrases from tips
            key_phrases = self._extract_key_phrases(tip)
            total_keywords += len(key_phrases)

            for phrase in key_phrases:
                if phrase.lower() in answer_lower:
                    keywords_found += 1

        if total_keywords == 0:
            return 70

        coverage_ratio = keywords_found / total_keywords
        # Scale to 0-100 with bonus for exceeding expectations
        return min(100, coverage_ratio * 120)

    def _extract_key_phrases(self, tip: str) -> List[str]:
        """Extract key phrases from tip text"""
        # Common important terms in Erasmus+ context
        important_terms = [
            'specific', 'measurable', 'achievable', 'relevant', 'time-bound',
            'innovative', 'sustainable', 'inclusive', 'digital', 'green',
            'transnational', 'European', 'impact', 'dissemination', 'quality',
            'partnership', 'cooperation', 'methodology', 'evaluation', 'monitoring'
        ]

        phrases = []
        for term in important_terms:
            if term in tip.lower():
                phrases.append(term)

        # Also extract quoted phrases or specific examples
        quoted = re.findall(r'"([^"]*)"', tip)
        phrases.extend(quoted)

        return phrases if phrases else tip.split()[:3]  # Fallback to first 3 words

    def _calculate_structure_quality(self, answer: str) -> float:
        """Evaluate the structural quality of the answer"""
        score = 0

        # Check for paragraphs (good structure)
        paragraph_count = len([p for p in answer.split('\n\n') if p.strip()])
        if paragraph_count >= 3:
            score += 30
        elif paragraph_count >= 2:
            score += 20
        elif paragraph_count >= 1:
            score += 10

        # Check for lists (organized information)
        has_bullets = any(marker in answer for marker in ['•', '●', '○', '■'])
        has_numbers = bool(re.search(r'\n\s*\d+[\.\)]\s+', answer))
        has_dashes = bool(re.search(r'\n\s*[-–]\s+', answer))

        if has_bullets or has_numbers or has_dashes:
            score += 25

        # Check for sections/headers
        has_headers = bool(re.search(r'\n[A-Z][^.!?]*:\s*\n', answer))
        if has_headers:
            score += 15

        # Check for logical flow indicators
        flow_indicators = ['firstly', 'secondly', 'finally', 'moreover', 'furthermore',
                          'additionally', 'however', 'therefore', 'consequently']
        flow_count = sum(1 for indicator in flow_indicators if indicator in answer.lower())
        score += min(15, flow_count * 5)

        # Check for conclusion/summary
        has_conclusion = any(phrase in answer.lower()
                           for phrase in ['in conclusion', 'to summarize', 'overall', 'in summary'])
        if has_conclusion:
            score += 15

        return min(100, score)

    def _calculate_specificity(self, answer: str) -> float:
        """Calculate how specific and concrete the answer is"""
        score = 0

        # Check for numbers and percentages
        numbers = re.findall(r'\b\d+\b', answer)
        if len(numbers) >= 5:
            score += 30
        elif len(numbers) >= 3:
            score += 20
        elif len(numbers) >= 1:
            score += 10

        # Check for percentages
        if re.search(r'\d+%', answer):
            score += 15

        # Check for monetary values
        if re.search(r'€\s*[\d,]+|EUR\s*[\d,]+', answer):
            score += 15

        # Check for time periods
        time_patterns = [r'\d+\s*(months?|years?|weeks?|days?)',
                        r'Q[1-4]\s+20\d{2}',
                        r'(January|February|March|April|May|June|July|August|September|October|November|December)']
        if any(re.search(pattern, answer, re.IGNORECASE) for pattern in time_patterns):
            score += 10

        # Check for specific examples
        example_indicators = ['for example', 'for instance', 'such as', 'including',
                             'specifically', 'in particular', 'namely']
        example_count = sum(1 for indicator in example_indicators
                          if indicator in answer.lower())
        score += min(20, example_count * 10)

        # Check for named entities (organizations, locations, methods)
        # Simple heuristic: capitalized words that aren't sentence starters
        sentences = answer.split('.')
        named_entities = 0
        for sentence in sentences:
            words = sentence.strip().split()
            if len(words) > 1:
                # Skip first word (sentence starter)
                capitals = [w for w in words[1:] if w and w[0].isupper() and not w.isupper()]
                named_entities += len(capitals)

        if named_entities >= 5:
            score += 10

        return min(100, score)

    def _calculate_priority_alignment(self, answer: str, proposal: Dict) -> float:
        """Calculate alignment with selected EU priorities"""
        selected_priorities = proposal.get('priorities', [])
        if not selected_priorities:
            return 50  # Neutral score if no priorities specified

        answer_lower = answer.lower()
        score = 0

        for priority in selected_priorities:
            priority_key = priority.lower().split()[0]  # Get first word as key

            # Check for priority keywords
            if priority_key in self.priority_keywords:
                keywords = self.priority_keywords[priority_key]
                keyword_count = sum(1 for keyword in keywords if keyword in answer_lower)

                # Scale based on keyword presence
                if keyword_count >= 3:
                    score += 100 / len(selected_priorities)
                elif keyword_count >= 2:
                    score += 70 / len(selected_priorities)
                elif keyword_count >= 1:
                    score += 40 / len(selected_priorities)

        return min(100, score)

    def _calculate_weighted_scores(self, section_results: Dict) -> Dict[str, float]:
        """Map section scores to evaluation criteria and apply weights"""

        # Initialize weighted scores
        weighted = {
            'relevance': 0,
            'quality_design': 0,
            'partnership': 0,
            'impact': 0
        }

        # Map sections to evaluation criteria
        if 'relevance' in section_results:
            weighted['relevance'] = (section_results['relevance']['score'] / 100) * self.section_weights['relevance']

        if 'needs_analysis' in section_results:
            # Needs analysis contributes to relevance
            weighted['relevance'] += (section_results['needs_analysis']['score'] / 100) * (self.section_weights['relevance'] * 0.2)
            weighted['relevance'] = min(weighted['relevance'], self.section_weights['relevance'])

        if 'partnership' in section_results:
            weighted['partnership'] = (section_results['partnership']['score'] / 100) * self.section_weights['partnership']

        if 'impact' in section_results:
            weighted['impact'] = (section_results['impact']['score'] / 100) * self.section_weights['impact']

        if 'project_management' in section_results:
            # Project management contributes to Quality of Design and Implementation
            weighted['quality_design'] = (section_results['project_management']['score'] / 100) * self.section_weights['quality_design']

        # Project summary contributes to overall coherence (distributed across sections)
        if 'project_summary' in section_results:
            summary_contribution = (section_results['project_summary']['score'] / 100) * 5  # 5 points total
            for key in weighted:
                weighted[key] += summary_contribution / 4

        return weighted

    def _check_thresholds(self, overall_score: float, weighted_scores: Dict) -> Dict[str, bool]:
        """Check if score meets minimum thresholds"""

        return {
            'total': overall_score >= self.thresholds['total'],
            'relevance': weighted_scores.get('relevance', 0) >= self.thresholds['relevance'],
            'quality_design': weighted_scores.get('quality_design', 0) >= self.thresholds['quality_design'],
            'partnership': weighted_scores.get('partnership', 0) >= self.thresholds['partnership'],
            'impact': weighted_scores.get('impact', 0) >= self.thresholds['impact'],
            'all_thresholds_met': (
                overall_score >= self.thresholds['total'] and
                weighted_scores.get('relevance', 0) >= self.thresholds['relevance'] and
                weighted_scores.get('quality_design', 0) >= self.thresholds['quality_design'] and
                weighted_scores.get('partnership', 0) >= self.thresholds['partnership'] and
                weighted_scores.get('impact', 0) >= self.thresholds['impact']
            )
        }

    def _identify_section_strengths(self, question_scores: Dict) -> List[str]:
        """Identify strengths in a section based on question scores"""
        strengths = []

        for field, scores in question_scores.items():
            if scores['weighted_score'] >= scores['weight'] * 80:  # 80% or higher
                if scores['completeness'] >= 90:
                    strengths.append(f"Comprehensive answer for {field}")
                if scores['specificity'] >= 80:
                    strengths.append(f"Highly specific and concrete {field}")
                if scores['priority_alignment'] >= 80:
                    strengths.append(f"Strong EU priority alignment in {field}")

        return strengths[:3]  # Return top 3 strengths

    def _identify_section_weaknesses(self, question_scores: Dict) -> List[str]:
        """Identify weaknesses in a section based on question scores"""
        weaknesses = []

        for field, scores in question_scores.items():
            if scores['weighted_score'] < scores['weight'] * 60:  # Below 60%
                if scores['completeness'] < 50:
                    weaknesses.append(f"Insufficient detail in {field}")
                if scores['specificity'] < 40:
                    weaknesses.append(f"Too generic/vague in {field}")
                if scores['structure_quality'] < 40:
                    weaknesses.append(f"Poor structure in {field}")

        return weaknesses[:3]  # Return top 3 weaknesses

    async def _generate_comprehensive_feedback(
        self,
        section_results: Dict,
        weighted_scores: Dict,
        thresholds_met: Dict,
        proposal: Dict
    ) -> Dict[str, Any]:
        """Generate comprehensive feedback and improvement suggestions"""

        # Overall assessment
        overall_score = sum(weighted_scores.values())

        if overall_score >= 90:
            overall_assessment = "Excellent proposal ready for submission"
            classification = "excellent"
        elif overall_score >= 80:
            overall_assessment = "Very good proposal with minor improvements recommended"
            classification = "very_good"
        elif overall_score >= 70:
            overall_assessment = "Good proposal meeting minimum requirements"
            classification = "good"
        elif overall_score >= 60:
            overall_assessment = "Below threshold - improvements needed to meet minimum standards"
            classification = "below_threshold"
        elif overall_score >= 50:
            overall_assessment = "Poor proposal requiring major revisions"
            classification = "poor"
        else:
            overall_assessment = "Proposal needs substantial rework to meet standards"
            classification = "failing"

        # Collect all strengths and weaknesses
        all_strengths = []
        all_weaknesses = []
        improvements = []

        for section_key, result in section_results.items():
            all_strengths.extend(result.get('strengths', []))
            all_weaknesses.extend(result.get('weaknesses', []))

            # Generate improvements for low-scoring questions
            for field, scores in result.get('question_scores', {}).items():
                if scores['weighted_score'] < scores['weight'] * 70:  # Below 70%
                    improvement = self._generate_improvement_suggestion(
                        field,
                        scores,
                        section_key,
                        result['score']
                    )
                    if improvement:
                        improvements.append(improvement)

        # Sort improvements by potential impact
        improvements.sort(key=lambda x: x['potential_score_increase'], reverse=True)

        # Critical improvements (for failing thresholds)
        critical_improvements = []
        if not thresholds_met['relevance']:
            critical_improvements.append({
                'section': 'relevance',
                'issue': 'Below minimum relevance threshold',
                'suggestion': 'Strengthen alignment with EU priorities and demonstrate clear European added value'
            })

        if not thresholds_met['quality_design']:
            critical_improvements.append({
                'section': 'quality_design',
                'issue': 'Below minimum quality of design threshold',
                'suggestion': 'Improve project objectives clarity, work plan structure, and evaluation measures'
            })

        if not thresholds_met['partnership']:
            critical_improvements.append({
                'section': 'partnership',
                'issue': 'Below minimum partnership quality threshold',
                'suggestion': 'Strengthen partner mix, clarify roles, and improve cooperation mechanisms'
            })

        if not thresholds_met['impact']:
            critical_improvements.append({
                'section': 'impact',
                'issue': 'Below minimum impact threshold',
                'suggestion': 'Strengthen sustainability plans and dissemination strategy'
            })

        return {
            'overall_assessment': overall_assessment,
            'classification': classification,
            'strengths': all_strengths[:5],  # Top 5 strengths
            'weaknesses': all_weaknesses[:5],  # Top 5 weaknesses
            'critical_improvements': critical_improvements,
            'improvements': improvements[:10],  # Top 10 improvements
            'quick_wins': [imp for imp in improvements if imp['difficulty'] == 'easy'][:3],
            'threshold_warnings': self._generate_threshold_warnings(thresholds_met, weighted_scores)
        }

    def _generate_improvement_suggestion(
        self,
        field: str,
        scores: Dict,
        section_key: str,
        section_score: float
    ) -> Dict[str, Any]:
        """Generate specific improvement suggestion for a field"""

        # Identify the main issue
        issues = []
        if scores['completeness'] < 50:
            issues.append('length')
        if scores['specificity'] < 50:
            issues.append('specificity')
        if scores['structure_quality'] < 50:
            issues.append('structure')
        if scores['keyword_coverage'] < 50:
            issues.append('keywords')

        if not issues:
            return None

        main_issue = issues[0]

        suggestions = {
            'length': f"Expand your answer to use at least 70% of the character limit",
            'specificity': f"Add specific examples, numbers, and concrete details",
            'structure': f"Organize answer with clear paragraphs and bullet points",
            'keywords': f"Include more relevant keywords from the evaluation criteria"
        }

        # Calculate potential score increase
        current_contribution = scores['weighted_score']
        potential_contribution = scores['weight'] * 85  # Target 85% score
        potential_increase = (potential_contribution - current_contribution) * (self.section_weights.get(section_key, 25) / 100)

        return {
            'section': section_key,
            'field': field,
            'current_score': round(scores['score'], 1),
            'target_score': 85,
            'issue': main_issue,
            'suggestion': suggestions[main_issue],
            'difficulty': 'easy' if main_issue in ['length', 'structure'] else 'medium',
            'potential_score_increase': round(potential_increase, 1),
            'priority': 'high' if potential_increase > 2 else 'medium'
        }

    def _generate_threshold_warnings(
        self,
        thresholds_met: Dict,
        weighted_scores: Dict
    ) -> List[str]:
        """Generate warnings for scores close to thresholds"""
        warnings = []

        # Check if close to failing thresholds (within 2 points)
        if weighted_scores['relevance'] < self.thresholds['relevance'] + 2:
            if not thresholds_met['relevance']:
                warnings.append(f"CRITICAL: Relevance score ({weighted_scores['relevance']:.1f}) below minimum threshold ({self.thresholds['relevance']})")
            else:
                warnings.append(f"Warning: Relevance score ({weighted_scores['relevance']:.1f}) close to minimum threshold ({self.thresholds['relevance']})")

        if weighted_scores['quality_design'] < self.thresholds['quality_design'] + 2:
            if not thresholds_met['quality_design']:
                warnings.append(f"CRITICAL: Quality of design score ({weighted_scores['quality_design']:.1f}) below minimum threshold ({self.thresholds['quality_design']})")
            else:
                warnings.append(f"Warning: Quality of design score ({weighted_scores['quality_design']:.1f}) close to minimum threshold ({self.thresholds['quality_design']})")

        if weighted_scores['partnership'] < self.thresholds['partnership'] + 2:
            if not thresholds_met['partnership']:
                warnings.append(f"CRITICAL: Partnership score ({weighted_scores['partnership']:.1f}) below minimum threshold ({self.thresholds['partnership']})")
            else:
                warnings.append(f"Warning: Partnership score ({weighted_scores['partnership']:.1f}) close to minimum threshold ({self.thresholds['partnership']})")

        if weighted_scores['impact'] < self.thresholds['impact'] + 2:
            if not thresholds_met['impact']:
                warnings.append(f"CRITICAL: Impact score ({weighted_scores['impact']:.1f}) below minimum threshold ({self.thresholds['impact']})")
            else:
                warnings.append(f"Warning: Impact score ({weighted_scores['impact']:.1f}) close to minimum threshold ({self.thresholds['impact']})")

        return warnings

    def _generate_empty_score_result(self, reason: str) -> Dict[str, Any]:
        """Generate empty score result when scoring cannot be performed"""
        return {
            'overall_score': 0,
            'section_scores': {
                'relevance': 0,
                'quality_design': 0,
                'partnership': 0,
                'impact': 0
            },
            'raw_section_scores': {},
            'thresholds_met': {
                'total': False,
                'relevance': False,
                'quality_design': False,
                'partnership': False,
                'impact': False,
                'all_thresholds_met': False
            },
            'pass_evaluation': False,
            'feedback': {
                'overall_assessment': reason,
                'classification': 'error',
                'strengths': [],
                'weaknesses': [],
                'improvements': [],
                'critical_improvements': []
            },
            'calculated_at': datetime.utcnow().isoformat(),
            'error': reason
        }