from fastapi import APIRouter, HTTPException, status, Depends
from typing import List, Dict, Any
from datetime import datetime
from app.db.neo4j_models import ProposalNode, PriorityNode
from app.schemas.proposal import ProposalCreate, ProposalUpdate, Proposal as ProposalSchema, ProposalList
from app.api.dependencies import get_current_user_neo4j
import logging
import json

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/proposals", tags=["proposals"])

@router.post("/", response_model=ProposalSchema)
async def create_proposal(
    proposal_data: ProposalCreate,
    current_user: dict = Depends(get_current_user_neo4j)
):
    try:
        # Prepare project data
        project_data = {
            'project_title': proposal_data.title,
            'project_acronym': proposal_data.project_idea[:10] if proposal_data.project_idea else '',
            'organization_name': current_user.get('organization', ''),
            'organization_type': 'NGO',
            'country': 'Romania',
            'project_duration': proposal_data.duration_months,
            'total_budget': proposal_data.budget,
            'grant_requested': int(proposal_data.budget * 0.8) if proposal_data.budget else 0,
            'target_groups': proposal_data.target_groups,
            'main_activities': proposal_data.project_idea,
            'expected_results': 'To be defined',
            'status': 'draft'
        }
        
        # Create proposal
        proposal = ProposalNode.create_proposal(
            user_id=current_user['id'],
            title=proposal_data.title,
            project_data=project_data
        )
        
        if not proposal:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to create proposal"
            )
        
        # Link to priorities if provided
        if proposal_data.priorities:
            ProposalNode.link_proposal_to_priorities(proposal['id'], proposal_data.priorities)
        
        # Save initial answers if provided
        if proposal_data.answers:
            ProposalNode.save_answers(proposal['id'], proposal_data.answers)
        
        return ProposalSchema(
            id=proposal['id'],
            user_id=current_user['id'],
            title=proposal['title'],
            project_idea=project_data['main_activities'],
            priorities=proposal_data.priorities or [],
            target_groups=proposal_data.target_groups or [],
            partners=proposal_data.partners or [],
            duration_months=proposal_data.duration_months,
            budget=proposal_data.budget,
            answers=proposal_data.answers or {},
            status=proposal['status'],
            created_at=proposal.get('created_at', datetime.utcnow()),
            updated_at=proposal.get('updated_at', datetime.utcnow())
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creating proposal: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create proposal"
        )

@router.get("/", response_model=ProposalList)
async def get_user_proposals(
    current_user: dict = Depends(get_current_user_neo4j),
    skip: int = 0,
    limit: int = 10
):
    try:
        proposals = ProposalNode.get_user_proposals(current_user['id'])
        
        # Convert to schema format
        proposal_list = []
        for p in proposals[skip:skip+limit]:
            # Get answers for each proposal
            answers = ProposalNode.get_proposal_answers(p['id'])
            
            proposal_list.append(ProposalSchema(
                id=p['id'],
                user_id=current_user['id'],
                title=p['title'],
                project_idea=p.get('main_activities', ''),
                priorities=[],  # Would need to fetch from relationships
                target_groups=p.get('target_groups', []),
                partners=[],
                duration_months=p.get('project_duration', 24),
                budget=p.get('total_budget', 0),
                answers=answers,
                status=p.get('status', 'draft'),
                created_at=p.get('created_at', datetime.utcnow()),
                updated_at=p.get('updated_at', datetime.utcnow())
            ))
        
        return ProposalList(proposals=proposal_list, total=len(proposals))
        
    except Exception as e:
        logger.error(f"Error fetching proposals: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch proposals"
        )

