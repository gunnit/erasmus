from fastapi import APIRouter, HTTPException, BackgroundTasks
from pydantic import BaseModel, Field
from typing import Dict, List, Optional
import json
from datetime import datetime

from app.services.openai_service import OpenAIService
from app.services.ai_autofill_service import AIAutoFillService
from app.core.config import settings

router = APIRouter()

class OrganizationDetails(BaseModel):
    name: str
    type: str = Field(..., description="e.g., NGO, University, SME, Public body")
    country: str
    city: str
    experience: str = Field(..., description="Brief description of relevant experience")
    staff_count: Optional[int] = None

class PartnerOrganization(BaseModel):
    name: str
    type: str
    country: str
    role: str = Field(..., description="Role in the project")

class ProjectInput(BaseModel):
    title: str = Field(..., max_length=200)
    field: str = "Adult Education"
    project_idea: str = Field(..., min_length=200, description="Detailed project description")
    duration_months: int = Field(24, ge=12, le=36)
    budget_eur: int = Field(250000, ge=60000, le=400000)
    lead_organization: OrganizationDetails
    partner_organizations: List[PartnerOrganization] = Field(..., min_items=2, max_items=10)
    selected_priorities: List[str] = Field(..., min_items=1, max_items=3)
    target_groups: str = Field(..., description="Description of target groups")
    
class GenerateFormRequest(BaseModel):
    project: ProjectInput
    generate_pdf: bool = False
    language: str = "en"

class FormAnswer(BaseModel):
    question_id: str
    field: str
    answer: str
    character_count: int
    character_limit: int

class GenerateFormResponse(BaseModel):
    application_id: str
    generated_at: datetime
    sections: Dict[str, List[FormAnswer]]
    estimated_score: Optional[int] = None
    pdf_url: Optional[str] = None
    total_generation_time: float

# Load form questions on startup
import os
form_questions_path = os.path.join(os.path.dirname(__file__), '..', '..', 'data', 'form_questions.json')
with open(form_questions_path, 'r') as f:
    FORM_QUESTIONS = json.load(f)

@router.post("/generate-answers", response_model=GenerateFormResponse)
async def generate_form_answers(
    request: GenerateFormRequest,
    background_tasks: BackgroundTasks
):
    """
    Generate complete Erasmus+ KA220-ADU form answers based on project idea
    Using comprehensive AI auto-fill service to ensure ALL questions are answered
    """
    start_time = datetime.now()
    
    # Initialize AI Auto-fill service for comprehensive generation
    ai_service = AIAutoFillService()
    
    # Prepare project context with all necessary information
    project_context = {
        "title": request.project.title,
        "field": request.project.field,
        "project_idea": request.project.project_idea,
        "duration": f"{request.project.duration_months} months",
        "budget": request.project.budget_eur,
        "lead_org": request.project.lead_organization.dict(),
        "partners": [p.dict() for p in request.project.partner_organizations],
        "selected_priorities": request.project.selected_priorities,
        "target_groups": request.project.target_groups
    }
    
    try:
        # Generate comprehensive answers for ALL questions
        answers = await ai_service.auto_fill_complete_application(
            project_context=project_context,
            form_questions=FORM_QUESTIONS,
            language=request.language
        )
        
        # Format response with comprehensive answer data
        formatted_sections = {}
        total_questions_answered = 0
        for section_key, section_answers in answers.items():
            formatted_answers = []
            for field, answer_data in section_answers.items():
                formatted_answers.append(
                    FormAnswer(
                        question_id=answer_data['question_id'],
                        field=field,
                        answer=answer_data['answer'],
                        character_count=answer_data['character_count'],
                        character_limit=answer_data['character_limit']
                    )
                )
                total_questions_answered += 1
            formatted_sections[section_key] = formatted_answers
        
        # Log completion status
        import logging
        logger = logging.getLogger(__name__)
        logger.info(f"Auto-filled {total_questions_answered} questions across {len(formatted_sections)} sections")
        
        # Calculate estimated score (simplified)
        estimated_score = calculate_estimated_score(answers)
        
        # Generate application ID
        application_id = f"APP-{datetime.now().strftime('%Y%m%d%H%M%S')}"
        
        # Calculate generation time
        generation_time = (datetime.now() - start_time).total_seconds()
        
        response = GenerateFormResponse(
            application_id=application_id,
            generated_at=datetime.now(),
            sections=formatted_sections,
            estimated_score=estimated_score,
            total_generation_time=generation_time
        )
        
        # Generate PDF if requested (in background)
        if request.generate_pdf:
            background_tasks.add_task(
                generate_pdf,
                application_id,
                formatted_sections,
                project_context
            )
            response.pdf_url = f"/api/form/pdf/{application_id}"
        
        return response
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error generating form answers: {str(e)}"
        )

