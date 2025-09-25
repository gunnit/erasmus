"""
API endpoints for Conversational AI interactions
"""
from fastapi import APIRouter, HTTPException, Depends, BackgroundTasks
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Dict, List, Optional, Any
import json
import asyncio
import logging
from datetime import datetime

from app.db.database import get_db
from app.db.models import User, Proposal
from app.services.conversational_ai_service import ConversationalAIService
from app.api.dependencies import get_current_user

logger = logging.getLogger(__name__)

router = APIRouter()

# Initialize service
ai_service = ConversationalAIService()

class ConversationMessage(BaseModel):
    """Model for conversation messages"""
    message: str
    conversation_history: List[Dict] = []
    project_context: Optional[Dict] = None
    current_answers: Optional[Dict] = None
    mode: str = "general"  # "general", "improvement", "suggestion"
    proposal_id: Optional[int] = None

class AnalysisRequest(BaseModel):
    """Model for analysis requests"""
    section: str
    answers: Dict
    project_context: Dict
    proposal_id: Optional[int] = None

class AlternativeRequest(BaseModel):
    """Model for alternative answer requests"""
    question: Dict
    current_answer: str
    project_context: Dict
    style: str = "standard"  # "standard", "concise", "detailed", "innovative"

class BestPracticesRequest(BaseModel):
    """Model for best practices requests"""
    topic: str
    context: Optional[Dict] = None

