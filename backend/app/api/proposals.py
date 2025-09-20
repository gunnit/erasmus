from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime
import os
import tempfile
from app.db.database import get_db
from app.db.models import User, Proposal, Partner, PartnerType
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
    # Create the proposal
    db_proposal = Proposal(
        user_id=current_user.id,
        title=proposal_data.title,
        project_idea=proposal_data.project_idea,
        priorities=proposal_data.priorities,
        target_groups=proposal_data.target_groups,
        partners=proposal_data.partners,  # Keep JSON data for backward compatibility
        duration_months=proposal_data.duration_months,
        budget=proposal_data.budget,
        answers=proposal_data.answers,
        status="draft"
    )

    db.add(db_proposal)
    db.flush()  # Flush to get the proposal ID

    # Process library partner IDs if provided
    if proposal_data.library_partner_ids:
        existing_partners = db.query(Partner).filter(
            Partner.id.in_(proposal_data.library_partner_ids),
            Partner.user_id == current_user.id
        ).all()
        for partner in existing_partners:
            db_proposal.library_partners.append(partner)

    # Process partners - create or link them
    if proposal_data.partners:
        for partner_data in proposal_data.partners:
            # Check if partner already exists in library for this user
            existing_partner = db.query(Partner).filter(
                Partner.user_id == current_user.id,
                Partner.name == partner_data.get('name', ''),
                Partner.country == partner_data.get('country', '')
            ).first()

            if existing_partner:
                # Link existing partner to proposal if not already linked
                if existing_partner not in db_proposal.library_partners:
                    db_proposal.library_partners.append(existing_partner)
            else:
                # Create new partner in library
                partner_type_str = partner_data.get('type', 'NGO').upper()
                try:
                    partner_type = PartnerType[partner_type_str]
                except KeyError:
                    partner_type = PartnerType.NGO  # Default to NGO if invalid type

                new_partner = Partner(
                    user_id=current_user.id,
                    name=partner_data.get('name', ''),
                    type=partner_type,
                    country=partner_data.get('country', ''),
                    description=partner_data.get('role', ''),  # Use role as initial description
                    expertise_areas=[],
                    contact_info={}
                )
                db.add(new_partner)
                db.flush()

                # Link new partner to proposal
                db_proposal.library_partners.append(new_partner)

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
    from sqlalchemy.orm import joinedload

    proposal = db.query(Proposal).options(
        joinedload(Proposal.library_partners)
    ).filter(
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

    # Handle library partner IDs update
    if proposal_update.library_partner_ids is not None:
        # Clear existing partners
        proposal.library_partners.clear()

        # Add new partners
        if proposal_update.library_partner_ids:
            partners = db.query(Partner).filter(
                Partner.id.in_(proposal_update.library_partner_ids),
                Partner.user_id == current_user.id
            ).all()
            for partner in partners:
                proposal.library_partners.append(partner)

    # Update other fields if provided
    update_data = proposal_update.dict(exclude_unset=True, exclude={'library_partner_ids'})
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