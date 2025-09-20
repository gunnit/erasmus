from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime

class PartnerBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=200)
    type: str = Field(..., description="Partner type: NGO, PUBLIC_INSTITUTION, etc.")
    country: Optional[str] = Field(None, max_length=100)
    website: Optional[str] = Field(None, max_length=500)
    description: Optional[str] = None
    expertise_areas: Optional[List[str]] = []
    contact_info: Optional[Dict[str, Any]] = {}

class PartnerCreate(PartnerBase):
    pass

class PartnerUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=200)
    type: Optional[str] = None
    country: Optional[str] = Field(None, max_length=100)
    website: Optional[str] = Field(None, max_length=500)
    description: Optional[str] = None
    expertise_areas: Optional[List[str]] = None
    contact_info: Optional[Dict[str, Any]] = None

class PartnerResponse(PartnerBase):
    id: int
    user_id: int
    affinity_score: Optional[float] = None
    affinity_explanation: Optional[str] = None
    crawled_data: Optional[Dict[str, Any]] = None
    last_crawled: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class PartnerListResponse(BaseModel):
    partners: List[PartnerResponse]
    total: int
    page: int
    per_page: int
    total_pages: int

class PartnerAffinityRequest(BaseModel):
    project_context: Dict[str, Any]

class PartnerAffinityResponse(BaseModel):
    partner_id: int
    score: float
    explanation: str
    factors: Optional[List[Dict[str, Any]]] = []