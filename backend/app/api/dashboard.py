from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func, extract
from app.db.database import get_db
from app.db.models import User, Proposal, Partner
from app.api.dependencies import get_current_user
from datetime import datetime, timedelta
from typing import Dict, List, Any
import json
from collections import defaultdict

router = APIRouter(prefix="/dashboard", tags=["dashboard"])

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
    
    # Calculate total budget (handle string budget field)
    proposals_with_budget = db.query(Proposal.budget).filter(
        Proposal.user_id == current_user.id,
        Proposal.budget.isnot(None)
    ).all()
    
    total_budget = 0
    for proposal in proposals_with_budget:
        try:
            # Try to convert string budget to float
            budget_value = float(str(proposal.budget).replace(',', '').replace('€', ''))
            total_budget += budget_value
        except (ValueError, AttributeError):
            pass
    
    # Calculate success rate
    completed = approved_proposals + rejected_proposals
    success_rate = int((approved_proposals / completed * 100)) if completed > 0 else 0
    
    # Get average duration
    avg_duration = db.query(func.avg(Proposal.duration_months)).filter(
        Proposal.user_id == current_user.id
    ).scalar() or 24
    
    # Count actual partners from the partners table
    total_partners = db.query(Partner).filter(Partner.user_id == current_user.id).count()
    
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
            "organization": current_user.organization,
            "is_admin": getattr(current_user, 'is_admin', False)
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

@router.get("/budget-metrics")
async def get_budget_metrics(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    months: int = 12  # Default to last 12 months
):
    """
    Get budget metrics aggregated by quarter or month
    """
    # Calculate date range
    end_date = datetime.utcnow()
    start_date = end_date - timedelta(days=months * 30)

    # Get all proposals within date range
    proposals = db.query(Proposal).filter(
        Proposal.user_id == current_user.id,
        Proposal.created_at >= start_date
    ).all()

    # Aggregate by quarter
    quarterly_data = defaultdict(lambda: {"budget": 0, "spent": 0, "proposals": 0})

    for proposal in proposals:
        # Determine quarter
        month = proposal.created_at.month
        year = proposal.created_at.year
        quarter = f"Q{((month - 1) // 3) + 1} {year}"

        # Parse budget
        try:
            budget_value = float(str(proposal.budget or 0).replace(',', '').replace('€', ''))
            quarterly_data[quarter]["budget"] += budget_value
            quarterly_data[quarter]["proposals"] += 1

            # "Spent" is budget for approved/submitted proposals
            if proposal.status in ["approved", "submitted"]:
                quarterly_data[quarter]["spent"] += budget_value
        except (ValueError, AttributeError):
            pass

    # Convert to list format for chart
    chart_data = []
    for quarter in sorted(quarterly_data.keys()):
        chart_data.append({
            "name": quarter,
            "budget": int(quarterly_data[quarter]["budget"]),
            "spent": int(quarterly_data[quarter]["spent"]),
            "proposals": quarterly_data[quarter]["proposals"]
        })

    # If no data, provide example quarters
    if not chart_data:
        current_year = datetime.utcnow().year
        chart_data = [
            {"name": f"Q1 {current_year}", "budget": 0, "spent": 0, "proposals": 0},
            {"name": f"Q2 {current_year}", "budget": 0, "spent": 0, "proposals": 0},
            {"name": f"Q3 {current_year}", "budget": 0, "spent": 0, "proposals": 0},
            {"name": f"Q4 {current_year}", "budget": 0, "spent": 0, "proposals": 0}
        ]

    return {
        "data": chart_data[-4:],  # Return last 4 quarters
        "total_budget": sum(d["budget"] for d in chart_data),
        "total_spent": sum(d["spent"] for d in chart_data)
    }

