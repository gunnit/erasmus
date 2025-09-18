from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime
import os
import tempfile
from app.db.database import get_db
from app.db.models import User, Proposal
from app.schemas.proposal import ProposalCreate, ProposalUpdate, Proposal as ProposalSchema, ProposalList
from app.api.dependencies import get_current_user
from app.services.pdf_generator import ProposalPDFGenerator

router = APIRouter(prefix="/proposals", tags=["proposals"])

@router.post("/", response_model=ProposalSchema)
async def create_proposal(
    proposal_data: ProposalCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    db_proposal = Proposal(
        user_id=current_user.id,
        title=proposal_data.title,
        project_idea=proposal_data.project_idea,
        priorities=proposal_data.priorities,
        target_groups=proposal_data.target_groups,
        partners=proposal_data.partners,
        duration_months=proposal_data.duration_months,
        budget=proposal_data.budget,
        answers=proposal_data.answers,
        status="draft"
    )
    
    db.add(db_proposal)
    db.commit()
    db.refresh(db_proposal)
    
    return db_proposal

@router.get("/", response_model=ProposalList)
async def get_user_proposals(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    skip: int = 0,
    limit: int = 10
):
    proposals = db.query(Proposal).filter(
        Proposal.user_id == current_user.id
    ).offset(skip).limit(limit).all()
    
    total = db.query(Proposal).filter(Proposal.user_id == current_user.id).count()
    
    return ProposalList(proposals=proposals, total=total)

@router.get("/{proposal_id}", response_model=ProposalSchema)
async def get_proposal(
    proposal_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    proposal = db.query(Proposal).filter(
        Proposal.id == proposal_id,
        Proposal.user_id == current_user.id
    ).first()
    
    if not proposal:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Proposal not found"
        )
    
    return proposal

@router.put("/{proposal_id}", response_model=ProposalSchema)
async def update_proposal(
    proposal_id: int,
    proposal_update: ProposalUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    proposal = db.query(Proposal).filter(
        Proposal.id == proposal_id,
        Proposal.user_id == current_user.id
    ).first()
    
    if not proposal:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Proposal not found"
        )
    
    # Update fields if provided
    update_data = proposal_update.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(proposal, field, value)
    
    proposal.updated_at = datetime.utcnow()
    
    db.commit()
    db.refresh(proposal)
    
    return proposal

@router.delete("/{proposal_id}")
async def delete_proposal(
    proposal_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    proposal = db.query(Proposal).filter(
        Proposal.id == proposal_id,
        Proposal.user_id == current_user.id
    ).first()
    
    if not proposal:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Proposal not found"
        )
    
    db.delete(proposal)
    db.commit()
    
    return {"message": "Proposal deleted successfully"}

@router.post("/{proposal_id}/submit")
async def submit_proposal(
    proposal_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    proposal = db.query(Proposal).filter(
        Proposal.id == proposal_id,
        Proposal.user_id == current_user.id
    ).first()
    
    if not proposal:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Proposal not found"
        )
    
    proposal.status = "submitted"
    proposal.submitted_at = datetime.utcnow()
    
    db.commit()
    db.refresh(proposal)
    
    return {"message": "Proposal submitted successfully", "proposal_id": proposal.id}

@router.get("/{proposal_id}/pdf")
async def export_proposal_pdf(
    proposal_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Export proposal with workplan as PDF
    """
    proposal = db.query(Proposal).filter(
        Proposal.id == proposal_id,
        Proposal.user_id == current_user.id
    ).first()

    if not proposal:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Proposal not found"
        )

    # Generate PDF
    pdf_generator = ProposalPDFGenerator()
    pdf_path = await pdf_generator.generate_proposal_pdf(proposal)

    if not os.path.exists(pdf_path):
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to generate PDF"
        )

    return FileResponse(
        pdf_path,
        media_type='application/pdf',
        filename=f"{proposal.title.replace(' ', '_').lower()}_proposal.pdf"
    )