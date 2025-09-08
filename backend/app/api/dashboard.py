from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.db.database import get_db
from app.db.models import User, Proposal
from app.api.dependencies import get_current_user

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
            "total_proposals": total_proposals,
            "draft_proposals": draft_proposals,
            "submitted_proposals": submitted_proposals
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