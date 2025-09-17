"""
Quality Score API endpoints for Erasmus+ proposals
"""
from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from typing import Dict, Optional
from datetime import datetime
from pydantic import BaseModel

from app.db.database import get_db
from app.db.models import Proposal, User
from app.api.dependencies import get_current_user
from app.services.quality_scorer import QualityScorer
import logging

logger = logging.getLogger(__name__)
router = APIRouter()

# Request/Response models
class QualityScorePreviewRequest(BaseModel):
    answers: Dict
    project_context: Optional[Dict] = None

class QualityScoreResponse(BaseModel):
    overall_score: float
    section_scores: Dict[str, float]
    thresholds_met: Dict[str, bool]
    pass_evaluation: bool
    feedback: Optional[Dict]
    calculated_at: str
    scoring_version: str

@router.post("/calculate/{proposal_id}", response_model=QualityScoreResponse)
async def calculate_quality_score(
    proposal_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Calculate and store quality score for an existing proposal
    """
    # Fetch proposal
    proposal = db.query(Proposal).filter(
        Proposal.id == proposal_id,
        Proposal.user_id == current_user.id
    ).first()

    if not proposal:
        raise HTTPException(status_code=404, detail="Proposal not found")

    try:
        # Initialize scorer
        scorer = QualityScorer()

        # Prepare proposal data
        proposal_data = {
            'title': proposal.title,
            'project_idea': proposal.project_idea,
            'priorities': proposal.priorities or [],
            'target_groups': proposal.target_groups,
            'partners': proposal.partners,
            'duration_months': proposal.duration_months,
            'budget': proposal.budget,
            'answers': proposal.answers or {}
        }

        # Calculate score
        logger.info(f"Calculating quality score for proposal {proposal_id}")
        score_result = await scorer.calculate_proposal_score(
            proposal=proposal_data,
            detailed_feedback=True
        )

        # Store results in database
        proposal.quality_score = score_result['overall_score']
        proposal.section_scores = score_result['section_scores']
        proposal.quality_feedback = score_result.get('feedback')
        proposal.score_calculated_at = datetime.utcnow()

        db.commit()

        logger.info(f"Quality score calculated for proposal {proposal_id}: {score_result['overall_score']}")

        return QualityScoreResponse(
            overall_score=score_result['overall_score'],
            section_scores=score_result['section_scores'],
            thresholds_met=score_result['thresholds_met'],
            pass_evaluation=score_result['pass_evaluation'],
            feedback=score_result.get('feedback'),
            calculated_at=score_result['calculated_at'],
            scoring_version=score_result.get('scoring_version', '1.0')
        )

    except Exception as e:
        logger.error(f"Error calculating quality score: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to calculate quality score: {str(e)}"
        )

@router.post("/preview", response_model=QualityScoreResponse)
async def preview_quality_score(
    request: QualityScorePreviewRequest,
    current_user: User = Depends(get_current_user)
):
    """
    Preview quality score without saving (for real-time updates)
    """
    try:
        # Initialize scorer
        scorer = QualityScorer()

        # Prepare proposal data
        proposal_data = {
            'answers': request.answers,
            **(request.project_context or {})
        }

        # Calculate score without saving
        score_result = await scorer.calculate_proposal_score(
            proposal=proposal_data,
            detailed_feedback=False  # Faster without detailed feedback
        )

        return QualityScoreResponse(
            overall_score=score_result['overall_score'],
            section_scores=score_result['section_scores'],
            thresholds_met=score_result['thresholds_met'],
            pass_evaluation=score_result['pass_evaluation'],
            feedback=score_result.get('feedback'),
            calculated_at=score_result['calculated_at'],
            scoring_version=score_result.get('scoring_version', '1.0')
        )

    except Exception as e:
        logger.error(f"Error previewing quality score: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to preview quality score: {str(e)}"
        )

@router.get("/{proposal_id}", response_model=QualityScoreResponse)
async def get_quality_score(
    proposal_id: int,
    recalculate: bool = False,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get cached quality score for a proposal
    """
    # Fetch proposal
    proposal = db.query(Proposal).filter(
        Proposal.id == proposal_id,
        Proposal.user_id == current_user.id
    ).first()

    if not proposal:
        raise HTTPException(status_code=404, detail="Proposal not found")

    # Check if we need to recalculate or if cached score is missing/old
    needs_calculation = (
        recalculate or
        proposal.quality_score is None or
        proposal.score_calculated_at is None or
        (datetime.utcnow() - proposal.score_calculated_at).days > 7  # Recalculate if older than 7 days
    )

    if needs_calculation:
        # Recalculate score
        return await calculate_quality_score(proposal_id, db, current_user)

    # Return cached score
    return QualityScoreResponse(
        overall_score=proposal.quality_score,
        section_scores=proposal.section_scores or {},
        thresholds_met=_calculate_thresholds_met(
            proposal.quality_score,
            proposal.section_scores or {}
        ),
        pass_evaluation=proposal.quality_score >= 60,
        feedback=proposal.quality_feedback,
        calculated_at=proposal.score_calculated_at.isoformat() if proposal.score_calculated_at else datetime.utcnow().isoformat(),
        scoring_version="1.0"
    )

def _calculate_thresholds_met(overall_score: float, section_scores: Dict) -> Dict[str, bool]:
    """Calculate threshold status from scores"""
    quality_score = section_scores.get('partnership', 0) + section_scores.get('project_management', 0)

    return {
        'total': overall_score >= 60,
        'relevance': section_scores.get('relevance', 0) >= 15,
        'quality': quality_score >= 15,
        'impact': section_scores.get('impact', 0) >= 15,
        'all_thresholds_met': (
            overall_score >= 60 and
            section_scores.get('relevance', 0) >= 15 and
            quality_score >= 15 and
            section_scores.get('impact', 0) >= 15
        )
    }

@router.post("/batch-calculate")
async def batch_calculate_scores(
    proposal_ids: list[int],
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Calculate quality scores for multiple proposals (admin feature)
    """
    results = []
    errors = []

    for proposal_id in proposal_ids:
        try:
            score = await calculate_quality_score(proposal_id, db, current_user)
            results.append({
                'proposal_id': proposal_id,
                'score': score.overall_score,
                'status': 'success'
            })
        except Exception as e:
            errors.append({
                'proposal_id': proposal_id,
                'error': str(e),
                'status': 'error'
            })

    return {
        'calculated': len(results),
        'errors': len(errors),
        'results': results,
        'error_details': errors
    }