@router.get("/priority-metrics")
async def get_priority_metrics(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get distribution of EU priorities across proposals
    """
    # Get all proposals with priorities
    proposals = db.query(Proposal.priorities).filter(
        Proposal.user_id == current_user.id,
        Proposal.priorities.isnot(None)
    ).all()

    # Count priority occurrences
    priority_counts = defaultdict(int)
    total_priorities = 0

    # EU Priority mapping
    priority_names = {
        "DIGITAL": "Digital Transformation",
        "GREEN": "Green Transition",
        "INCLUSION": "Social Inclusion",
        "PARTICIPATION": "Democratic Participation",
        "ADULT_SKILLS": "Adult Skills",
        "CREATIVITY": "Creativity & Culture"
    }

    # Priority colors for consistency
    priority_colors = {
        "Digital Transformation": "#3B82F6",
        "Green Transition": "#10B981",
        "Social Inclusion": "#8B5CF6",
        "Democratic Participation": "#F59E0B",
        "Adult Skills": "#EF4444",
        "Creativity & Culture": "#EC4899"
    }

    for proposal in proposals:
        try:
            priorities = proposal.priorities
            if isinstance(priorities, str):
                priorities = json.loads(priorities)

            if isinstance(priorities, list):
                for priority in priorities:
                    # Map to friendly name
                    friendly_name = priority_names.get(priority, priority)
                    priority_counts[friendly_name] += 1
                    total_priorities += 1
        except (json.JSONDecodeError, TypeError):
            pass

    # Convert to percentage-based format for pie chart
    chart_data = []
    if total_priorities > 0:
        for priority, count in priority_counts.items():
            percentage = round((count / total_priorities) * 100)
            chart_data.append({
                "name": priority.split()[0],  # Shorten name for chart
                "value": percentage,
                "color": priority_colors.get(priority, "#6B7280"),
                "count": count,
                "fullName": priority
            })
    else:
        # Default data if no priorities found
        chart_data = [
            {"name": "Digital", "value": 35, "color": "#3B82F6", "count": 0, "fullName": "Digital Transformation"},
            {"name": "Inclusion", "value": 30, "color": "#8B5CF6", "count": 0, "fullName": "Social Inclusion"},
            {"name": "Green", "value": 20, "color": "#10B981", "count": 0, "fullName": "Green Transition"},
            {"name": "Democracy", "value": 15, "color": "#F59E0B", "count": 0, "fullName": "Democratic Participation"}
        ]

    # Sort by value descending
    chart_data.sort(key=lambda x: x["value"], reverse=True)

    return {
        "data": chart_data[:6],  # Top 6 priorities
        "total_proposals": len(proposals),
        "total_priorities": total_priorities
    }

@router.get("/performance-metrics")
async def get_performance_metrics(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    months: int = 6  # Default to last 6 months
):
    """
    Get monthly proposal submission and approval trends
    """
    # Calculate date range
    end_date = datetime.utcnow()
    start_date = end_date - timedelta(days=months * 30)

    # Get all proposals within date range
    proposals = db.query(Proposal).filter(
        Proposal.user_id == current_user.id,
        Proposal.created_at >= start_date
    ).all()

    # Aggregate by month
    monthly_data = defaultdict(lambda: {
        "proposals": 0,
        "approved": 0,
        "submitted": 0,
        "rejected": 0,
        "draft": 0
    })

    month_names = ["Jan", "Feb", "Mar", "Apr", "May", "Jun",
                   "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]

    for proposal in proposals:
        month_year = f"{month_names[proposal.created_at.month - 1]} {proposal.created_at.year}"
        monthly_data[month_year]["proposals"] += 1

        # Count by status
        status = proposal.status or "draft"
        if status == "approved":
            monthly_data[month_year]["approved"] += 1
        elif status == "submitted":
            monthly_data[month_year]["submitted"] += 1
        elif status == "rejected":
            monthly_data[month_year]["rejected"] += 1
        else:
            monthly_data[month_year]["draft"] += 1

    # Generate complete month list for continuity
    chart_data = []
    current_date = start_date

    while current_date <= end_date:
        month_key = f"{month_names[current_date.month - 1]} {current_date.year}"

        data_point = {
            "month": month_names[current_date.month - 1][:3],
            "proposals": monthly_data[month_key]["proposals"],
            "approved": monthly_data[month_key]["approved"],
            "submitted": monthly_data[month_key]["submitted"],
            "rejected": monthly_data[month_key]["rejected"]
        }
        chart_data.append(data_point)

        # Move to next month
        if current_date.month == 12:
            current_date = current_date.replace(year=current_date.year + 1, month=1)
        else:
            current_date = current_date.replace(month=current_date.month + 1)

    # If no data, provide sample months
    if not any(d["proposals"] > 0 for d in chart_data):
        current_month = datetime.utcnow().month
        chart_data = []
        for i in range(6):
            month_idx = (current_month - 6 + i) % 12
            chart_data.append({
                "month": month_names[month_idx][:3],
                "proposals": 0,
                "approved": 0,
                "submitted": 0,
                "rejected": 0
            })

    return {
        "data": chart_data[-6:],  # Return last 6 months
        "total_proposals": sum(d["proposals"] for d in chart_data),
        "total_approved": sum(d["approved"] for d in chart_data),
        "approval_rate": round(
            (sum(d["approved"] for d in chart_data) / max(sum(d["proposals"] for d in chart_data), 1)) * 100, 1
        )
    }