@router.post("/chat")
async def chat_with_ai(
    request: ConversationMessage,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Process a conversational message with the AI assistant

    This endpoint handles real-time conversations about grant applications,
    providing advice, answering questions, and suggesting improvements.
    """
    try:
        # If a proposal_id is provided, load its context
        if request.proposal_id:
            proposal = db.query(Proposal).filter(
                Proposal.id == request.proposal_id,
                Proposal.user_id == current_user.id
            ).first()

            if proposal:
                # Merge proposal context with provided context
                if not request.project_context:
                    request.project_context = {
                        "title": proposal.title,
                        "field": proposal.field,
                        "project_idea": proposal.project_idea,
                        "priorities": proposal.priorities,
                        "target_groups": proposal.target_groups,
                        "partners": proposal.partners
                    }
                if not request.current_answers:
                    request.current_answers = proposal.answers

        # Process the conversation
        response = await ai_service.process_conversation(
            message=request.message,
            conversation_history=request.conversation_history,
            project_context=request.project_context,
            current_answers=request.current_answers,
            mode=request.mode
        )

        # Log the interaction for analytics (optional)
        logger.info(f"User {current_user.id} conversational AI interaction in mode: {request.mode}")

        return response

    except Exception as e:
        logger.error(f"Error in chat endpoint: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/analyze-section")
async def analyze_section(
    request: AnalysisRequest,
    current_user: User = Depends(get_current_user)
):
    """
    Analyze a section and provide autonomous improvement suggestions

    This endpoint analyzes the quality of answers in a specific section
    and provides detailed feedback with actionable improvements.
    """
    try:
        response = await ai_service.analyze_and_suggest_improvements(
            section=request.section,
            answers=request.answers,
            project_context=request.project_context
        )

        return response

    except Exception as e:
        logger.error(f"Error analyzing section: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/generate-alternative")
async def generate_alternative_answer(
    request: AlternativeRequest,
    current_user: User = Depends(get_current_user)
):
    """
    Generate alternative answers for a question

    This endpoint creates alternative versions of answers using different
    writing styles and approaches to help users find the best fit.
    """
    try:
        response = await ai_service.generate_alternative_answers(
            question=request.question,
            current_answer=request.current_answer,
            project_context=request.project_context,
            style=request.style
        )

        return response

    except Exception as e:
        logger.error(f"Error generating alternative: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/best-practices")
async def get_best_practices(
    request: BestPracticesRequest,
    current_user: User = Depends(get_current_user)
):
    """
    Get best practices for a specific topic

    This endpoint provides best practices, examples, and guidance
    for specific aspects of grant application writing.
    """
    try:
        response = await ai_service.get_best_practices(
            topic=request.topic,
            context=request.context
        )

        return response

    except Exception as e:
        logger.error(f"Error getting best practices: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/conversation-starters")
async def get_conversation_starters(
    proposal_id: Optional[int] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get suggested conversation starters based on context

    This endpoint provides relevant questions and topics to help users
    start productive conversations with the AI assistant.
    """
    try:
        starters = []

        if proposal_id:
            proposal = db.query(Proposal).filter(
                Proposal.id == proposal_id,
                Proposal.user_id == current_user.id
            ).first()

            if proposal:
                # Generate context-specific starters
                if not proposal.answers or len(proposal.answers) == 0:
                    starters = [
                        "How should I structure my project objectives?",
                        "What makes a strong partnership in Erasmus+ projects?",
                        "Can you help me identify innovative aspects of my project?",
                        "What are the key evaluation criteria I should focus on?",
                        "How do I demonstrate European added value?"
                    ]
                else:
                    # If there are answers, suggest improvements
                    starters = [
                        "Can you review my relevance section for improvements?",
                        "How can I strengthen my sustainability plan?",
                        "Are my objectives SMART enough?",
                        "What's missing from my impact assessment?",
                        "How can I better demonstrate innovation?"
                    ]
        else:
            # Generic starters
            starters = [
                "What are the most common mistakes in Erasmus+ applications?",
                "How do I choose the right priorities for my project?",
                "What makes a winning Erasmus+ proposal?",
                "Can you explain the evaluation process?",
                "How important is the partnership composition?",
                "What's the best way to demonstrate impact?"
            ]

        return {
            "starters": starters,
            "context": "proposal" if proposal_id else "general"
        }

    except Exception as e:
        logger.error(f"Error getting conversation starters: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/chat/stream")
async def stream_chat_response(
    message: str,
    mode: str = "general",
    current_user: User = Depends(get_current_user)
):
    """
    Stream chat responses for real-time interaction

    This endpoint provides Server-Sent Events for streaming AI responses
    character by character for a more interactive experience.
    """
    async def generate():
        try:
            # This is a simplified version - you'd implement actual streaming
            response = await ai_service.process_conversation(
                message=message,
                conversation_history=[],
                project_context=None,
                current_answers=None,
                mode=mode
            )

            # Simulate streaming by sending chunks
            full_response = response.get("response", "")
            chunk_size = 20

            for i in range(0, len(full_response), chunk_size):
                chunk = full_response[i:i+chunk_size]
                yield f"data: {json.dumps({'chunk': chunk})}\n\n"
                await asyncio.sleep(0.05)  # Small delay for effect

            # Send completion signal
            yield f"data: {json.dumps({'done': True, 'suggestions': response.get('suggestions', [])})}\n\n"

        except Exception as e:
            yield f"data: {json.dumps({'error': str(e)})}\n\n"

    return StreamingResponse(
        generate(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no"
        }
    )

@router.post("/quick-tips")
async def get_quick_tips(
    section: str,
    current_user: User = Depends(get_current_user)
):
    """
    Get quick tips for a specific section

    This endpoint provides immediate, actionable tips for improving
    specific sections of the application.
    """
    try:
        tips_map = {
            "relevance": [
                "Explicitly name each priority in your answers",
                "Use statistics and data to support your claims",
                "Show how your project addresses gaps in current solutions",
                "Emphasize transnational cooperation benefits",
                "Include references to EU policies and initiatives"
            ],
            "needs_analysis": [
                "Include specific data and research citations",
                "Show you've consulted with target groups",
                "Identify root causes, not just symptoms",
                "Link needs directly to your proposed solutions",
                "Consider local, national, and EU-level needs"
            ],
            "partnership": [
                "Highlight complementary expertise of partners",
                "Show previous collaboration experience if any",
                "Ensure balanced geographic representation",
                "Clarify each partner's unique contribution",
                "Include partners from different sectors"
            ],
            "impact": [
                "Define clear, measurable KPIs",
                "Include short-term and long-term impacts",
                "Describe dissemination strategies in detail",
                "Show how results will be sustained post-funding",
                "Consider impacts at multiple levels (local to EU)"
            ],
            "project_management": [
                "Include specific quality assurance measures",
                "Create a realistic risk mitigation plan",
                "Show clear work package structure",
                "Incorporate green and digital practices",
                "Define clear monitoring milestones"
            ],
            "project_summary": [
                "Keep it concise - now only 500 characters per answer",
                "Focus on the most impactful elements",
                "Use numbers and concrete targets",
                "Ensure consistency with detailed sections",
                "Write this section last for best synthesis"
            ]
        }

        tips = tips_map.get(section, ["Focus on clarity and specificity", "Address all parts of each question"])

        return {
            "section": section,
            "tips": tips,
            "quick_actions": [
                f"Review your {section} section for these elements",
                "Add specific examples and data",
                "Check character limits",
                "Ensure alignment with priorities"
            ]
        }

    except Exception as e:
        logger.error(f"Error getting quick tips: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))