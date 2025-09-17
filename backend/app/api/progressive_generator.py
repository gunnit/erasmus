from fastapi import APIRouter, HTTPException, Depends, BackgroundTasks
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from sqlalchemy.orm.attributes import flag_modified
from pydantic import BaseModel
from typing import Dict, List, Optional, Any
import json
import asyncio
from datetime import datetime
import logging

from app.db.database import get_db, SessionLocal
from app.db.models import GenerationSession, GenerationStatus, User
from app.services.ai_autofill_service import AIAutoFillService
from app.api.dependencies import get_current_user, get_current_user_from_token_or_query
from app.api.form_generator import ProjectInput
from app.core.subscription_deps import require_valid_subscription, use_proposal_credit

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
    current_user: User = Depends(require_valid_subscription),
    db: Session = Depends(get_db)
):
    """
    Start a new progressive generation session
    """
    try:
        # Define sections order
        sections_order = [
            "project_summary",
            "relevance",
            "needs_analysis",
            "partnership",
            "impact",
            "project_management"
        ]

        # Create new generation session
        session = GenerationSession(
            user_id=current_user.id,
            status=GenerationStatus.PENDING,
            project_context=request.project.dict(),
            answers={},
            completed_sections=[],
            failed_sections=[],
            progress_percentage=0,
            sections_order=sections_order,
            total_sections=len(sections_order)
        )
        
        db.add(session)
        db.commit()
        db.refresh(session)
        
        # Start background generation
        background_tasks.add_task(
            generate_all_sections_progressively,
            session_id=session.id
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
    
    # Ensure completed_sections is not None
    if session.completed_sections is None:
        session.completed_sections = []

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
        # Ensure lists are not None
        if session.completed_sections is None:
            session.completed_sections = []
        if session.failed_sections is None:
            session.failed_sections = []

        if request.section_name not in session.completed_sections:
            session.completed_sections.append(request.section_name)
            flag_modified(session, 'completed_sections')

        # Remove from failed sections if it was there
        if request.section_name in session.failed_sections:
            session.failed_sections.remove(request.section_name)
            flag_modified(session, 'failed_sections')
        
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
        # Ensure failed_sections is not None
        if session.failed_sections is None:
            session.failed_sections = []
        session.failed_sections.append(request.section_name)
        flag_modified(session, 'failed_sections')
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
        max_iterations = 900  # Max 15 minutes (increased for longer generations)
        iteration = 0

        logger.info(f"Starting SSE stream for session {session_id}")

        # Send initial connection message
        yield f"data: {json.dumps({'message': 'Connected', 'session_id': session_id})}\n\n"

        while iteration < max_iterations:
            try:
                session = db.query(GenerationSession).filter(
                    GenerationSession.id == session_id,
                    GenerationSession.user_id == current_user.id
                ).first()

                if not session:
                    logger.error(f"Session {session_id} not found during SSE streaming")
                    yield f"data: {json.dumps({'error': 'Session not found'})}\n\n"
                    break

                data = {
                    "status": session.status.value,
                    "current_section": session.current_section,
                    "completed_sections": session.completed_sections if session.completed_sections else [],
                    "progress_percentage": session.progress_percentage or 0,
                    "error_message": session.error_message,
                    "iteration": iteration
                }

                yield f"data: {json.dumps(data)}\n\n"

                # Send heartbeat every 10 iterations (10 seconds) to keep connection alive
                heartbeat_counter += 1
                if heartbeat_counter % 10 == 0:
                    logger.debug(f"SSE heartbeat {heartbeat_counter} for session {session_id}")
                    yield f": heartbeat {heartbeat_counter}\n\n"

                if session.status in [GenerationStatus.COMPLETED, GenerationStatus.FAILED, GenerationStatus.CANCELLED]:
                    logger.info(f"Generation finished for session {session_id} with status: {session.status.value}")
                    # Send final status
                    final_data = {
                        "status": session.status.value,
                        "current_section": session.current_section,
                        "completed_sections": session.completed_sections if session.completed_sections else [],
                        "progress_percentage": 100 if session.status == GenerationStatus.COMPLETED else session.progress_percentage,
                        "error_message": session.error_message,
                        "message": "Generation finished",
                        "final": True
                    }
                    yield f"data: {json.dumps(final_data)}\n\n"
                    # Give frontend time to receive the final message
                    await asyncio.sleep(1)
                    logger.info(f"SSE stream completed for session {session_id}")
                    break

                await asyncio.sleep(1)  # Poll every second
                db.refresh(session)  # Refresh session data
                iteration += 1

                # Log progress every 30 seconds
                if iteration % 30 == 0:
                    logger.info(f"SSE progress for session {session_id}: {session.progress_percentage}%, status: {session.status.value}, iteration: {iteration}")

            except Exception as e:
                logger.error(f"SSE generation error for session {session_id}: {str(e)}", exc_info=True)
                yield f"data: {json.dumps({'error': str(e)})}\n\n"
                break

        if iteration >= max_iterations:
            logger.warning(f"SSE timeout reached for session {session_id} after {max_iterations} seconds")
            yield f"data: {json.dumps({'error': 'Timeout after 15 minutes', 'status': 'timeout'})}\n\n"
    
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

async def generate_all_sections_progressively(session_id: str):
    """
    Background task to generate all sections progressively
    """
    # Create a new database session for the background task
    db = SessionLocal()
    session = None
    try:
        session = db.query(GenerationSession).filter(
            GenerationSession.id == session_id
        ).first()

        if not session:
            logger.error(f"Session {session_id} not found")
            return

        # Initialize JSON fields that might be None from the database
        if session.completed_sections is None:
            session.completed_sections = []
            flag_modified(session, 'completed_sections')
        if session.failed_sections is None:
            session.failed_sections = []
            flag_modified(session, 'failed_sections')
        if session.answers is None:
            session.answers = {}
            flag_modified(session, 'answers')

        logger.info(f"Starting progressive generation for session {session_id}")

        # Initialize AI service with error handling
        try:
            logger.info(f"Attempting to initialize AI service for session {session_id}")
            ai_service = AIAutoFillService()
            logger.info(f"AI service initialized successfully for session {session_id}")

            # Test if OpenAI client is properly configured
            if not hasattr(ai_service, 'client') or not ai_service.client:
                raise Exception("OpenAI client not properly configured - check OPENAI_API_KEY environment variable")

            # Verify the model is set
            if not hasattr(ai_service, 'model') or not ai_service.model:
                raise Exception("OpenAI model not configured")

            logger.info(f"OpenAI service validated for session {session_id} with model: {ai_service.model}")

        except ValueError as e:
            # This is raised when API key is not configured
            logger.error(f"API key configuration error for session {session_id}: {str(e)}")
            session.status = GenerationStatus.FAILED
            session.error_message = "OpenAI API key is not properly configured. Please contact support."
            db.commit()
            return
        except Exception as e:
            logger.error(f"Failed to initialize AI service for session {session_id}: {str(e)}", exc_info=True)
            session.status = GenerationStatus.FAILED
            session.error_message = f"Failed to initialize AI service: {str(e)}"
            db.commit()
            return

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
        for section_index, section_key in enumerate(session.sections_order):
            # Check if cancelled
            # NOTE: Removed db.refresh(session) here as it was causing data loss
            # The session object in memory has the correct state
            if session.status == GenerationStatus.CANCELLED:
                logger.info(f"Generation cancelled for session {session_id}")
                break

            # Skip already completed sections
            # Ensure completed_sections is not None
            if session.completed_sections is None:
                session.completed_sections = []
                flag_modified(session, 'completed_sections')

            if section_key in session.completed_sections:
                logger.info(f"Skipping already completed section: {section_key}")
                continue

            # Retry logic for each section
            max_retries = 3
            retry_count = 0
            section_generated = False

            while retry_count < max_retries and not section_generated:
                try:
                    logger.info(f"Starting generation for section: {section_key} (attempt {retry_count + 1}/{max_retries})")
                    # Update current section and starting progress
                    session.status = GenerationStatus.IN_PROGRESS
                    session.current_section = section_key

                    # Calculate progress - give partial credit for starting a section
                    base_progress = (section_index / len(session.sections_order)) * 100
                    session.progress_percentage = int(base_progress + 8)  # Add 8% for starting
                    db.commit()
                    logger.info(f"Progress updated to {session.progress_percentage}% for section {section_key}")

                    # Get section data
                    section_data = form_questions['sections'].get(section_key)
                    if not section_data:
                        logger.warning(f"Section data not found for {section_key}")
                        break

                    # Update progress - midway through section
                    session.progress_percentage = int(base_progress + 10)
                    db.commit()

                    # Generate section answers with timeout
                    logger.info(f"Building context for section {section_key}")
                    try:
                        section_context = await asyncio.wait_for(
                            ai_service._build_section_context(section_key),
                            timeout=30.0
                        )
                        logger.info(f"Context built for section {section_key}: {len(str(section_context))} chars")
                    except asyncio.TimeoutError:
                        logger.error(f"Timeout building context for section {section_key}")
                        raise
                    except Exception as e:
                        logger.error(f"Error building context for section {section_key}: {str(e)}", exc_info=True)
                        raise

                    logger.info(f"Processing section {section_key} with {len(section_data.get('questions', {}))} questions")
                    try:
                        section_answers = await asyncio.wait_for(
                            ai_service._process_section(
                                section_key,
                                section_data,
                                section_context
                            ),
                            timeout=120.0  # 2 minutes timeout per section
                        )
                        logger.info(f"Section {section_key} generated {len(section_answers) if section_answers else 0} answers")
                    except asyncio.TimeoutError:
                        logger.error(f"Timeout processing section {section_key} after 120 seconds")
                        raise
                    except Exception as e:
                        logger.error(f"Error processing section {section_key}: {str(e)}", exc_info=True)
                        raise

                    # Validate that we got answers
                    if not section_answers:
                        raise Exception(f"No answers generated for section {section_key}")

                    # Update session
                    if not session.answers:
                        session.answers = {}
                    session.answers[section_key] = section_answers
                    flag_modified(session, 'answers')

                    # Ensure completed_sections is not None
                    if session.completed_sections is None:
                        session.completed_sections = []
                        flag_modified(session, 'completed_sections')

                    if section_key not in session.completed_sections:
                        session.completed_sections.append(section_key)
                        flag_modified(session, 'completed_sections')

                    session.completed_count = len(session.completed_sections)
                    # Update progress to show section completion
                    completed_progress = int((session.completed_count / session.total_sections) * 100)
                    # Ensure progress always moves forward
                    session.progress_percentage = max(completed_progress, session.progress_percentage)

                    logger.info(f"Section {section_key} completed successfully. Total completed: {session.completed_count}/{session.total_sections}, Progress: {session.progress_percentage}%")

                    # Update context memory for next section
                    ai_service.context_memory["answers"][section_key] = section_answers

                    db.commit()
                    section_generated = True

                    # Small delay between sections
                    await asyncio.sleep(0.5)

                except asyncio.TimeoutError:
                    retry_count += 1
                    logger.error(f"Timeout generating section {section_key} (attempt {retry_count}/{max_retries})")
                    if retry_count >= max_retries:
                        # Ensure failed_sections is not None
                        if session.failed_sections is None:
                            session.failed_sections = []
                        if section_key not in session.failed_sections:
                            session.failed_sections.append(section_key)
                            flag_modified(session, 'failed_sections')
                        session.error_message = f"Timeout generating section {section_key} after {max_retries} attempts"
                        logger.error(f"Section {section_key} failed permanently after {max_retries} attempts")
                    else:
                        logger.info(f"Retrying section {section_key} after timeout...")
                        await asyncio.sleep(2)  # Wait before retry
                except Exception as e:
                    retry_count += 1
                    error_msg = str(e)
                    logger.error(f"Error generating section {section_key} (attempt {retry_count}/{max_retries}): {error_msg}", exc_info=True)
                    if retry_count >= max_retries:
                        # Ensure failed_sections is not None
                        if session.failed_sections is None:
                            session.failed_sections = []
                        if section_key not in session.failed_sections:
                            session.failed_sections.append(section_key)
                            flag_modified(session, 'failed_sections')
                        session.error_message = f"Failed to generate section {section_key}: {error_msg}"
                        logger.error(f"Section {section_key} failed permanently: {error_msg}")
                    else:
                        logger.info(f"Retrying section {section_key} after error: {error_msg}")
                        await asyncio.sleep(2)  # Wait before retry

                db.commit()

        # Final status update
        # NOTE: Removed db.refresh(session) here as it was loading stale data
        # The in-memory session object has all the completed sections
        if session.status != GenerationStatus.CANCELLED:
            # Ensure completed_sections and failed_sections are not None
            if session.completed_sections is None:
                session.completed_sections = []
                flag_modified(session, 'completed_sections')
            if session.failed_sections is None:
                session.failed_sections = []
                flag_modified(session, 'failed_sections')

            completed_count = len(session.completed_sections)
            total_count = session.total_sections

            logger.info(f"Final status check for session {session_id}: completed {completed_count}/{total_count} sections")

            if completed_count == total_count:
                logger.info(f"Generation completed successfully for session {session_id}")
                session.status = GenerationStatus.COMPLETED
                session.completed_at = datetime.utcnow()
                session.progress_percentage = 100
                session.error_message = None

                # Use one proposal credit after successful generation
                user = db.query(User).filter_by(id=session.user_id).first()
                if user:
                    await use_proposal_credit(user, db)
            elif session.failed_sections:
                logger.error(f"Generation partially failed for session {session_id}, failed sections: {session.failed_sections}")
                session.status = GenerationStatus.FAILED
                session.error_message = f"Failed to generate sections: {', '.join(session.failed_sections)}"
            elif completed_count > 0:
                # Partial completion
                logger.warning(f"Generation partially complete for session {session_id}: {completed_count}/{total_count} sections")
                session.status = GenerationStatus.FAILED
                missing_sections = [s for s in session.sections_order if s not in session.completed_sections]
                session.error_message = f"Generation incomplete. Missing sections: {', '.join(missing_sections)}"
            else:
                logger.error(f"Generation failed completely for session {session_id}")
                session.status = GenerationStatus.FAILED
                session.error_message = "No sections were generated successfully"

        db.commit()
        logger.info(f"Background generation finished for session {session_id}, status: {session.status.value}, completed: {len(session.completed_sections) if session.completed_sections else 0}/{session.total_sections}")

    except Exception as e:
        logger.error(f"Background generation critical error for session {session_id}: {str(e)}", exc_info=True)
        try:
            if session:
                session.status = GenerationStatus.FAILED
                session.error_message = f"Critical error: {str(e)}"
                db.commit()
        except:
            logger.error(f"Failed to update session status after critical error")
    finally:
        # Always close the database session
        db.close()