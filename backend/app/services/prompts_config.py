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

        # Get evaluation criteria for this section (previously unused)
        evaluation_criteria = self.get_evaluation_criteria_prompt(section_key)

        # Build the final prompt
        prompt = f"""{context}

CURRENT SECTION: {section_key}
{section_instructions}

EVALUATION CRITERIA FOR THIS SECTION (maximize your score on these):
{evaluation_criteria}

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
            "project_summary": """This section provides a CONCISE executive summary of your project.
IMPORTANT: This summary is generated AFTER all other sections - synthesize the key points.
Character limit is now 500 characters per question - be EXTREMELY concise.
Focus on the most impactful elements from the detailed answers already provided.
Extract and condense the essence of: objectives, activities, and expected results.
Use bullet-point style thinking to maximize information density.""",
            
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
        Initialize specific requirements for question types.
        EVERY question field must have a detailed prompt - no field should fall through to the generic default.
        """
        return {
            # --- Project Summary (generated last, synthesis mode) ---
            "objectives": "SUMMARY MODE (500 chars max): Extract 3-4 KEY objectives from the full application. Use numbers and concrete targets. Be extremely concise.",
            "implementation": "SUMMARY MODE (500 chars max): List only the MAIN activities in brief. Focus on core actions. Use abbreviated format.",
            "results": "SUMMARY MODE (500 chars max): State 3-4 MAIN outputs/outcomes. Use numbers and metrics. Maximum brevity required.",

            # --- Relevance Section (30 points) ---
            "priority_addressing": """Explicitly name EACH selected priority and dedicate a paragraph to each one explaining alignment.
Use priority-specific EU terminology (e.g., 'digital transformation', 'green transition', 'social inclusion').
For each priority: (1) state the priority name, (2) explain HOW the project addresses it with concrete activities,
(3) describe MEASURABLE outcomes linked to this priority, (4) reference relevant EU policy documents or frameworks.
Evaluators score this on depth of understanding, not just mentioning priority names.""",

            "motivation": """Structure around three pillars: (1) URGENCY - why this project is needed NOW with current statistics
and evidence from EU reports, Eurostat, or OECD data; (2) GAP - what existing solutions fail to address and why
this project fills that gap; (3) EU FUNDING JUSTIFICATION - why this cannot be achieved without EU support,
why national funding is insufficient, and what the cost of inaction would be.
Include at least 2-3 concrete statistics. Reference the European Education Area 2025 targets where relevant.""",

            "objectives_results": """Structure as: OBJECTIVES (using SMART format) followed by CONCRETE RESULTS.
For each objective: state it clearly, link it to a specific priority, define measurable targets (numbers, percentages, timeframes).
For results: list tangible outputs (toolkits, curricula, platforms, publications) with quantities.
Show clear cause-effect chains: objective → activities → outputs → outcomes → impact.
Evaluators look for logical coherence between objectives, results, and the priorities selected.""",

            "innovation": """Structure around: (1) STATE OF THE ART - briefly describe current approaches in the field;
(2) INNOVATION - what is genuinely new (methodology, technology, combination, target group, approach);
(3) COMPARISON - how this differs from and improves upon existing EU-funded projects;
(4) ADVANCEMENT - how this pushes the field forward. Be specific about WHAT is innovative and WHY.
Mention types: technological innovation (digital tools, AI, platforms), methodological innovation (new pedagogies,
frameworks), social innovation (new ways of engaging marginalized groups), process innovation (novel partnerships).
Avoid vague claims like 'innovative approach' - instead describe the specific innovation.""",

            "complementarity": """Explain how this project BUILDS ON rather than DUPLICATES existing work.
For each participating organisation: (1) name their relevant previous projects/initiatives,
(2) explain what was achieved and what gaps remain, (3) show how THIS project addresses those gaps.
Demonstrate awareness of other EU-funded projects in the same field and explain differentiation.
Show synergies: how lessons learned from previous work directly inform this project's design.
Evaluators penalize proposals that seem unaware of existing work or that duplicate previous efforts.""",

            "european_value": """This is worth 8 evaluation points - one of the highest-weighted questions.
Structure around: (1) TRANSNATIONAL NECESSITY - why the results CANNOT be achieved by one country alone,
what specific knowledge/expertise/perspectives each country brings that others lack;
(2) MUTUAL LEARNING - concrete examples of cross-border knowledge transfer between partner countries,
how different national contexts enrich the outputs;
(3) TRANSFERABILITY - how results will be applicable across EU member states, not just partner countries;
(4) EUROPEAN DIMENSION - how the project contributes to European identity, values, and the European Education Area.
Name specific partner countries and what each uniquely contributes. Show that the partnership composition
is essential to achieving results, not just administratively convenient.""",

            # --- Needs Analysis Section ---
            "needs_addressed": """Use data and research to demonstrate needs. Include:
(1) EVIDENCE BASE - cite statistics from Eurostat, OECD, national reports showing the problem's scale;
(2) GAP ANALYSIS - identify specific gaps between current situation and desired state;
(3) TARGET GROUP NEEDS - what specific needs have been identified through consultation;
(4) STAKEHOLDER INPUT - results of surveys, interviews, focus groups with target groups.
Show a clear chain: evidence → identified need → proposed solution.""",

            "target_groups": """Clearly define PRIMARY and SECONDARY target groups with demographics.
For each target group: (1) quantify the group (how many will be directly/indirectly reached),
(2) describe their specific characteristics and challenges,
(3) explain HOW each participating organisation currently engages with them,
(4) describe access strategies for hard-to-reach subgroups.
Include concrete numbers: e.g., '200 adult learners directly, 1,500 indirectly through multiplier events'.""",

            "needs_identification": """Describe the METHODOLOGY used to identify needs:
(1) RESEARCH METHODS - surveys, desk research, literature review, data analysis;
(2) CONSULTATION PROCESS - who was consulted, how, and key findings;
(3) PARTNER INPUT - how each partner contributed their local/national perspective;
(4) VALIDATION - how identified needs were validated with stakeholders.
Include specific examples: 'A survey of 150 adult educators across 4 countries revealed that 73% lack digital skills training.'""",

            "addressing_needs": """Create a clear NEEDS-TO-SOLUTIONS mapping. For each identified need:
(1) state the need clearly, (2) describe the specific project activity that addresses it,
(3) explain the expected outcome, (4) define how success will be measured.
Use a structured format that evaluators can easily follow. Show that EVERY identified need has a corresponding
project response. Reference the methodology described in the needs analysis to show coherence.
Include the target group perspective: how will beneficiaries experience the solution?
Evaluators look for logical coherence between the needs analysis and the proposed activities.""",

            # --- Partnership Section (20 points) ---
            "partnership_formation": """Explain selection criteria. Show complementarity matrix. Highlight unique expertise combination.
Structure: (1) FORMATION STORY - how and why partners were identified and selected;
(2) COMPLEMENTARITY MATRIX - for each partner, their unique expertise and role;
(3) ADDED VALUE - what this specific combination achieves that no single partner could;
(4) PREVIOUS COLLABORATION - any prior cooperation experience between partners.
Name each partner organisation explicitly and describe their specific contribution.""",

            "task_allocation": """Create clear work package structure. Show balanced distribution. Link tasks to partner expertise.
For each work package or major task: (1) name it, (2) assign lead partner and supporting partners,
(3) explain WHY this partner leads (based on their expertise), (4) show effort distribution.
Demonstrate that workload is balanced and that each partner has meaningful responsibilities.
Show that task allocation matches the complementarity described in the partnership formation answer.""",

            "coordination": """Describe a comprehensive coordination and communication framework:
(1) GOVERNANCE STRUCTURE - steering committee, project coordinator role, decision-making procedures;
(2) COMMUNICATION PLAN - tools (e.g., Slack, Teams, email), frequency of meetings (monthly online,
bi-annual face-to-face), reporting schedules;
(3) DECISION-MAKING - how decisions are made (consensus, voting, escalation procedures);
(4) CONFLICT RESOLUTION - specific mechanisms for handling disagreements between partners;
(5) DOCUMENT MANAGEMENT - shared platforms for file sharing, version control, collaborative editing.
Include concrete details: 'Monthly steering committee video calls on the first Monday of each month,
with rotating chair responsibility among partners.'""",

            # --- Impact Section (25 points) ---
            "assessment": """Describe a comprehensive quality assurance and evaluation framework:
(1) KPIs - list 5-8 specific Key Performance Indicators with quantified targets and measurement methods;
(2) EVALUATION METHODOLOGY - formative (ongoing) and summative (final) evaluation approaches;
(3) DATA COLLECTION - what data will be collected, how, and by whom;
(4) FEEDBACK LOOPS - how evaluation findings feed back into project improvement;
(5) EXTERNAL EVALUATION - whether an external evaluator will be engaged and their role;
(6) TOOLS - specific tools (surveys, analytics, portfolios, pre/post tests).
Example KPIs: '80% participant satisfaction rate', 'At least 500 downloads of the toolkit within 12 months',
'30% improvement in digital competence scores among participants (pre/post test)'.""",

            "sustainability": """Include business model. Show continuation strategy. Explain mainstreaming approach.
Structure: (1) FINANCIAL SUSTAINABILITY - how activities will be funded after project end
(institutional budgets, revenue models, further funding applications);
(2) INSTITUTIONAL SUSTAINABILITY - how results will be embedded in partner organisations' regular work;
(3) POLITICAL SUSTAINABILITY - engagement with policymakers to ensure results inform policy;
(4) MAINSTREAMING - how results will be integrated into existing systems and curricula;
(5) OPEN ACCESS - how materials will remain freely available (Creative Commons, open platforms).
Be specific: name the platforms, budgets, and institutional commitments that ensure continuation.""",

            "organizational_impact": """For EACH participating organisation, describe:
(1) CAPACITY BUILDING - what new skills, knowledge, or competences staff will develop;
(2) INSTITUTIONAL CHANGE - how the organisation's practices, curricula, or services will change;
(3) NETWORK EXPANSION - new partnerships and connections that will result;
(4) TARGET GROUP BENEFIT - how the organisation's beneficiaries will be better served.
Name each partner organisation and describe specific impacts. Show how outcomes will be integrated
into their regular work beyond the project lifetime.
Evaluators want to see concrete, organisation-specific changes, not generic statements about 'building capacity'.""",

            "wider_impact": """Structure across multiple levels:
(1) LOCAL IMPACT - effects on the local communities where partners operate;
(2) REGIONAL/NATIONAL IMPACT - influence on regional or national education policies and practices;
(3) EUROPEAN IMPACT - contribution to the European Education Area, EU policy priorities;
(4) SECTORAL IMPACT - how the field of adult education will be advanced;
(5) POLICY INFLUENCE - specific plans for policy briefs, stakeholder engagement with policymakers;
(6) SYSTEMIC CHANGE - how the project contributes to broader systemic improvements.
Include a dissemination and exploitation strategy: WHO will be reached, HOW, and with WHAT expected effect.
Reference the EPALE platform and other EU dissemination channels explicitly.""",

            # --- Project Management Section (25 points) ---
            "monitoring": """Include KPIs and targets. Describe tools and methods. Show quality assurance framework.
Structure: (1) MONITORING PLAN - what will be monitored, by whom, how often;
(2) QUALITY ASSURANCE - standards applied (ISO, EFQM, PDCA cycle);
(3) STAFF INVOLVED - project manager, quality officer, WP leaders and their monitoring roles;
(4) TIMING AND FREQUENCY - monthly reports, quarterly reviews, annual evaluations;
(5) TOOLS - Gantt charts, risk registers, KPI dashboards, online project management tools.
Be specific about timing: 'Bi-monthly progress reports from WP leaders, quarterly quality reviews
by the steering committee, mid-term and final external evaluations.'""",

            "budget_time": """Describe comprehensive financial and temporal management:
(1) BUDGET CONTROL - financial reporting procedures, approval workflows, audit trails;
(2) COST CATEGORIES - how the lump sum/unit costs are allocated across work packages and partners;
(3) VALUE FOR MONEY - why the budget is proportionate to the activities and expected results;
(4) TIMELINE MANAGEMENT - Gantt chart description, milestones, critical path identification;
(5) CONTINGENCY - financial reserves, flexibility mechanisms for budget reallocation.
Reference the Erasmus+ funding model (lump sum or unit costs) and show understanding of EU financial regulations.
Include specific milestone dates aligned with the project duration.""",

            "risk_management": """Include risk matrix. Show mitigation strategies. Cover technical, financial, and organizational risks.
Present a structured risk assessment:
(1) RISK IDENTIFICATION - list 6-8 specific risks across categories (technical, financial, organizational,
external, partnership-related);
(2) RISK ASSESSMENT - probability (low/medium/high) and impact (low/medium/high) for each;
(3) MITIGATION STRATEGIES - specific preventive measures for each risk;
(4) CONTINGENCY PLANS - what will be done if the risk materializes despite mitigation;
(5) RISK MONITORING - who monitors risks, how often, escalation procedures.
Include COVID/force majeure risks and digital alternatives for physical activities.""",

            "accessibility": """Describe comprehensive accessibility and inclusion measures:
(1) PHYSICAL ACCESSIBILITY - venue selection criteria, mobility accommodations;
(2) DIGITAL ACCESSIBILITY - WCAG 2.1 compliance for digital outputs, screen reader compatibility;
(3) LINGUISTIC ACCESSIBILITY - translation, multilingual materials, plain language versions;
(4) FINANCIAL ACCESSIBILITY - covering participant costs, removing financial barriers;
(5) SOCIAL INCLUSION - strategies for engaging underrepresented groups, cultural sensitivity;
(6) UNIVERSAL DESIGN - how all outputs are designed to be usable by the widest range of people.
Reference EU accessibility standards and the UN Convention on the Rights of Persons with Disabilities.""",

            "digital_tools": """List specific platforms and tools. Show digital transformation aspect. Include online collaboration methods.
Structure: (1) COLLABORATION TOOLS - name specific platforms (MS Teams, Moodle, Google Workspace) and their use;
(2) DIGITAL OUTPUTS - online courses, mobile apps, interactive toolkits, virtual environments;
(3) HYBRID METHODOLOGY - how digital and physical activities complement each other;
(4) DIGITAL COMPETENCE BUILDING - how the project develops participants' digital skills;
(5) OPEN EDUCATIONAL RESOURCES - digital materials that will be freely available.
Be specific about tools: name them, describe how they'll be used, and explain why they were chosen.""",

            "green_practices": """Include carbon footprint reduction. Show sustainable travel. Demonstrate environmental awareness.
Address EACH project phase:
(1) PLANNING - environmental impact assessment, green procurement policies;
(2) IMPLEMENTATION - virtual meetings to reduce travel, sustainable venues, digital-first approach;
(3) TRAVEL - green travel policies (train over plane where feasible), carbon offsetting;
(4) MATERIALS - digital-first materials, recycled/sustainable materials for physical outputs;
(5) LEGACY - how the project's environmental practices will influence partner organisations long-term.
Include specific commitments: 'At least 50% of transnational meetings conducted online',
'All printed materials on FSC-certified recycled paper'.""",

            "civic_engagement": """Describe how the project promotes active citizenship and democratic participation:
(1) PARTICIPATORY DESIGN - how target groups are involved in project design, implementation, and evaluation
(co-creation workshops, advisory boards, user testing);
(2) DEMOCRATIC VALUES - how the project promotes EU values (democracy, rule of law, human rights, equality);
(3) COMMUNITY ENGAGEMENT - how the project engages local communities beyond direct participants;
(4) EMPOWERMENT - how participants become active agents of change in their communities;
(5) POLICY ENGAGEMENT - how the project facilitates dialogue between citizens and policymakers.
Link to EU citizenship education frameworks and the European Democracy Action Plan where relevant.""",
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
        Extract ALL previous answers for context, with a concise summary for narrative coherence.
        Every question gets visibility into all prior answers to maintain consistency in
        partner names, budget figures, terminology, and thematic threads.
        """
        if not previous_answers:
            return {}

        result = {}

        # Define which fields are HIGH-PRIORITY context for each question (full text, up to 600 chars)
        relationships = {
            "objectives_results": ["objectives", "results", "priority_addressing", "needs_addressed"],
            "innovation": ["objectives_results", "priority_addressing", "needs_addressed"],
            "complementarity": ["partnership_formation", "objectives_results", "innovation"],
            "european_value": ["priority_addressing", "objectives_results", "partnership_formation", "innovation"],
            "needs_addressed": ["priority_addressing", "motivation"],
            "target_groups": ["needs_addressed", "motivation"],
            "needs_identification": ["needs_addressed", "target_groups"],
            "addressing_needs": ["needs_addressed", "needs_identification", "target_groups", "objectives_results"],
            "partnership_formation": ["objectives_results", "innovation", "european_value", "complementarity"],
            "task_allocation": ["partnership_formation", "objectives_results"],
            "coordination": ["partnership_formation", "task_allocation"],
            "assessment": ["objectives_results", "results", "monitoring"],
            "sustainability": ["results", "objectives_results", "organizational_impact", "wider_impact"],
            "organizational_impact": ["results", "objectives_results", "target_groups", "partnership_formation"],
            "wider_impact": ["european_value", "priority_addressing", "organizational_impact", "sustainability"],
            "monitoring": ["objectives_results", "assessment", "task_allocation"],
            "budget_time": ["task_allocation", "monitoring", "risk_management"],
            "risk_management": ["task_allocation", "budget_time", "coordination"],
            "accessibility": ["target_groups", "needs_addressed", "digital_tools"],
            "digital_tools": ["innovation", "objectives_results", "task_allocation"],
            "green_practices": ["objectives_results", "digital_tools"],
            "civic_engagement": ["target_groups", "european_value", "wider_impact"],
            # Summary fields get everything
            "objectives": ["priority_addressing", "objectives_results", "innovation", "needs_addressed"],
            "implementation": ["task_allocation", "objectives_results", "partnership_formation", "digital_tools"],
            "results": ["objectives_results", "organizational_impact", "wider_impact", "sustainability"],
        }

        high_priority_fields = set(relationships.get(current_field, []))

        # Always include objectives and priority_addressing as high-priority
        high_priority_fields.add("objectives_results")
        high_priority_fields.add("priority_addressing")

        # Build the context with all answers
        # High-priority answers get more space (600 chars), others get condensed (200 chars)
        full_context = {}
        summary_lines = []

        for section, answers in previous_answers.items():
            for field, answer_data in answers.items():
                answer_text = answer_data.get('answer', '')
                if not answer_text or answer_text.startswith('[Error'):
                    continue

                if field in high_priority_fields:
                    # High-priority: include more text
                    if section not in full_context:
                        full_context[section] = {}
                    full_context[section][field] = answer_text[:600]
                else:
                    # All other answers: include a brief summary line for coherence
                    summary_lines.append(f"[{field}]: {answer_text[:150]}...")

        # Add the full high-priority context
        result = full_context

        # Add a narrative summary of all other answers
        if summary_lines:
            result["_narrative_summary"] = (
                "Brief summary of all other answers generated so far (for consistency):\n"
                + "\n".join(summary_lines)
            )

        return result
    
    def get_evaluation_criteria_prompt(self, section: str) -> str:
        """
        Get evaluation criteria for scoring optimization
        """
        criteria = {
            "relevance": """
            - Priority alignment: Does the proposal clearly address ALL selected priorities with depth and specificity? (40% of section score)
            - Needs analysis quality: Is there evidence-based analysis of the problem, with data and stakeholder input? (30% of section score)
            - Innovation demonstration: Does the proposal offer genuinely new approaches compared to existing solutions? (20% of section score)
            - European added value: Are transnational benefits clearly explained, showing why single-country action is insufficient? (10% of section score)
            Evaluators award maximum points when: priorities are addressed with concrete activities (not just mentioned),
            innovation is specific and compared to state-of-art, and European dimension is integral to the project design.
            """,
            "needs_analysis": """
            - Evidence base: Are needs supported by data, statistics, and research? (30% of section score)
            - Target group definition: Are target groups clearly defined with demographics and engagement strategies? (25% of section score)
            - Methodology: Is the needs identification process credible and well-documented? (20% of section score)
            - Solution mapping: Does each identified need have a clear corresponding project activity? (25% of section score)
            Evaluators award maximum points when: needs are supported by specific data, target groups are quantified,
            and there is a clear logical chain from evidence through needs to proposed solutions.
            """,
            "partnership": """
            - Partner complementarity: Does each partner bring unique and essential expertise to the consortium? (40% of section score)
            - Task distribution clarity: Are tasks clearly assigned based on partner strengths with balanced workload? (30% of section score)
            - Coordination mechanisms: Are communication, decision-making, and conflict resolution well-defined? (20% of section score)
            - Partner commitment: Do partners demonstrate genuine engagement and capacity to deliver? (10% of section score)
            Evaluators award maximum points when: each partner's unique role is clearly justified, tasks match expertise,
            and coordination includes specific tools, frequencies, and governance structures.
            """,
            "impact": """
            - Sustainability planning: Is there a credible plan for continuing activities and using results after funding ends? (35% of section score)
            - Dissemination strategy: Are dissemination channels, target audiences, and exploitation plans well-defined? (25% of section score)
            - Impact levels: Does the proposal show impact at organizational, local, national, and European levels? (25% of section score)
            - Measurement methods: Are there clear KPIs with targets, evaluation methodology, and feedback mechanisms? (15% of section score)
            Evaluators award maximum points when: sustainability includes financial and institutional commitments,
            impact is described at multiple levels with concrete examples, and KPIs are SMART.
            """,
            "project_management": """
            - Quality assurance: Is there a structured monitoring plan with specific tools, timelines, and responsible staff? (30% of section score)
            - Risk management: Are risks identified with probability/impact assessment and specific mitigation strategies? (25% of section score)
            - Budget and time management: Are financial controls and timeline milestones clearly described? (20% of section score)
            - Inclusive and green practices: Are accessibility, digital tools, environmental sustainability, and civic engagement addressed? (25% of section score)
            Evaluators award maximum points when: monitoring includes named tools and schedules, risks are specific
            (not generic), budget justification shows value-for-money, and cross-cutting themes are integral to project design.
            """,
            "project_summary": """
            - Clarity: Does the summary concisely capture the project's essence within strict character limits?
            - Coherence: Are objectives, activities, and results logically connected?
            - Impact: Does the summary highlight the most compelling aspects of the project?
            This section is read first by evaluators - it sets the tone for the entire application.
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