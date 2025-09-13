from fastapi import APIRouter, HTTPException, Depends, BackgroundTasks
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Dict, List, Optional, Any
import json
import asyncio
from datetime import datetime
import logging

from app.db.database import get_db
from app.db.models import GenerationSession, GenerationStatus, User
from app.services.ai_autofill_service import AIAutoFillService
from app.api.dependencies import get_current_user, get_current_user_from_token_or_query
from app.api.form_generator import ProjectInput

logger = logging.getLogger(__name__)

router = APIRouter()

class StartGenerationRequest(BaseModel):
    project: ProjectInput
    language: str = "en"

class GenerationSessionResponse(BaseModel):
    session_id: str
    status: str
    current_section: Optional[str]
    completed_sections: List[str]
    progress_percentage: int
    answers: Dict[str, Any]
    error_message: Optional[str]

class SectionGenerationRequest(BaseModel):
    session_id: str
    section_name: str
    retry: bool = False

@router.post("/start-generation", response_model=GenerationSessionResponse)
async def start_generation(
    request: StartGenerationRequest,
    background_tasks: BackgroundTasks,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Start a new progressive generation session
    """
    try:
        # Create new generation session
        session = GenerationSession(
            user_id=current_user.id,
            status=GenerationStatus.PENDING,
            project_context=request.project.dict(),
            answers={},
            completed_sections=[],
            failed_sections=[],
            progress_percentage=0
        )
        
        db.add(session)
        db.commit()
        db.refresh(session)
        
        # Start background generation
        background_tasks.add_task(
            generate_all_sections_progressively,
            session_id=session.id,
            db=db
        )
        
        return GenerationSessionResponse(
            session_id=session.id,
            status=session.status.value,
            current_section=None,
            completed_sections=[],
            progress_percentage=0,
            answers={},
            error_message=None
        )
        
    except Exception as e:
        logger.error(f"Error starting generation: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/generation-status/{session_id}", response_model=GenerationSessionResponse)
async def get_generation_status(
    session_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get the current status of a generation session
    """
    session = db.query(GenerationSession).filter(
        GenerationSession.id == session_id,
        GenerationSession.user_id == current_user.id
    ).first()
    
    if not session:
        raise HTTPException(status_code=404, detail="Generation session not found")
    
    return GenerationSessionResponse(
        session_id=session.id,
        status=session.status.value,
        current_section=session.current_section,
        completed_sections=session.completed_sections or [],
        progress_percentage=session.progress_percentage,
        answers=session.answers or {},
        error_message=session.error_message
    )

@router.post("/generate-section")
async def generate_single_section(
    request: SectionGenerationRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Generate answers for a single section
    """
    session = db.query(GenerationSession).filter(
        GenerationSession.id == request.session_id,
        GenerationSession.user_id == current_user.id
    ).first()
    
    if not session:
        raise HTTPException(status_code=404, detail="Generation session not found")
    
    if request.section_name in session.completed_sections and not request.retry:
        return {
            "status": "already_completed",
            "section": request.section_name,
            "answers": session.answers.get(request.section_name, {})
        }
    
    try:
        # Update session status
        session.status = GenerationStatus.IN_PROGRESS
        session.current_section = request.section_name
        db.commit()
        
        # Initialize AI service
        ai_service = AIAutoFillService()
        
        # Load form questions
        import os
        form_questions_path = os.path.join(
            os.path.dirname(__file__), '..', '..', 'data', 'form_questions.json'
        )
        with open(form_questions_path, 'r') as f:
            form_questions = json.load(f)
        
        # Generate section answers
        section_data = form_questions['sections'].get(request.section_name)
        if not section_data:
            raise HTTPException(status_code=400, detail=f"Invalid section: {request.section_name}")
        
        # Build context with previous answers
        context = {
            "project": session.project_context,
            "language": "en",
            "previous_answers": session.answers or {}
        }
        
        # Generate answers for this section
        section_context = await ai_service._build_section_context(request.section_name)
        section_answers = await ai_service._process_section(
            request.section_name,
            section_data,
            section_context
        )
        
        # Update session with new answers
        if not session.answers:
            session.answers = {}
        session.answers[request.section_name] = section_answers
        
        # Update completed sections
        if request.section_name not in session.completed_sections:
            session.completed_sections.append(request.section_name)
        
        # Remove from failed sections if it was there
        if request.section_name in session.failed_sections:
            session.failed_sections.remove(request.section_name)
        
        # Update progress
        session.completed_count = len(session.completed_sections)
        session.progress_percentage = int((session.completed_count / session.total_sections) * 100)
        
        # Check if all sections are complete
        if session.completed_count == session.total_sections:
            session.status = GenerationStatus.COMPLETED
            session.completed_at = datetime.utcnow()
        
        db.commit()
        
        return {
            "status": "success",
            "section": request.section_name,
            "answers": section_answers,
            "progress_percentage": session.progress_percentage
        }
        
    except Exception as e:
        logger.error(f"Error generating section {request.section_name}: {str(e)}")
        
        # Update session with error
        session.failed_sections.append(request.section_name)
        session.error_message = str(e)
        session.retry_count += 1
        
        if session.retry_count >= session.max_retries:
            session.status = GenerationStatus.FAILED
        
        db.commit()
        
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/stream-progress/{session_id}")
async def stream_generation_progress(
    session_id: str,
    current_user: User = Depends(get_current_user_from_token_or_query),
    db: Session = Depends(get_db)
):
    """
    Stream generation progress using Server-Sent Events (SSE)
    """
    async def generate():
        heartbeat_counter = 0
        while True:
            try:
                session = db.query(GenerationSession).filter(
                    GenerationSession.id == session_id,
                    GenerationSession.user_id == current_user.id
                ).first()

                if not session:
                    yield f"data: {json.dumps({'error': 'Session not found'})}\n\n"
                    break

                data = {
                    "status": session.status.value,
                    "current_section": session.current_section,
                    "completed_sections": session.completed_sections,
                    "progress_percentage": session.progress_percentage,
                    "error_message": session.error_message
                }

                yield f"data: {json.dumps(data)}\n\n"

                # Send heartbeat every 10 iterations (10 seconds) to keep connection alive
                heartbeat_counter += 1
                if heartbeat_counter % 10 == 0:
                    yield f": heartbeat\n\n"

                if session.status in [GenerationStatus.COMPLETED, GenerationStatus.FAILED]:
                    break

                await asyncio.sleep(1)  # Poll every second
                db.refresh(session)  # Refresh session data
            except Exception as e:
                logger.error(f"SSE generation error: {str(e)}")
                yield f"data: {json.dumps({'error': str(e)})}\n\n"
                break
    
    return StreamingResponse(
        generate(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no"  # Disable Nginx buffering
        }
    )

@router.post("/cancel-generation/{session_id}")
async def cancel_generation(
    session_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Cancel an ongoing generation session
    """
    session = db.query(GenerationSession).filter(
        GenerationSession.id == session_id,
        GenerationSession.user_id == current_user.id
    ).first()
    
    if not session:
        raise HTTPException(status_code=404, detail="Generation session not found")
    
    if session.status in [GenerationStatus.COMPLETED, GenerationStatus.FAILED]:
        return {"message": "Generation already finished"}
    
    session.status = GenerationStatus.CANCELLED
    session.error_message = "Cancelled by user"
    db.commit()
    
    return {"message": "Generation cancelled successfully"}

async def generate_all_sections_progressively(session_id: str, db: Session):
    """
    Background task to generate all sections progressively
    """
    try:
        session = db.query(GenerationSession).filter(
            GenerationSession.id == session_id
        ).first()
        
        if not session:
            return
        
        # Initialize AI service
        ai_service = AIAutoFillService()
        
        # Set up context memory
        ai_service.context_memory = {
            "project": session.project_context,
            "language": "en",
            "answers": {}
        }
        
        # Load form questions
        import os
        form_questions_path = os.path.join(
            os.path.dirname(__file__), '..', '..', 'data', 'form_questions.json'
        )
        with open(form_questions_path, 'r') as f:
            form_questions = json.load(f)
        
        # Process each section
        for section_key in session.sections_order:
            # Check if cancelled
            db.refresh(session)
            if session.status == GenerationStatus.CANCELLED:
                break
            
            # Skip already completed sections
            if section_key in session.completed_sections:
                continue
            
            try:
                # Update current section
                session.status = GenerationStatus.IN_PROGRESS
                session.current_section = section_key
                db.commit()
                
                # Get section data
                section_data = form_questions['sections'].get(section_key)
                if not section_data:
                    continue
                
                # Generate section answers
                section_context = await ai_service._build_section_context(section_key)
                section_answers = await ai_service._process_section(
                    section_key,
                    section_data,
                    section_context
                )
                
                # Update session
                if not session.answers:
                    session.answers = {}
                session.answers[section_key] = section_answers
                
                if section_key not in session.completed_sections:
                    session.completed_sections.append(section_key)
                
                session.completed_count = len(session.completed_sections)
                session.progress_percentage = int((session.completed_count / session.total_sections) * 100)
                
                # Update context memory for next section
                ai_service.context_memory["answers"][section_key] = section_answers
                
                db.commit()
                
                # Small delay between sections
                await asyncio.sleep(0.5)
                
            except Exception as e:
                logger.error(f"Error generating section {section_key}: {str(e)}")
                session.failed_sections.append(section_key)
                session.error_message = str(e)
                db.commit()
                continue
        
        # Final status update
        db.refresh(session)
        if session.status != GenerationStatus.CANCELLED:
            if len(session.completed_sections) == session.total_sections:
                session.status = GenerationStatus.COMPLETED
                session.completed_at = datetime.utcnow()
            elif session.failed_sections:
                session.status = GenerationStatus.FAILED
        
        db.commit()
        
    except Exception as e:
        logger.error(f"Background generation error: {str(e)}")
        session.status = GenerationStatus.FAILED
        session.error_message = str(e)
        db.commit()