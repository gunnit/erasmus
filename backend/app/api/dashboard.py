from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.db.database import get_db
from app.db.models import User, Proposal
from app.api.dependencies import get_current_user
from datetime import datetime, timedelta

router = APIRouter(prefix="/api/dashboard", tags=["dashboard"])

@router.get("/stats")
async def get_dashboard_stats(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Get proposal statistics
    total_proposals = db.query(Proposal).filter(Proposal.user_id == current_user.id).count()
    
    draft_proposals = db.query(Proposal).filter(
        Proposal.user_id == current_user.id,
        Proposal.status == "draft"
    ).count()
    
    submitted_proposals = db.query(Proposal).filter(
        Proposal.user_id == current_user.id,
        Proposal.status == "submitted"
    ).count()
    
    approved_proposals = db.query(Proposal).filter(
        Proposal.user_id == current_user.id,
        Proposal.status == "approved"
    ).count()
    
    rejected_proposals = db.query(Proposal).filter(
        Proposal.user_id == current_user.id,
        Proposal.status == "rejected"
    ).count()
    
    # Calculate total budget
    total_budget = db.query(func.sum(Proposal.budget)).filter(
        Proposal.user_id == current_user.id
    ).scalar() or 0
    
    # Calculate success rate
    completed = approved_proposals + rejected_proposals
    success_rate = int((approved_proposals / completed * 100)) if completed > 0 else 0
    
    # Get average duration
    avg_duration = db.query(func.avg(Proposal.duration_months)).filter(
        Proposal.user_id == current_user.id
    ).scalar() or 24
    
    # Count total partners (simplified)
    total_partners = total_proposals * 3  # Assuming average 3 partners
    
    # Get recent proposals
    recent_proposals = db.query(Proposal).filter(
        Proposal.user_id == current_user.id
    ).order_by(Proposal.updated_at.desc()).limit(5).all()
    
    return {
        "user": {
            "id": current_user.id,
            "username": current_user.username,
            "email": current_user.email,
            "full_name": current_user.full_name,
            "organization": current_user.organization
        },
        "stats": {
            "totalProposals": total_proposals,
            "draftProposals": draft_proposals,
            "submittedProposals": submitted_proposals,
            "approvedProposals": approved_proposals,
            "rejectedProposals": rejected_proposals,
            "pendingProposals": submitted_proposals,
            "totalBudget": float(total_budget),
            "successRate": success_rate,
            "averageDuration": int(avg_duration) if avg_duration else 24,
            "totalPartners": total_partners
        },
        "recent_proposals": [
            {
                "id": p.id,
                "title": p.title,
                "status": p.status,
                "created_at": p.created_at,
                "updated_at": p.updated_at
            } for p in recent_proposals
        ]
    }