@router.get("/questions")
async def get_form_questions():
    """
    Get all form questions with their requirements
    """
    return FORM_QUESTIONS

@router.get("/priorities")
async def get_available_priorities():
    """
    Get list of available Erasmus+ priorities
    """
    return {
        "horizontal_priorities": [
            {
                "code": "HP-01",
                "name": "Inclusion and Diversity",
                "description": "Social inclusion and outreach to people with fewer opportunities"
            },
            {
                "code": "HP-02",
                "name": "Digital Transformation",
                "description": "Digital readiness, resilience and capacity"
            },
            {
                "code": "HP-03",
                "name": "Environment and Climate",
                "description": "Environment and fight against climate change"
            },
            {
                "code": "HP-04",
                "name": "Democratic Participation",
                "description": "Participation in democratic life, common values and civic engagement"
            }
        ],
        "adult_education_priorities": [
            {
                "code": "AE-01",
                "name": "Key Competences",
                "description": "Improving availability of high-quality learning opportunities for adults"
            },
            {
                "code": "AE-02",
                "name": "Creating Learning Pathways",
                "description": "Creating upskilling pathways and transitions"
            },
            {
                "code": "AE-03",
                "name": "Professional Development",
                "description": "Improving competences of educators and staff"
            }
        ]
    }

@router.post("/validate")
async def validate_answers(answers: Dict[str, str]):
    """
    Validate answers against form requirements
    """
    validation_results = []
    
    for section_key, section_data in FORM_QUESTIONS['sections'].items():
        for question in section_data['questions']:
            field = question['field']
            if field in answers:
                answer = answers[field]
                
                # Check character limit
                is_valid = len(answer) <= question.get('character_limit', float('inf'))
                
                validation_results.append({
                    'field': field,
                    'is_valid': is_valid,
                    'character_count': len(answer),
                    'character_limit': question.get('character_limit'),
                    'message': 'OK' if is_valid else f"Exceeds character limit by {len(answer) - question['character_limit']} characters"
                })
    
    return {
        'is_valid': all(r['is_valid'] for r in validation_results),
        'results': validation_results
    }

def calculate_estimated_score(answers: Dict) -> int:
    """
    Calculate estimated score based on answer completeness and quality indicators
    """
    # Simplified scoring logic
    base_score = 60  # Minimum viable score
    
    # Add points for completeness
    total_questions = sum(
        len(section['questions']) 
        for section in FORM_QUESTIONS['sections'].values()
    )
    answered_questions = sum(
        len(section_answers) 
        for section_answers in answers.values()
    )
    
    completeness_bonus = int((answered_questions / total_questions) * 20)
    
    # Add points for answer quality (simplified - check average length)
    quality_bonus = 10  # Placeholder for quality assessment
    
    return min(base_score + completeness_bonus + quality_bonus, 100)

async def generate_pdf(
    application_id: str,
    sections: Dict,
    project_context: Dict
):
    """
    Generate PDF version of the completed form
    """
    # PDF generation logic would go here
    # Using reportlab or similar library
    pass