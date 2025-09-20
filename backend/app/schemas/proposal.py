from pydantic import BaseModel
from typing import Optional, Dict, List, Any
from datetime import datetime

class PartnerSummary(BaseModel):
    """Minimal partner info for proposal display"""
    id: int
    name: str
    type: str
    country: Optional[str] = None
    description: Optional[str] = None
    affinity_score: Optional[float] = None

    class Config:
        from_attributes = True

class ProposalBase(BaseModel):
    title: str
    project_idea: Optional[str] = None
    priorities: Optional[List[str]] = None
    target_groups: Optional[List[str]] = None
    partners: Optional[List[Dict[str, Any]]] = None
    duration_months: Optional[int] = None
    budget: Optional[str] = None

class ProposalCreate(ProposalBase):
    answers: Optional[Dict[str, Any]] = None
    library_partner_ids: Optional[List[int]] = None  # IDs of existing partners to link

class ProposalUpdate(BaseModel):
    """Schema for updating proposals - all fields are optional"""
    title: Optional[str] = None
    project_idea: Optional[str] = None
    priorities: Optional[List[str]] = None
    target_groups: Optional[List[str]] = None
    partners: Optional[List[Dict[str, Any]]] = None
    duration_months: Optional[int] = None
    budget: Optional[str] = None
    answers: Optional[Dict[str, Any]] = None
    status: Optional[str] = None
    library_partner_ids: Optional[List[int]] = None  # IDs of partners to link/unlink

class Proposal(ProposalBase):
    id: int
    user_id: int
    answers: Optional[Dict[str, Any]] = None
    status: str
    created_at: datetime
    updated_at: datetime
    submitted_at: Optional[datetime] = None
    library_partners: Optional[List[PartnerSummary]] = []  # Linked partners from library

    class Config:
        from_attributes = True

class ProposalList(BaseModel):
    proposals: List[Proposal]
    total: int