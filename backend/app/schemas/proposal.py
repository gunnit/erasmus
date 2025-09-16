from pydantic import BaseModel
from typing import Optional, Dict, List, Any
from datetime import datetime

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

class Proposal(ProposalBase):
    id: int
    user_id: int
    answers: Optional[Dict[str, Any]] = None
    status: str
    created_at: datetime
    updated_at: datetime
    submitted_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True

class ProposalList(BaseModel):
    proposals: List[Proposal]
    total: int