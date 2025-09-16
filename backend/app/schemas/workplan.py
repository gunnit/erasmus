from pydantic import BaseModel
from typing import Dict, List, Optional, Any
from datetime import datetime

class Activity(BaseModel):
    id: str
    name: str
    description: Optional[str] = None
    responsible: str
    start_month: int
    end_month: int

class Deliverable(BaseModel):
    id: str
    title: str
    description: Optional[str] = None
    due_month: int
    responsible: str

class WorkPackage(BaseModel):
    id: str
    title: str
    lead_partner: str
    objectives: List[str]
    start_month: int
    end_month: int
    activities: List[Activity]
    deliverables: List[Deliverable]
    effort_pm: float  # person-months

class Milestone(BaseModel):
    id: str
    title: str
    month: int
    work_package: str

class GanttItem(BaseModel):
    id: str
    name: str
    start: int
    end: int
    type: str  # work_package, activity, milestone
    parent: Optional[str] = None
    progress: Optional[float] = 0

class Timeline(BaseModel):
    gantt_data: List[GanttItem]
    milestones: List[Milestone]
    critical_path: List[str]

class WorkplanMetadata(BaseModel):
    generated_at: Optional[str] = None
    updated_at: Optional[str] = None
    total_duration_months: int
    total_work_packages: int
    total_deliverables: int

class Workplan(BaseModel):
    work_packages: List[WorkPackage]
    timeline: Timeline
    partner_allocation: Dict[str, Dict[str, float]]
    metadata: WorkplanMetadata

class WorkplanCreate(BaseModel):
    proposal_id: int
    form_questions: Optional[Dict] = None
    regenerate: Optional[bool] = False

class WorkplanUpdate(BaseModel):
    work_packages: Optional[List[Dict]] = None
    timeline: Optional[Dict] = None
    partner_allocation: Optional[Dict[str, Dict[str, float]]] = None

class WorkplanResponse(BaseModel):
    success: bool
    workplan: Workplan
    proposal_id: int
    message: Optional[str] = None