@router.get("/{proposal_id}", response_model=ProposalSchema)
async def get_proposal(
    proposal_id: str,
    current_user: dict = Depends(get_current_user_neo4j)
):
    try:
        proposal = ProposalNode.get_proposal_by_id(proposal_id, current_user['id'])
        
        if not proposal:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Proposal not found"
            )
        
        # Get answers
        answers = ProposalNode.get_proposal_answers(proposal_id)
        
        return ProposalSchema(
            id=proposal['id'],
            user_id=current_user['id'],
            title=proposal['title'],
            project_idea=proposal.get('main_activities', ''),
            priorities=[],  # Would need to fetch from relationships
            target_groups=proposal.get('target_groups', []),
            partners=[],
            duration_months=proposal.get('project_duration', 24),
            budget=proposal.get('total_budget', 0),
            answers=answers,
            status=proposal.get('status', 'draft'),
            created_at=proposal.get('created_at', datetime.utcnow()),
            updated_at=proposal.get('updated_at', datetime.utcnow())
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching proposal: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch proposal"
        )

@router.put("/{proposal_id}", response_model=ProposalSchema)
async def update_proposal(
    proposal_id: str,
    proposal_update: ProposalUpdate,
    current_user: dict = Depends(get_current_user_neo4j)
):
    try:
        # Check proposal exists
        existing = ProposalNode.get_proposal_by_id(proposal_id, current_user['id'])
        if not existing:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Proposal not found"
            )
        
        # Prepare updates
        updates = {}
        if proposal_update.title is not None:
            updates['title'] = proposal_update.title
        if proposal_update.project_idea is not None:
            updates['main_activities'] = proposal_update.project_idea
        if proposal_update.target_groups is not None:
            updates['target_groups'] = proposal_update.target_groups
        if proposal_update.duration_months is not None:
            updates['project_duration'] = proposal_update.duration_months
        if proposal_update.budget is not None:
            updates['total_budget'] = proposal_update.budget
            updates['grant_requested'] = int(proposal_update.budget * 0.8)
        if proposal_update.status is not None:
            updates['status'] = proposal_update.status
        
        # Include answers in updates if provided
        if proposal_update.answers is not None:
            updates['answers'] = proposal_update.answers
        
        # Update proposal
        updated_proposal = ProposalNode.update_proposal(proposal_id, current_user['id'], updates)
        
        if not updated_proposal:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to update proposal"
            )
        
        # Update priority links if provided
        if proposal_update.priorities is not None:
            ProposalNode.link_proposal_to_priorities(proposal_id, proposal_update.priorities)
        
        # Get final answers
        answers = ProposalNode.get_proposal_answers(proposal_id)
        
        return ProposalSchema(
            id=updated_proposal['id'],
            user_id=current_user['id'],
            title=updated_proposal['title'],
            project_idea=updated_proposal.get('main_activities', ''),
            priorities=proposal_update.priorities or [],
            target_groups=updated_proposal.get('target_groups', []),
            partners=proposal_update.partners or [],
            duration_months=updated_proposal.get('project_duration', 24),
            budget=updated_proposal.get('total_budget', 0),
            answers=answers,
            status=updated_proposal.get('status', 'draft'),
            created_at=updated_proposal.get('created_at', datetime.utcnow()),
            updated_at=updated_proposal.get('updated_at', datetime.utcnow())
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating proposal: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update proposal"
        )

@router.delete("/{proposal_id}")
async def delete_proposal(
    proposal_id: str,
    current_user: dict = Depends(get_current_user_neo4j)
):
    try:
        success = ProposalNode.delete_proposal(proposal_id, current_user['id'])
        
        if not success:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Proposal not found"
            )
        
        return {"message": "Proposal deleted successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting proposal: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to delete proposal"
        )

@router.post("/{proposal_id}/submit")
async def submit_proposal(
    proposal_id: str,
    current_user: dict = Depends(get_current_user_neo4j)
):
    try:
        # Update status to submitted
        updates = {
            'status': 'submitted',
            'submitted_at': datetime.utcnow()
        }
        
        updated_proposal = ProposalNode.update_proposal(proposal_id, current_user['id'], updates)
        
        if not updated_proposal:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Proposal not found"
            )
        
        return {"message": "Proposal submitted successfully", "proposal_id": proposal_id}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error submitting proposal: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to submit proposal"
        )