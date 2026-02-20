from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, Field
from typing import Optional, Dict, Any
import json
import os
from datetime import datetime

from app.services.openai_service import OpenAIService
from app.api.dependencies import get_current_user
from app.core.subscription_deps import require_valid_subscription
from app.db.models import User, Proposal
from app.db.database import get_db
from sqlalchemy.orm import Session
from app.api.proposals import update_proposal_status_from_answers

router = APIRouter()

class GenerateSingleAnswerRequest(BaseModel):
    proposal_id: str = Field(..., description="ID of the proposal")
    section: str = Field(..., description="Section name (e.g., 'project_summary', 'relevance')")
    question_id: str = Field(..., description="Question ID (e.g., 'PS-1', 'R-1')")
    question_field: str = Field(..., description="Question field name (e.g., 'objectives', 'priority_addressing')")
    additional_context: Optional[str] = Field(None, description="Additional context to improve answer quality")
    project_context: Dict[str, Any] = Field(..., description="Project details and existing answers")

class GenerateSingleAnswerResponse(BaseModel):
    question_id: str
    section: str
    field: str
    answer: str
    character_count: int
    character_limit: int
    generation_time: float

# Load form questions
form_questions_path = os.path.join(os.path.dirname(__file__), '..', '..', 'data', 'form_questions.json')
with open(form_questions_path, 'r') as f:
    FORM_QUESTIONS = json.load(f)

@router.post("/generate-single-answer", response_model=GenerateSingleAnswerResponse)
async def generate_single_answer(
    request: GenerateSingleAnswerRequest,
    current_user: User = Depends(require_valid_subscription),
    db: Session = Depends(get_db)
):
    """
    Generate a single answer for a specific question with optional additional context
    """
    start_time = datetime.now()

    # Find the question details
    question_details = None
    for section_key, section_data in FORM_QUESTIONS['sections'].items():
        if section_key == request.section:
            for question in section_data['questions']:
                if question.get('id') == request.question_id:
                    question_details = question
                    break
            if question_details:
                break

    if not question_details:
        raise HTTPException(status_code=404, detail=f"Question {request.question_id} not found in section {request.section}")

    # Initialize OpenAI service
    openai_service = OpenAIService()

    # Build context from existing answers
    existing_answers_text = ""
    if request.project_context.get('answers'):
        for section_name, section_answers in request.project_context['answers'].items():
            if isinstance(section_answers, dict):
                for field, answer in section_answers.items():
                    if answer and field != request.question_field:
                        existing_answers_text += f"\n{field}: {answer[:500]}..."

    # Create optimized prompt for single question
    system_prompt = f"""You are an expert Erasmus+ KA220-ADU grant application consultant.
Generate a high-quality answer for a specific question in the application form.

Question Details:
- Section: {request.section}
- Question: {question_details.get('question')}
- Character Limit: {question_details.get('character_limit', 2000)}
- Evaluation Weight: {question_details.get('evaluation_weight', 5)}/10

Tips for this question:
{json.dumps(question_details.get('tips', []))}

Project Context:
- Title: {request.project_context.get('title')}
- Project Idea: {request.project_context.get('project_idea', '')[:500]}
- EU Priorities: {', '.join(request.project_context.get('priorities', []))}
- Target Groups: {request.project_context.get('target_groups', '')}
- Duration: {request.project_context.get('duration_months', 24)} months
- Budget: €{request.project_context.get('budget', 250000)}

Partners:
{json.dumps(request.project_context.get('partners', []), indent=2)}

Previously Generated Answers (for context and consistency):
{existing_answers_text[:2000]}

Additional Context from User:
{request.additional_context if request.additional_context else 'None provided'}
{('IMPORTANT: The user provided additional context above - incorporate it directly into your answer!' if request.additional_context else '')}

IMPORTANT:
1. Answer ONLY the specific question asked - be CONCISE and focused
2. Target 70-80% of the {question_details.get('character_limit', 2000)} character limit
3. Be specific but avoid unnecessary elaboration
4. Reference project specifics and partners where relevant
5. Maintain consistency with previously generated answers
6. Use professional grant application language
7. Include concrete numbers and measurable outcomes
8. Prioritize quality and clarity over length
9. If additional context is provided above, USE IT directly in your answer"""

    user_prompt = f"""Generate a comprehensive answer for:

{question_details.get('question')}

The answer should be exactly tailored to this project and directly address all aspects of the question.
Maximum {question_details.get('character_limit', 2000)} characters."""

    try:
        # Generate the answer
        answer = await openai_service.generate_completion(
            system_prompt=system_prompt,
            user_prompt=user_prompt,
            max_tokens=1500,  # Expanded for detailed grant answers
            temperature=0.7
        )

        # Get character limit but don't trim - let token limits control length
        char_limit = question_details.get('character_limit', 2000)

        generation_time = (datetime.now() - start_time).total_seconds()

        # Update proposal status if proposal_id is provided and is a valid integer
        if request.proposal_id and request.proposal_id.isdigit():
            proposal = db.query(Proposal).filter(
                Proposal.id == int(request.proposal_id),
                Proposal.user_id == current_user.id
            ).first()

            if proposal:
                # Update the specific answer in the proposal
                if not proposal.answers:
                    proposal.answers = {}
                if request.section not in proposal.answers:
                    proposal.answers[request.section] = {}
                proposal.answers[request.section][request.question_field] = answer

                # Update status based on answer count
                await update_proposal_status_from_answers(proposal, db, current_user)

        return GenerateSingleAnswerResponse(
            question_id=request.question_id,
            section=request.section,
            field=request.question_field,
            answer=answer,
            character_count=len(answer),
            character_limit=char_limit,
            generation_time=generation_time
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate answer: {str(e)}")

@router.get("/questions/{section}")
async def get_section_questions(
    section: str,
    current_user: User = Depends(get_current_user)
):
    """
    Get all questions for a specific section
    """
    if section not in FORM_QUESTIONS['sections']:
        raise HTTPException(status_code=404, detail=f"Section '{section}' not found")

    return FORM_QUESTIONS['sections'][section]