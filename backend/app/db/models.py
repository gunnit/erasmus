from sqlalchemy import Column, Integer, String, DateTime, Text, ForeignKey, JSON, Enum, Boolean
from sqlalchemy.orm import relationship
from datetime import datetime
import enum
import uuid
from .database import Base

class GenerationStatus(enum.Enum):
    PENDING = "pending"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    FAILED = "failed"
    CANCELLED = "cancelled"

class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    username = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    full_name = Column(String)
    organization = Column(String)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    proposals = relationship("Proposal", back_populates="owner", cascade="all, delete-orphan")

class Proposal(Base):
    __tablename__ = "proposals"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    title = Column(String, nullable=False)
    project_idea = Column(Text)
    priorities = Column(JSON)
    target_groups = Column(JSON)
    partners = Column(JSON)
    duration_months = Column(Integer)
    budget = Column(String)
    
    # Store all 27 answers as JSON
    answers = Column(JSON)

    # Workplan data (optional - may not exist in older databases)
    workplan = Column(JSON, nullable=True, default=None)

    # Metadata
    status = Column(String, default="draft")  # draft, submitted, approved, rejected
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    submitted_at = Column(DateTime)
    
    owner = relationship("User", back_populates="proposals")

class GenerationSession(Base):
    __tablename__ = "generation_sessions"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    
    # Generation status tracking
    status = Column(Enum(GenerationStatus), default=GenerationStatus.PENDING)
    current_section = Column(String)
    sections_order = Column(JSON, default=lambda: [
        "project_summary",
        "relevance", 
        "needs_analysis",
        "partnership",
        "impact",
        "project_management"
    ])
    completed_sections = Column(JSON, default=lambda: [])
    failed_sections = Column(JSON, default=lambda: [])
    
    # Project context
    project_context = Column(JSON, nullable=False)
    
    # Generated answers (partial or complete)
    answers = Column(JSON, default=lambda: {})
    
    # Progress tracking
    total_sections = Column(Integer, default=6)
    completed_count = Column(Integer, default=0)
    progress_percentage = Column(Integer, default=0)
    
    # Error handling
    error_message = Column(Text)
    retry_count = Column(Integer, default=0)
    max_retries = Column(Integer, default=3)
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    completed_at = Column(DateTime)
    
    # Relationships
    owner = relationship("User")