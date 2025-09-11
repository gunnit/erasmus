from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func, extract
from datetime import datetime, timedelta
from typing import Dict, Any, List

from app.db.database import get_db
from app.db.models import User, Proposal
from app.api.dependencies import get_current_user

router = APIRouter()

@router.get("/stats")
async def get_analytics_stats(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """Get analytics statistics for the current user"""
    
    # Get user's proposals
    proposals = db.query(Proposal).filter(Proposal.user_id == current_user.id).all()
    
    # Calculate statistics
    total_proposals = len(proposals)
    approved_proposals = len([p for p in proposals if p.status == 'approved'])
    pending_proposals = len([p for p in proposals if p.status == 'pending'])
    rejected_proposals = len([p for p in proposals if p.status == 'rejected'])
    
    total_budget = sum(p.budget or 0 for p in proposals)
    success_rate = (approved_proposals / total_proposals * 100) if total_proposals > 0 else 0
    avg_duration = sum(p.duration_months or 0 for p in proposals) / total_proposals if total_proposals > 0 else 0
    
    # Count unique partners
    all_partners = []
    for p in proposals:
        if p.partners:
            all_partners.extend(p.partners if isinstance(p.partners, list) else [])
    total_partners = len(set(all_partners))
    
    return {
        "overview": {
            "totalProposals": total_proposals,
            "approvedProposals": approved_proposals,
            "pendingProposals": pending_proposals,
            "rejectedProposals": rejected_proposals,
            "totalBudget": total_budget,
            "successRate": round(success_rate, 1),
            "averageDuration": round(avg_duration, 1),
            "totalPartners": total_partners,
            "completionRate": 82  # Mock value - could calculate based on filled fields
        }
    }

@router.get("/trends")
async def get_analytics_trends(
    time_range: str = "month",
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """Get trend data for analytics charts"""
    
    # Calculate date range
    end_date = datetime.now()
    if time_range == "week":
        start_date = end_date - timedelta(days=7)
        period_days = 1
    elif time_range == "year":
        start_date = end_date - timedelta(days=365)
        period_days = 30
    else:  # month
        start_date = end_date - timedelta(days=30)
        period_days = 5
    
    # Get proposals in date range
    proposals = db.query(Proposal).filter(
        Proposal.user_id == current_user.id,
        Proposal.created_at >= start_date
    ).all()
    
    # Mock trend data - in production, would aggregate from real data
    trends = {
        "proposals": [
            {"month": "Jan", "count": 2, "approved": 1},
            {"month": "Feb", "count": 3, "approved": 2},
            {"month": "Mar", "count": 4, "approved": 3},
            {"month": "Apr", "count": 3, "approved": 3},
            {"month": "May", "count": 5, "approved": 4},
            {"month": "Jun", "count": 7, "approved": 5}
        ],
        "budget": [
            {"month": "Jan", "allocated": 400000, "spent": 320000},
            {"month": "Feb", "allocated": 600000, "spent": 480000},
            {"month": "Mar", "allocated": 800000, "spent": 640000},
            {"month": "Apr", "allocated": 700000, "spent": 560000},
            {"month": "May", "allocated": 1000000, "spent": 800000},
            {"month": "Jun", "allocated": 1300000, "spent": 1040000}
        ]
    }
    
    return trends

@router.get("/priorities")
async def get_priorities_distribution(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> List[Dict[str, Any]]:
    """Get distribution of priorities across proposals"""
    
    proposals = db.query(Proposal).filter(Proposal.user_id == current_user.id).all()
    
    # Count priorities
    priority_counts = {}
    for proposal in proposals:
        if proposal.priorities:
            priorities = proposal.priorities if isinstance(proposal.priorities, list) else []
            for priority in priorities:
                priority_counts[priority] = priority_counts.get(priority, 0) + 1
    
    # Convert to percentage and format for charts
    total = sum(priority_counts.values())
    
    # Map to categories with colors
    priority_mapping = {
        "Digital Transformation": {"color": "#3B82F6", "count": 0},
        "Social Inclusion": {"color": "#10B981", "count": 0},
        "Environmental": {"color": "#F59E0B", "count": 0},
        "Innovation": {"color": "#8B5CF6", "count": 0},
        "Other": {"color": "#6B7280", "count": 0}
    }
    
    for priority, count in priority_counts.items():
        # Simple categorization - in production would use better mapping
        if "digital" in priority.lower():
            priority_mapping["Digital Transformation"]["count"] += count
        elif "social" in priority.lower() or "inclusion" in priority.lower():
            priority_mapping["Social Inclusion"]["count"] += count
        elif "environment" in priority.lower() or "green" in priority.lower():
            priority_mapping["Environmental"]["count"] += count
        elif "innovat" in priority.lower():
            priority_mapping["Innovation"]["count"] += count
        else:
            priority_mapping["Other"]["count"] += count
    
    result = []
    for name, data in priority_mapping.items():
        if data["count"] > 0:
            result.append({
                "name": name,
                "value": round(data["count"] / total * 100, 1) if total > 0 else 0,
                "color": data["color"]
            })
    
    return result

@router.get("/status-distribution")
async def get_status_distribution(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> List[Dict[str, Any]]:
    """Get distribution of proposal statuses"""
    
    proposals = db.query(Proposal).filter(Proposal.user_id == current_user.id).all()
    total = len(proposals)
    
    if total == 0:
        return []
    
    status_counts = {
        "Approved": len([p for p in proposals if p.status == "approved"]),
        "Pending": len([p for p in proposals if p.status == "pending"]),
        "Rejected": len([p for p in proposals if p.status == "rejected"])
    }
    
    result = []
    for status, count in status_counts.items():
        result.append({
            "status": status,
            "count": count,
            "percentage": round(count / total * 100, 1)
        })
    
    return result

@router.get("/partner-countries")
async def get_partner_countries(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> List[Dict[str, Any]]:
    """Get distribution of partner countries"""
    
    # Mock data - in production would extract from partner data
    return [
        {"country": "Germany", "partners": 23},
        {"country": "France", "partners": 18},
        {"country": "Spain", "partners": 15},
        {"country": "Italy", "partners": 12},
        {"country": "Poland", "partners": 10},
        {"country": "Others", "partners": 11}
    ]

@router.get("/recent-activity")
async def get_recent_activity(
    limit: int = 10,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> List[Dict[str, Any]]:
    """Get recent activity for the user"""
    
    proposals = db.query(Proposal).filter(
        Proposal.user_id == current_user.id
    ).order_by(Proposal.updated_at.desc()).limit(limit).all()
    
    activities = []
    for proposal in proposals:
        activities.append({
            "id": proposal.id,
            "type": "proposal_update",
            "title": f"Updated proposal: {proposal.title}",
            "timestamp": proposal.updated_at.isoformat() if proposal.updated_at else proposal.created_at.isoformat(),
            "status": proposal.status
        })
    
    return activities