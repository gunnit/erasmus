from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Dict, Any, Optional, List
import json
import os
import logging

from app.db.database import get_db
from app.db.models import User
from app.services.ai_autofill_service import AIAutoFillService
from app.api.dependencies import get_current_user

logger = logging.getLogger(__name__)

router = APIRouter()

class GenerateSectionRequest(BaseModel):
    section_name: str
    project_data: Dict[str, Any]
    previous_answers: Optional[Dict[str, Any]] = {}
    language: str = "en"

class GenerateSectionResponse(BaseModel):
    section_name: str
    answers: Dict[str, Any]
    success: bool
    error: Optional[str] = None

@router.post("/generate-section", response_model=GenerateSectionResponse)
async def generate_section(
    request: GenerateSectionRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Generate answers for a single section of the form.
    This is a stateless endpoint - no session management needed.
    """
    try:
        logger.info(f"Generating section: {request.section_name} for user: {current_user.id}")

        # Initialize AI service
        try:
            ai_service = AIAutoFillService()
            logger.info("AI service initialized successfully")
        except Exception as e:
            logger.error(f"Failed to initialize AI service: {str(e)}")
            raise HTTPException(
                status_code=500,
                detail="AI service initialization failed. Please check configuration."
            )

        # Load form questions
        form_questions_path = os.path.join(
            os.path.dirname(__file__), '..', '..', 'data', 'form_questions.json'
        )
        with open(form_questions_path, 'r') as f:
            form_questions = json.load(f)

        # Get section data
        section_data = form_questions['sections'].get(request.section_name)
        if not section_data:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid section: {request.section_name}"
            )

        # Set up context with previous answers for continuity
        ai_service.context_memory = {
            "project": request.project_data,
            "language": request.language,
            "answers": request.previous_answers or {}
        }

        # Build section context
        section_context = await ai_service._build_section_context(request.section_name)
        logger.info(f"Section context built for {request.section_name}")

        # Generate answers for this section
        section_answers = await ai_service._process_section(
            request.section_name,
            section_data,
            section_context
        )

        if not section_answers:
            raise Exception(f"No answers generated for section {request.section_name}")

        logger.info(f"Successfully generated {len(section_answers)} answers for section {request.section_name}")

        return GenerateSectionResponse(
            section_name=request.section_name,
            answers=section_answers,
            success=True,
            error=None
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error generating section {request.section_name}: {str(e)}", exc_info=True)
        return GenerateSectionResponse(
            section_name=request.section_name,
            answers={},
            success=False,
            error=str(e)
        )

@router.get("/sections")
async def get_sections(
    current_user: User = Depends(get_current_user)
):
    """
    Get the list of sections and their metadata
    """
    return {
        "sections": [
            {"key": "project_summary", "name": "Project Summary", "questions": 3, "order": 1},
            {"key": "relevance", "name": "Relevance", "questions": 6, "order": 2},
            {"key": "needs_analysis", "name": "Needs Analysis", "questions": 4, "order": 3},
            {"key": "partnership", "name": "Partnership", "questions": 3, "order": 4},
            {"key": "impact", "name": "Impact", "questions": 4, "order": 5},
            {"key": "project_management", "name": "Project Management", "questions": 7, "order": 6}
        ],
        "total_questions": 27
    }