from typing import Dict, List, Optional, Any
import json
import logging
from datetime import datetime
import asyncio
from openai import AsyncOpenAI
from app.core.config import settings

logger = logging.getLogger(__name__)

class WorkplanService:
    """
    AI-powered service for generating comprehensive Erasmus+ workplans
    with work packages, activities, deliverables, and partner allocations
    """

    def __init__(self):
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

    async def generate_workplan(
        self,
        project_context: Dict,
        answers: Dict,
        form_questions: Optional[Dict] = None
    ) -> Dict[str, Any]:
        """
        Generate complete workplan based on project context and answers
        """
        logger.info(f"Generating workplan for project: {project_context.get('title')}")

        # Extract key information from answers
        project_info = self._extract_project_info(project_context, answers)

        # Generate work packages
        work_packages = await self._generate_work_packages(project_info)

        # Generate timeline and milestones
        timeline = await self._generate_timeline(work_packages, project_info)

        # Calculate partner allocations
        partner_allocation = await self._calculate_partner_allocation(
            work_packages,
            project_info['partners']
        )

        workplan = {
            "work_packages": work_packages,
            "timeline": timeline,
            "partner_allocation": partner_allocation,
            "metadata": {
                "generated_at": datetime.utcnow().isoformat(),
                "total_duration_months": project_info['duration_months'],
                "total_work_packages": len(work_packages),
                "total_deliverables": sum(len(wp.get('deliverables', [])) for wp in work_packages)
            }
        }

        return workplan

    def _extract_project_info(self, project_context: Dict, answers: Dict) -> Dict:
        """
        Extract relevant information from project context and answers
        """
        # Extract activities from implementation answer
        implementation = answers.get('project_summary', {}).get('implementation', '')

        # Extract partner roles from partnership answer
        task_allocation = answers.get('partnership', {}).get('task_allocation', '')

        # Get partners info
        partners = project_context.get('partner_organizations', [])
        lead_org = project_context.get('lead_organization', {})

        return {
            'title': project_context.get('title', ''),
            'project_idea': project_context.get('project_idea', ''),
            'duration_months': project_context.get('duration_months', 24),
            'budget': project_context.get('budget_eur', 250000),
            'lead_organization': lead_org,
            'partners': partners,
            'implementation_text': implementation,
            'task_allocation_text': task_allocation,
            'objectives': answers.get('project_summary', {}).get('objectives', ''),
            'results': answers.get('project_summary', {}).get('results', ''),
            'selected_priorities': project_context.get('selected_priorities', [])
        }

    async def _generate_work_packages(self, project_info: Dict) -> List[Dict]:
        """
        Generate work packages based on project information
        Maximum 5 work packages as per Erasmus+ guidelines
        """
        prompt = f"""
        Create a detailed workplan with work packages for this Erasmus+ project.

        PROJECT DETAILS:
        Title: {project_info['title']}
        Duration: {project_info['duration_months']} months
        Partners: {len(project_info['partners']) + 1} organizations
        Lead: {project_info['lead_organization'].get('name', 'Lead Organization')}

        PROJECT IDEA: {project_info['project_idea']}

        OBJECTIVES: {project_info['objectives']}

        IMPLEMENTATION ACTIVITIES: {project_info['implementation_text']}

        PARTNER ROLES: {project_info['task_allocation_text']}

        Generate EXACTLY 5 work packages following Erasmus+ best practices:
        1. WP1 must be "Project Management"
        2. WP2-WP5 should be thematic based on the project activities

        For each work package provide:
        - Clear title and objectives
        - Specific activities with timing
        - Concrete deliverables
        - Lead partner assignment
        - Duration in months

        Return as JSON with this structure:
        {{
          "work_packages": [
            {{
              "id": "WP1",
              "title": "Project Management",
              "lead_partner": "organization name",
              "objectives": ["obj1", "obj2"],
              "start_month": 1,
              "end_month": 24,
              "activities": [
                {{
                  "id": "A1.1",
                  "name": "activity name",
                  "description": "brief description",
                  "responsible": "partner name",
                  "start_month": 1,
                  "end_month": 2
                }}
              ],
              "deliverables": [
                {{
                  "id": "D1.1",
                  "title": "deliverable title",
                  "description": "brief description",
                  "due_month": 2,
                  "responsible": "partner name"
                }}
              ],
              "effort_pm": 10
            }}
          ]
        }}
        """

        try:
            response = await self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "developer", "content": "You are an expert Erasmus+ project manager creating professional workplans."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.3,
                response_format={"type": "json_object"}
            )

            result = json.loads(response.choices[0].message.content)
            return result.get('work_packages', [])

        except Exception as e:
            logger.error(f"Failed to generate work packages: {str(e)}")
            return self._get_default_work_packages(project_info)

    def _get_default_work_packages(self, project_info: Dict) -> List[Dict]:
        """
        Return default work package structure if AI generation fails
        """
        lead_org_name = project_info['lead_organization'].get('name', 'Lead Organization')
        duration = project_info['duration_months']

        return [
            {
                "id": "WP1",
                "title": "Project Management",
                "lead_partner": lead_org_name,
                "objectives": [
                    "Ensure effective project coordination and management",
                    "Monitor progress and quality of deliverables",
                    "Manage financial and administrative aspects"
                ],
                "start_month": 1,
                "end_month": duration,
                "activities": [
                    {
                        "id": "A1.1",
                        "name": "Kick-off meeting",
                        "description": "Initial project meeting with all partners",
                        "responsible": lead_org_name,
                        "start_month": 1,
                        "end_month": 1
                    },
                    {
                        "id": "A1.2",
                        "name": "Project coordination",
                        "description": "Ongoing coordination and monitoring",
                        "responsible": lead_org_name,
                        "start_month": 1,
                        "end_month": duration
                    }
                ],
                "deliverables": [
                    {
                        "id": "D1.1",
                        "title": "Project Management Plan",
                        "description": "Comprehensive plan for project implementation",
                        "due_month": 2,
                        "responsible": lead_org_name
                    },
                    {
                        "id": "D1.2",
                        "title": "Final Report",
                        "description": "Complete project report and evaluation",
                        "due_month": duration,
                        "responsible": lead_org_name
                    }
                ],
                "effort_pm": 8
            },
            {
                "id": "WP2",
                "title": "Research and Analysis",
                "lead_partner": lead_org_name,
                "objectives": [
                    "Conduct needs analysis",
                    "Research best practices",
                    "Develop methodology"
                ],
                "start_month": 1,
                "end_month": 6,
                "activities": [
                    {
                        "id": "A2.1",
                        "name": "Needs assessment",
                        "description": "Comprehensive needs analysis with target groups",
                        "responsible": lead_org_name,
                        "start_month": 1,
                        "end_month": 3
                    }
                ],
                "deliverables": [
                    {
                        "id": "D2.1",
                        "title": "Research Report",
                        "description": "Analysis of needs and best practices",
                        "due_month": 6,
                        "responsible": lead_org_name
                    }
                ],
                "effort_pm": 12
            },
            {
                "id": "WP3",
                "title": "Development and Implementation",
                "lead_partner": lead_org_name,
                "objectives": [
                    "Develop project outputs",
                    "Implement pilot activities",
                    "Test and refine solutions"
                ],
                "start_month": 4,
                "end_month": 18,
                "activities": [
                    {
                        "id": "A3.1",
                        "name": "Development of materials",
                        "description": "Create project materials and resources",
                        "responsible": lead_org_name,
                        "start_month": 4,
                        "end_month": 10
                    }
                ],
                "deliverables": [
                    {
                        "id": "D3.1",
                        "title": "Project Materials",
                        "description": "Complete set of developed materials",
                        "due_month": 12,
                        "responsible": lead_org_name
                    }
                ],
                "effort_pm": 20
            },
            {
                "id": "WP4",
                "title": "Quality Assurance and Evaluation",
                "lead_partner": lead_org_name,
                "objectives": [
                    "Ensure quality of outputs",
                    "Monitor project impact",
                    "Evaluate effectiveness"
                ],
                "start_month": 1,
                "end_month": duration,
                "activities": [
                    {
                        "id": "A4.1",
                        "name": "Quality monitoring",
                        "description": "Continuous quality assurance activities",
                        "responsible": lead_org_name,
                        "start_month": 1,
                        "end_month": duration
                    }
                ],
                "deliverables": [
                    {
                        "id": "D4.1",
                        "title": "Evaluation Report",
                        "description": "Comprehensive project evaluation",
                        "due_month": duration,
                        "responsible": lead_org_name
                    }
                ],
                "effort_pm": 6
            },
            {
                "id": "WP5",
                "title": "Dissemination and Sustainability",
                "lead_partner": lead_org_name,
                "objectives": [
                    "Share project results",
                    "Ensure sustainability",
                    "Maximize impact"
                ],
                "start_month": 6,
                "end_month": duration,
                "activities": [
                    {
                        "id": "A5.1",
                        "name": "Dissemination activities",
                        "description": "Share results through various channels",
                        "responsible": lead_org_name,
                        "start_month": 6,
                        "end_month": duration
                    }
                ],
                "deliverables": [
                    {
                        "id": "D5.1",
                        "title": "Dissemination Plan",
                        "description": "Strategy for sharing project results",
                        "due_month": 8,
                        "responsible": lead_org_name
                    }
                ],
                "effort_pm": 8
            }
        ]

    async def _generate_timeline(self, work_packages: List[Dict], project_info: Dict) -> Dict:
        """
        Generate timeline with milestones based on work packages
        """
        milestones = []
        gantt_data = []

        # Generate milestones from key deliverables
        for wp in work_packages:
            # Add work package to Gantt data
            gantt_data.append({
                "id": wp['id'],
                "name": wp['title'],
                "start": wp['start_month'],
                "end": wp['end_month'],
                "type": "work_package",
                "progress": 0
            })

            # Add activities to Gantt data
            for activity in wp.get('activities', []):
                gantt_data.append({
                    "id": activity['id'],
                    "parent": wp['id'],
                    "name": activity['name'],
                    "start": activity['start_month'],
                    "end": activity['end_month'],
                    "type": "activity",
                    "progress": 0
                })

            # Create milestones from key deliverables
            for deliverable in wp.get('deliverables', []):
                if 'Report' in deliverable['title'] or 'Plan' in deliverable['title']:
                    milestones.append({
                        "id": f"M-{deliverable['id']}",
                        "title": deliverable['title'],
                        "month": deliverable['due_month'],
                        "work_package": wp['id']
                    })

        # Add key project milestones
        milestones.extend([
            {"id": "M-START", "title": "Project Start", "month": 1, "work_package": "WP1"},
            {"id": "M-MID", "title": "Mid-term Review", "month": project_info['duration_months'] // 2, "work_package": "WP1"},
            {"id": "M-END", "title": "Project Completion", "month": project_info['duration_months'], "work_package": "WP1"}
        ])

        # Sort milestones by month
        milestones.sort(key=lambda x: x['month'])

        return {
            "gantt_data": gantt_data,
            "milestones": milestones,
            "critical_path": self._calculate_critical_path(work_packages)
        }

    def _calculate_critical_path(self, work_packages: List[Dict]) -> List[str]:
        """
        Identify critical activities that determine project timeline
        """
        critical_activities = []

        for wp in work_packages:
            # Activities that span the entire WP duration are likely critical
            wp_duration = wp['end_month'] - wp['start_month'] + 1

            for activity in wp.get('activities', []):
                activity_duration = activity['end_month'] - activity['start_month'] + 1
                if activity_duration >= wp_duration * 0.8:  # 80% or more of WP duration
                    critical_activities.append(activity['id'])

        return critical_activities

    async def _calculate_partner_allocation(
        self,
        work_packages: List[Dict],
        partners: List[Dict]
    ) -> Dict[str, Dict[str, float]]:
        """
        Calculate partner effort allocation across work packages
        """
        allocation = {}

        # Initialize allocation matrix
        all_partners = [p['name'] for p in partners if p.get('name')]

        for partner_name in all_partners:
            allocation[partner_name] = {}

            for wp in work_packages:
                # Calculate effort based on responsibilities
                effort = 0

                # Check if partner is lead
                if wp.get('lead_partner') == partner_name:
                    effort += wp.get('effort_pm', 10) * 0.4  # Lead gets 40% of effort

                # Check activities
                for activity in wp.get('activities', []):
                    if activity.get('responsible') == partner_name:
                        effort += 2  # 2 person-months per activity lead

                # Check deliverables
                for deliverable in wp.get('deliverables', []):
                    if deliverable.get('responsible') == partner_name:
                        effort += 1  # 1 person-month per deliverable

                # Minimum participation
                if effort == 0:
                    effort = wp.get('effort_pm', 10) * 0.1  # 10% minimum participation

                allocation[partner_name][wp['id']] = round(effort, 1)

        return allocation

    async def update_workplan(
        self,
        workplan: Dict,
        updates: Dict
    ) -> Dict:
        """
        Update existing workplan with user modifications
        """
        # Merge updates into workplan
        for key, value in updates.items():
            if key in workplan:
                if isinstance(value, dict) and isinstance(workplan[key], dict):
                    workplan[key].update(value)
                else:
                    workplan[key] = value

        # Recalculate metadata
        workplan['metadata']['updated_at'] = datetime.utcnow().isoformat()
        workplan['metadata']['total_deliverables'] = sum(
            len(wp.get('deliverables', []))
            for wp in workplan.get('work_packages', [])
        )

        return workplan