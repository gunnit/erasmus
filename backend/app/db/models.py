from sqlalchemy import Column, Integer, String, DateTime, Text, ForeignKey, JSON, Enum, Boolean, Float, Numeric
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

class SubscriptionPlan(enum.Enum):
    STARTER = "starter"
    PROFESSIONAL = "professional"

class PaymentStatus(enum.Enum):
    PENDING = "pending"
    COMPLETED = "completed"
    FAILED = "failed"
    REFUNDED = "refunded"

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    username = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    full_name = Column(String)
    organization = Column(String)

    # Subscription fields
    subscription_plan = Column(Enum(SubscriptionPlan), nullable=True)
    proposals_remaining = Column(Integer, default=0)
    subscription_expires_at = Column(DateTime, nullable=True)
    subscription_started_at = Column(DateTime, nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    proposals = relationship("Proposal", back_populates="owner", cascade="all, delete-orphan")
    payments = relationship("Payment", back_populates="user", cascade="all, delete-orphan")
    subscription = relationship("Subscription", back_populates="user", uselist=False)

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

    # Quality scoring fields
    quality_score = Column(Float, nullable=True)
    section_scores = Column(JSON, nullable=True)
    quality_feedback = Column(JSON, nullable=True)
    score_calculated_at = Column(DateTime, nullable=True)

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

class Subscription(Base):
    __tablename__ = "subscriptions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True, nullable=False)

    # Plan details
    plan_type = Column(Enum(SubscriptionPlan), nullable=False)
    proposals_limit = Column(Integer, nullable=False)
    proposals_used = Column(Integer, default=0)

    # Pricing
    amount_paid = Column(Numeric(10, 2), nullable=False)
    currency = Column(String, default="EUR")

    # Dates
    started_at = Column(DateTime, default=datetime.utcnow)
    expires_at = Column(DateTime, nullable=False)
    cancelled_at = Column(DateTime, nullable=True)

    # Status
    is_active = Column(Boolean, default=True)
    auto_renew = Column(Boolean, default=False)

    # PayPal reference
    paypal_subscription_id = Column(String, nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    user = relationship("User", back_populates="subscription")

class Payment(Base):
    __tablename__ = "payments"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    subscription_id = Column(Integer, ForeignKey("subscriptions.id"), nullable=True)

    # Payment details
    amount = Column(Numeric(10, 2), nullable=False)
    currency = Column(String, default="EUR")
    status = Column(Enum(PaymentStatus), default=PaymentStatus.PENDING)

    # PayPal details
    paypal_order_id = Column(String, unique=True, nullable=False)
    paypal_capture_id = Column(String, nullable=True)
    paypal_payer_id = Column(String, nullable=True)
    paypal_payer_email = Column(String, nullable=True)

    # Payment metadata
    payment_method = Column(String, default="paypal")
    description = Column(String)
    payment_metadata = Column(JSON, nullable=True)

    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    completed_at = Column(DateTime, nullable=True)
    refunded_at = Column(DateTime, nullable=True)

    user = relationship("User", back_populates="payments")