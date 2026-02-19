from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func, extract
from datetime import datetime, timedelta
from typing import Dict, Any, List
from collections import defaultdict

from app.db.database import get_db
from app.db.models import User, Proposal, Partner
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
    
    total_budget = 0
    for p in proposals:
        try:
            total_budget += float(str(p.budget or "0").replace(",", "").replace("\u20ac", ""))
        except (ValueError, AttributeError):
            pass
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
    
    # Aggregate real proposal data by month
    month_names = ["Jan", "Feb", "Mar", "Apr", "May", "Jun",
                   "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]

    monthly_proposals = defaultdict(lambda: {"count": 0, "approved": 0})
    monthly_budget = defaultdict(lambda: {"allocated": 0, "spent": 0})

    for p in proposals:
        month_key = month_names[p.created_at.month - 1]
        monthly_proposals[month_key]["count"] += 1
        if p.status == "approved":
            monthly_proposals[month_key]["approved"] += 1

        # Parse budget
        try:
            budget_val = float(str(p.budget or "0").replace(",", "").replace("\u20ac", ""))
            monthly_budget[month_key]["allocated"] += budget_val
            if p.status in ("approved", "submitted"):
                monthly_budget[month_key]["spent"] += budget_val
        except (ValueError, AttributeError):
            pass

    # Build ordered trend arrays covering the date range
    proposal_trends = []
    budget_trends = []

    current = start_date
    seen_months = set()
    while current <= end_date:
        m = month_names[current.month - 1]
        if m not in seen_months:
            seen_months.add(m)
            proposal_trends.append({
                "month": m,
                "count": monthly_proposals[m]["count"],
                "approved": monthly_proposals[m]["approved"]
            })
            budget_trends.append({
                "month": m,
                "allocated": int(monthly_budget[m]["allocated"]),
                "spent": int(monthly_budget[m]["spent"])
            })
        current += timedelta(days=period_days)

    # If no data, return empty arrays rather than fake data
    trends = {
        "proposals": proposal_trends,
        "budget": budget_trends
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
    
    # Query real partner country distribution from the partners table
    partners = db.query(Partner).filter(Partner.user_id == current_user.id).all()

    country_counts = defaultdict(int)
    for partner in partners:
        country = partner.country or "Unknown"
        country_counts[country] += 1

    # Sort by count descending, keep top 5 and group rest as "Others"
    sorted_countries = sorted(country_counts.items(), key=lambda x: x[1], reverse=True)
    result = []
    others_count = 0

    for i, (country, count) in enumerate(sorted_countries):
        if i < 5:
            result.append({"country": country, "partners": count})
        else:
            others_count += count

    if others_count > 0:
        result.append({"country": "Others", "partners": others_count})

    return result

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

@router.get("/public-stats")
async def get_public_stats(db: Session = Depends(get_db)) -> Dict[str, Any]:
    """
    Get public platform statistics for homepage (no authentication required)

    This endpoint is public and can be accessed without a token.
    Path: /api/analytics/public-stats
    """
    import logging
    logger = logging.getLogger(__name__)

    try:
        # Calculate aggregate platform statistics
        total_proposals = db.query(func.count(Proposal.id)).scalar() or 0
        total_users = db.query(func.count(User.id)).scalar() or 0

        # Calculate completed proposals (status = 'submitted' or 'complete')
        completed_proposals = db.query(func.count(Proposal.id)).filter(
            Proposal.status.in_(['submitted', 'complete'])
        ).scalar() or 0

        # Calculate average time saved (based on completed proposals)
        # Assumption: Manual application takes 40-60 hours, AI takes 0.5 hours
        # Average time saved per proposal: 50 hours
        hours_saved = completed_proposals * 50

        # Calculate success rate (proposals submitted vs total)
        success_rate = round((completed_proposals / total_proposals * 100), 1) if total_proposals > 0 else 0

        result = {
            "hours_saved": hours_saved,
            "proposals_generated": total_proposals,
            "success_rate": success_rate,
            "total_users": total_users,
            "completed_proposals": completed_proposals
        }

        logger.info(f"Public stats requested: {result}")
        return result

    except Exception as e:
        logger.error(f"Error fetching public stats: {str(e)}")
        # Return default values on error instead of failing
        return {
            "hours_saved": 0,
            "proposals_generated": 0,
            "success_rate": 0,
            "total_users": 0,
            "completed_proposals": 0
        }