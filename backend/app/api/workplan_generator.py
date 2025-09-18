from fastapi import APIRouter, HTTPException, Depends, BackgroundTasks
from sqlalchemy.orm import Session
from typing import Dict, Any, Optional
import logging
from datetime import datetime

from app.db.database import get_db
from app.db.models import User, Proposal
from app.api.dependencies import get_current_user
from app.core.subscription_deps import require_valid_subscription
from app.services.workplan_service import WorkplanService
from app.schemas.workplan import WorkplanCreate, WorkplanResponse, WorkplanUpdate

logger = logging.getLogger(__name__)

router = APIRouter(
    prefix="/api/form/workplan",
    tags=["workplan"]
)

@router.post("/generate", response_model=WorkplanResponse)
async def generate_workplan(
    data: WorkplanCreate,
    current_user: User = Depends(require_valid_subscription),
    db: Session = Depends(get_db)
):
    """
    Generate a complete workplan for a proposal
    """
    try:
        # Get the proposal
        proposal = db.query(Proposal).filter(
            Proposal.id == data.proposal_id,
            Proposal.user_id == current_user.id
        ).first()

        if not proposal:
            raise HTTPException(status_code=404, detail="Proposal not found")

        # Initialize the workplan service
        service = WorkplanService()

        # Prepare project context
        project_context = {
            "title": proposal.title,
            "project_idea": proposal.project_idea,
            "duration_months": proposal.duration_months or 24,
            "budget_eur": int(proposal.budget) if proposal.budget else 250000,
            "lead_organization": proposal.partners[0] if proposal.partners else {
                "name": "Lead Organization",
                "type": "NGO",
                "country": "",
                "city": "",
                "experience": ""
            },
            "partner_organizations": proposal.partners[1:] if proposal.partners and len(proposal.partners) > 1 else [],
            "selected_priorities": proposal.priorities or [],
            "target_groups": proposal.target_groups or []
        }

        # Generate the workplan
        workplan = await service.generate_workplan(
            project_context=project_context,
            answers=proposal.answers or {},
            form_questions=data.form_questions
        )

        # Save the workplan to the proposal
        proposal.workplan = workplan
        proposal.updated_at = datetime.utcnow()
        db.commit()

        logger.info(f"Generated workplan for proposal {proposal.id}")

        return {
            "success": True,
            "workplan": workplan,
            "proposal_id": proposal.id,
            "message": "Workplan generated successfully"
        }

    except Exception as e:
        logger.error(f"Failed to generate workplan: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to generate workplan: {str(e)}"
        )

@router.get("/{proposal_id}", response_model=WorkplanResponse)
async def get_workplan(
    proposal_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get the workplan for a specific proposal
    """
    proposal = db.query(Proposal).filter(
        Proposal.id == proposal_id,
        Proposal.user_id == current_user.id
    ).first()

    if not proposal:
        raise HTTPException(status_code=404, detail="Proposal not found")

    if not proposal.workplan:
        raise HTTPException(status_code=404, detail="No workplan found for this proposal")

    return {
        "success": True,
        "workplan": proposal.workplan,
        "proposal_id": proposal.id
    }

@router.put("/{proposal_id}", response_model=WorkplanResponse)
async def update_workplan(
    proposal_id: int,
    updates: WorkplanUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Update an existing workplan
    """
    try:
        proposal = db.query(Proposal).filter(
            Proposal.id == proposal_id,
            Proposal.user_id == current_user.id
        ).first()

        if not proposal:
            raise HTTPException(status_code=404, detail="Proposal not found")

        if not proposal.workplan:
            raise HTTPException(status_code=404, detail="No workplan found for this proposal")

        # Update the workplan
        service = WorkplanService()
        updated_workplan = await service.update_workplan(
            proposal.workplan,
            updates.dict(exclude_unset=True)
        )

        # Save the updated workplan
        proposal.workplan = updated_workplan
        proposal.updated_at = datetime.utcnow()
        db.commit()

        logger.info(f"Updated workplan for proposal {proposal.id}")

        return {
            "success": True,
            "workplan": updated_workplan,
            "proposal_id": proposal.id,
            "message": "Workplan updated successfully"
        }

    except Exception as e:
        logger.error(f"Failed to update workplan: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to update workplan: {str(e)}"
        )

@router.delete("/{proposal_id}")
async def delete_workplan(
    proposal_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Delete the workplan for a proposal
    """
    proposal = db.query(Proposal).filter(
        Proposal.id == proposal_id,
        Proposal.user_id == current_user.id
    ).first()

    if not proposal:
        raise HTTPException(status_code=404, detail="Proposal not found")

    proposal.workplan = None
    proposal.updated_at = datetime.utcnow()
    db.commit()

    return {"success": True, "message": "Workplan deleted successfully"}

@router.get("/template/structure")
async def get_workplan_template():
    """
    Get the standard workplan template structure
    """
    template = {
        "work_packages": [
            {
                "id": "WP1",
                "title": "Project Management",
                "lead_partner": "",
                "objectives": [],
                "start_month": 1,
                "end_month": 24,
                "activities": [
                    {
                        "id": "A1.1",
                        "name": "",
                        "description": "",
                        "responsible": "",
                        "start_month": 1,
                        "end_month": 1
                    }
                ],
                "deliverables": [
                    {
                        "id": "D1.1",
                        "title": "",
                        "description": "",
                        "due_month": 2,
                        "responsible": ""
                    }
                ],
                "effort_pm": 0
            }
        ],
        "timeline": {
            "gantt_data": [],
            "milestones": [],
            "critical_path": []
        },
        "partner_allocation": {},
        "metadata": {
            "total_duration_months": 24,
            "total_work_packages": 5,
            "total_deliverables": 0
        }
    }

    return {
        "success": True,
        "template": template,
        "guidelines": {
            "max_work_packages": 5,
            "mandatory_wp1": "Project Management",
            "recommended_structure": [
                "WP1: Project Management",
                "WP2: Research/Analysis",
                "WP3: Development/Implementation",
                "WP4: Quality Assurance",
                "WP5: Dissemination"
            ]
        }
    }