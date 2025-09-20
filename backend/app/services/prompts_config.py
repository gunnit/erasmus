from typing import Dict, List, Any
import json

class PromptsConfig:
    """
    Centralized prompts configuration for AI auto-fill service
    Contains specialized prompts for each section and question type
    """
    
    def __init__(self):
        self.section_prompts = self._initialize_section_prompts()
        self.question_type_prompts = self._initialize_question_prompts()
    
    def get_system_prompt(self) -> str:
        """
        Get the main system prompt for the AI
        """
        return """You are an expert Erasmus+ grant writer specializing in KA220-ADU (Adult Education) applications.
You have extensive experience in:
- EU funding mechanisms and evaluation criteria
- Adult education methodologies and best practices
- Project management and partnership coordination
- Impact assessment and sustainability planning
- Digital transformation and inclusive education

Your writing style is:
- Professional yet engaging
- Specific with concrete examples and measurable outcomes
- Aligned with EU priorities and values
- Evidence-based and data-driven when possible
- Clear, concise, and focused - prioritizing quality over quantity

You always:
- Use active voice and positive language
- Include specific numbers, percentages, and timelines
- Reference EU policies and priorities explicitly
- Demonstrate innovation and European added value
- Show clear cause-effect relationships
- Ensure consistency across all answers
- Maximize evaluation scores through strategic content"""
    
    def get_priority_analysis_prompt(self, priorities: List[str], project_idea: str) -> str:
        """
        Prompt for analyzing priority alignment
        """
        return f"""Analyze how this project aligns with EU priorities.

Selected Priorities:
{json.dumps(priorities, indent=2)}

Project Idea:
{project_idea}

Provide a detailed JSON analysis with:
{{
    "main_priority": "The primary priority this project addresses",
    "alignment_points": [
        "Specific ways the project addresses each priority"
    ],
    "key_themes": [
        "Central themes that connect to EU values"
    ],
    "innovation_aspects": [
        "How the project innovates within these priority areas"
    ],
    "cross_cutting_themes": [
        "Themes that span multiple priorities"
    ]
}}

Focus on:
1. Direct and measurable contributions to each priority
2. Innovative approaches within priority areas
3. Synergies between different priorities
4. Long-term impact on priority objectives
5. Scalability and transferability of solutions"""
    
    def get_partnership_analysis_prompt(self, lead_org: Dict, partners: List[Dict]) -> str:
        """
        Prompt for analyzing partnership structure
        """
        return f"""Analyze the partnership composition and synergies.

Lead Organization:
{json.dumps(lead_org, indent=2)}

Partner Organizations:
{json.dumps(partners, indent=2)}

Provide a JSON analysis with:
{{
    "complementarity": [
        "How partners complement each other's expertise"
    ],
    "expertise_map": {{
        "technical": ["Organizations with technical expertise"],
        "educational": ["Organizations with educational expertise"],
        "dissemination": ["Organizations with dissemination reach"],
        "target_access": ["Organizations with target group access"]
    }},
    "collaboration_strengths": [
        "Key strengths of this partnership"
    ],
    "geographic_coverage": "Description of geographic reach",
    "sector_diversity": "How different sectors are represented",
    "value_chain": "How partners cover the complete value chain"
}}

Consider:
1. Complementary skills and resources
2. Geographic and cultural diversity
3. Access to different target groups
4. Previous collaboration experience
5. Capacity for sustainability"""
    
    def get_innovation_analysis_prompt(self, project_idea: str, field: str) -> str:
        """
        Prompt for identifying innovation points
        """
        return f"""Identify innovative aspects of this project.

Project Idea:
{project_idea}

Field: {field}

Return a JSON array of innovation points that could include:
- Technological innovations (digital tools, platforms, AI)
- Methodological innovations (new approaches, frameworks)
- Social innovations (inclusion strategies, engagement methods)
- Process innovations (management, coordination, quality)
- Content innovations (curricula, materials, resources)
- Cross-sector innovations (unusual partnerships, transfers)

Format: ["Innovation point 1", "Innovation point 2", ...]

Focus on:
1. What makes this unique compared to existing solutions
2. How it advances the state of the art
3. Potential for replication and scaling
4. Addressing unmet needs innovatively
5. Combining existing elements in new ways"""
    
    def get_question_prompt(
        self,
        question: Dict,
        project_context: Dict,
        section_context: Dict,
        section_key: str
    ) -> str:
        """
        Get specialized prompt for a specific question
        """
        # Build comprehensive context
        context = f"""
PROJECT INFORMATION:
- Title: {project_context.get('title', 'N/A')}
- Field: {project_context.get('field', 'Adult Education')}
- Duration: {project_context.get('duration', '24 months')}
- Budget: €{project_context.get('budget', '250,000')}
- Target Groups: {project_context.get('target_groups', 'Adult learners')}

PROJECT IDEA:
{project_context.get('project_idea', '')}

LEAD ORGANIZATION:
{json.dumps(project_context.get('lead_org', {}), indent=2)}

PARTNER ORGANIZATIONS:
{json.dumps(project_context.get('partners', []), indent=2)}

SELECTED PRIORITIES:
{json.dumps(project_context.get('selected_priorities', []), indent=2)}
"""
        
        # Add section-specific context
        if section_context.get('priorities_analysis'):
            context += f"\n\nPRIORITY ANALYSIS:\n{json.dumps(section_context['priorities_analysis'], indent=2)}"
        
        if section_context.get('partner_analysis'):
            context += f"\n\nPARTNERSHIP ANALYSIS:\n{json.dumps(section_context['partner_analysis'], indent=2)}"
        
        if section_context.get('innovation_points'):
            context += f"\n\nINNOVATION POINTS:\n{json.dumps(section_context['innovation_points'], indent=2)}"
        
        # Add previous answers for consistency
        if section_context.get('previous_answers'):
            relevant_answers = self._get_relevant_previous_answers(
                section_context['previous_answers'],
                section_key,
                question['field']
            )
            if relevant_answers:
                context += f"\n\nRELEVANT PREVIOUS ANSWERS:\n{json.dumps(relevant_answers, indent=2)}"
        
        # Get section-specific instructions
        section_instructions = self._get_section_instructions(section_key)
        
        # Get question-specific tips
        question_tips = "\n".join([f"- {tip}" for tip in question.get('tips', [])])
        
        # Build the final prompt
        prompt = f"""{context}

CURRENT SECTION: {section_key}
{section_instructions}

QUESTION TO ANSWER:
{question.get('question')}

Character Limit: {question.get('character_limit', 'No limit')} characters
Evaluation Weight: {question.get('evaluation_weight', 'N/A')}/10

TIPS FOR THIS ANSWER:
{question_tips}

SPECIFIC REQUIREMENTS FOR THIS ANSWER:
{self._get_question_specific_requirements(question['field'])}

Write a CONCISE yet compelling answer that:
1. Directly addresses all parts of the question
2. Uses specific examples - be precise and avoid unnecessary elaboration
3. Aligns with EU priorities and values
4. Demonstrates measurable impact with concrete numbers
5. Shows innovation and European added value
6. MUST stay well within the character limit - aim for 70-80% of the limit
7. Maximizes evaluation score through quality, not quantity
8. Avoids redundancy and repetitive phrases
9. Uses clear, active voice and gets to the point quickly

IMPORTANT: Generate a focused, concise answer that prioritizes clarity and impact over length:"""
        
        return prompt
    
    def _initialize_section_prompts(self) -> Dict[str, str]:
        """
        Initialize prompts for each section
        """
        return {
            "project_summary": """This section provides an overview of your project.
Focus on clarity, coherence, and alignment with priorities.
Use concrete language and avoid jargon.
Ensure consistency between objectives, activities, and results.""",
            
            "relevance": """This section carries 30% of the total score.
Demonstrate deep understanding of EU priorities.
Show clear needs analysis with evidence.
Highlight innovation and European added value.
Use data and statistics where possible.""",
            
            "needs_analysis": """Demonstrate thorough research and understanding.
Use specific data and evidence.
Show clear link between needs and solutions.
Include stakeholder consultation results.""",
            
            "partnership": """This section evaluates partnership quality (20% of score).
Emphasize complementarity and synergies.
Show clear task distribution and responsibilities.
Demonstrate previous experience and capacity.""",
            
            "impact": """This section is worth 25% of the total score.
Focus on sustainability and long-term effects.
Include dissemination and exploitation strategies.
Show local, national, and European impact levels.""",
            
            "project_management": """This section is worth 25% of the total score.
Demonstrate professional project management.
Include quality assurance and risk management.
Show inclusive and green practices."""
        }
    
    def _initialize_question_prompts(self) -> Dict[str, str]:
        """
        Initialize specific requirements for question types
        """
        return {
            "objectives": "Start with clear, measurable objectives using SMART criteria. Link each objective to specific EU priorities.",
            "implementation": "Provide a clear timeline with specific activities, milestones, and deliverables. Show progression and logic.",
            "results": "List concrete, tangible outputs. Include both immediate results and long-term outcomes. Quantify where possible.",
            "priority_addressing": "Explicitly name each priority and explain detailed alignment. Use priority-specific terminology.",
            "motivation": "Show urgency and importance. Include statistics and evidence. Explain why EU funding is essential.",
            "innovation": "Compare to existing solutions. Highlight unique aspects. Show advancement of state-of-the-art.",
            "needs_addressed": "Use data and research. Show gap analysis. Include target group consultation results.",
            "partnership_formation": "Explain selection criteria. Show complementarity matrix. Highlight unique expertise combination.",
            "task_allocation": "Create clear work package structure. Show balanced distribution. Link tasks to partner expertise.",
            "sustainability": "Include business model. Show continuation strategy. Explain mainstreaming approach.",
            "monitoring": "Include KPIs and targets. Describe tools and methods. Show quality assurance framework.",
            "risk_management": "Include risk matrix. Show mitigation strategies. Cover technical, financial, and organizational risks.",
            "digital_tools": "List specific platforms and tools. Show digital transformation aspect. Include online collaboration methods.",
            "green_practices": "Include carbon footprint reduction. Show sustainable travel. Demonstrate environmental awareness.",
        }
    
    def _get_section_instructions(self, section_key: str) -> str:
        """
        Get specific instructions for a section
        """
        return self.section_prompts.get(section_key, "Answer comprehensively and professionally.")
    
    def _get_question_specific_requirements(self, field: str) -> str:
        """
        Get specific requirements for a question field
        """
        return self.question_type_prompts.get(field, "Provide a detailed, well-structured answer that addresses all aspects of the question.")
    
    def _get_relevant_previous_answers(
        self,
        previous_answers: Dict,
        current_section: str,
        current_field: str
    ) -> Dict:
        """
        Extract relevant previous answers for context
        """
        relevant = {}
        
        # Define relationships between questions
        relationships = {
            "objectives_results": ["objectives", "results"],
            "sustainability": ["results", "impact"],
            "task_allocation": ["partnership_formation"],
            "monitoring": ["objectives", "results"],
            "organizational_impact": ["results", "target_groups"],
            "wider_impact": ["european_value", "priority_addressing"]
        }
        
        # Get related fields
        related_fields = relationships.get(current_field, [])
        
        # Extract relevant answers
        for section, answers in previous_answers.items():
            for field, answer_data in answers.items():
                if field in related_fields or field == "objectives":  # Always include objectives
                    if section not in relevant:
                        relevant[section] = {}
                    relevant[section][field] = answer_data.get('answer', '')[:500]  # Truncate for context
        
        return relevant
    
    def get_evaluation_criteria_prompt(self, section: str) -> str:
        """
        Get evaluation criteria for scoring optimization
        """
        criteria = {
            "relevance": """
            - Priority alignment (40% of section score)
            - Needs analysis quality (30% of section score)
            - Innovation demonstration (20% of section score)
            - European added value (10% of section score)
            """,
            "partnership": """
            - Partner complementarity (40% of section score)
            - Task distribution clarity (30% of section score)
            - Coordination mechanisms (20% of section score)
            - Partner commitment (10% of section score)
            """,
            "impact": """
            - Sustainability planning (35% of section score)
            - Dissemination strategy (25% of section score)
            - Impact levels (25% of section score)
            - Measurement methods (15% of section score)
            """,
            "project_management": """
            - Quality assurance (30% of section score)
            - Risk management (25% of section score)
            - Budget and time management (20% of section score)
            - Inclusive and green practices (25% of section score)
            """
        }
        return criteria.get(section, "Focus on comprehensive, specific, and measurable answers.")
    
    def get_enhancement_prompt(self, answer: str, question: Dict, quality_score: float) -> str:
        """
        Prompt for enhancing low-quality answers
        """
        return f"""Enhance this answer to improve its quality and evaluation score.

Current Answer:
{answer}

Question: {question.get('question')}
Current Quality Score: {quality_score:.2f}/1.00
Character Limit: {question.get('character_limit', 'No limit')}

Issues to address:
{self._identify_issues(answer, question, quality_score)}

Enhance the answer by:
1. Adding specific examples and data
2. Improving structure and clarity
3. Strengthening EU priority alignment
4. Including measurable outcomes
5. Demonstrating innovation
6. Ensuring it addresses all parts of the question

Provide the enhanced answer:"""
    
    def _identify_issues(self, answer: str, question: Dict, quality_score: float) -> str:
        """
        Identify specific issues with an answer
        """
        issues = []
        
        if quality_score < 0.3:
            issues.append("- Answer is too brief or generic")
        
        if len(answer) < question.get('character_limit', 2000) * 0.5:
            issues.append("- Not utilizing available character space effectively")
        
        if not any(char.isdigit() for char in answer):
            issues.append("- Lacks specific numbers or data")
        
        if answer.count('\n') < 2:
            issues.append("- Poor structure, needs better paragraphing")
        
        tips = question.get('tips', [])
        for tip in tips:
            keywords = tip.lower().split()
            if not any(keyword in answer.lower() for keyword in keywords):
                issues.append(f"- Missing element: {tip}")
        
        return "\n".join(issues) if issues else "- General improvement needed"