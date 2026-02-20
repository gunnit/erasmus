"""Admin API endpoints for system management"""
from fastapi import APIRouter, HTTPException, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import text, func
from pydantic import BaseModel
from app.db.database import get_db
from app.api.dependencies import get_current_user, get_admin_user
from app.db.models import User, Proposal, Payment, Subscription, PaymentStatus
import logging
from datetime import datetime
from typing import Optional

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/admin", tags=["admin"])


# --- Pydantic models ---

class GrantCreditsRequest(BaseModel):
    amount: int
    note: Optional[str] = None


# --- Admin panel endpoints ---

@router.get("/stats")
async def get_admin_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_admin_user)
):
    """Get admin overview stats"""
    total_users = db.query(func.count(User.id)).scalar()
    total_proposals = db.query(func.count(Proposal.id)).scalar()
    active_subscriptions = db.query(func.count(Subscription.id)).filter(
        Subscription.is_active == True
    ).scalar()

    # Revenue: sum of completed payments
    revenue = db.query(func.sum(Payment.amount)).filter(
        Payment.status == PaymentStatus.COMPLETED
    ).scalar() or 0

    return {
        "total_users": total_users,
        "total_proposals": total_proposals,
        "total_revenue": float(revenue),
        "active_subscriptions": active_subscriptions,
    }


@router.get("/users")
async def get_admin_users(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_admin_user),
    search: Optional[str] = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
):
    """Get paginated user list with search"""
    query = db.query(User)

    if search:
        pattern = f"%{search}%"
        query = query.filter(
            (User.email.ilike(pattern))
            | (User.username.ilike(pattern))
            | (User.full_name.ilike(pattern))
            | (User.organization.ilike(pattern))
        )

    total = query.count()
    users = query.order_by(User.created_at.desc()).offset(skip).limit(limit).all()

    return {
        "users": [
            {
                "id": u.id,
                "email": u.email,
                "username": u.username,
                "full_name": u.full_name,
                "organization": u.organization,
                "is_admin": getattr(u, "is_admin", False),
                "subscription_plan": u.subscription_plan.value if u.subscription_plan else None,
                "proposals_remaining": u.proposals_remaining or 0,
                "created_at": u.created_at.isoformat() if u.created_at else None,
            }
            for u in users
        ],
        "total": total,
        "skip": skip,
        "limit": limit,
    }


@router.get("/users/{user_id}")
async def get_admin_user_detail(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_admin_user),
):
    """Get user detail with payment history and proposal count"""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    proposal_count = db.query(func.count(Proposal.id)).filter(Proposal.user_id == user_id).scalar()
    payments = (
        db.query(Payment)
        .filter(Payment.user_id == user_id)
        .order_by(Payment.created_at.desc())
        .all()
    )

    return {
        "id": user.id,
        "email": user.email,
        "username": user.username,
        "full_name": user.full_name,
        "organization": user.organization,
        "is_admin": getattr(user, "is_admin", False),
        "subscription_plan": user.subscription_plan.value if user.subscription_plan else None,
        "proposals_remaining": user.proposals_remaining or 0,
        "subscription_expires_at": user.subscription_expires_at.isoformat() if user.subscription_expires_at else None,
        "created_at": user.created_at.isoformat() if user.created_at else None,
        "proposal_count": proposal_count,
        "payments": [
            {
                "id": p.id,
                "amount": float(p.amount),
                "currency": p.currency,
                "status": p.status.value if p.status else None,
                "description": p.description,
                "created_at": p.created_at.isoformat() if p.created_at else None,
            }
            for p in payments
        ],
    }


@router.post("/users/{user_id}/grant-credits")
async def grant_credits(
    user_id: int,
    body: GrantCreditsRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_admin_user),
):
    """Add credits to a user's proposals_remaining"""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if body.amount <= 0:
        raise HTTPException(status_code=400, detail="Amount must be positive")

    old_remaining = user.proposals_remaining or 0
    user.proposals_remaining = old_remaining + body.amount
    db.commit()

    logger.info(
        f"Admin {current_user.email} granted {body.amount} credits to user {user.email} "
        f"(was {old_remaining}, now {user.proposals_remaining}). Note: {body.note}"
    )

    return {
        "success": True,
        "user_id": user.id,
        "email": user.email,
        "previous_credits": old_remaining,
        "added": body.amount,
        "new_credits": user.proposals_remaining,
    }


@router.get("/proposals")
async def get_admin_proposals(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_admin_user),
    search: Optional[str] = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
):
    """Get all proposals across all users, paginated"""
    query = db.query(Proposal).join(User, Proposal.user_id == User.id)

    if search:
        pattern = f"%{search}%"
        query = query.filter(
            (Proposal.title.ilike(pattern))
            | (User.email.ilike(pattern))
            | (User.username.ilike(pattern))
        )

    total = query.count()
    proposals = query.order_by(Proposal.created_at.desc()).offset(skip).limit(limit).all()

    return {
        "proposals": [
            {
                "id": p.id,
                "title": p.title,
                "status": p.status,
                "quality_score": p.quality_score,
                "created_at": p.created_at.isoformat() if p.created_at else None,
                "user_email": p.owner.email if p.owner else None,
                "user_id": p.user_id,
            }
            for p in proposals
        ],
        "total": total,
        "skip": skip,
        "limit": limit,
    }


@router.get("/payments")
async def get_admin_payments(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_admin_user),
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
):
    """Get all payments across all users, paginated"""
    total = db.query(func.count(Payment.id)).scalar()
    payments = (
        db.query(Payment)
        .join(User, Payment.user_id == User.id)
        .order_by(Payment.created_at.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )

    return {
        "payments": [
            {
                "id": p.id,
                "amount": float(p.amount),
                "currency": p.currency,
                "status": p.status.value if p.status else None,
                "payment_method": p.payment_method,
                "description": p.description,
                "paypal_order_id": p.paypal_order_id,
                "created_at": p.created_at.isoformat() if p.created_at else None,
                "completed_at": p.completed_at.isoformat() if p.completed_at else None,
                "user_email": p.user.email if p.user else None,
                "user_id": p.user_id,
            }
            for p in payments
        ],
        "total": total,
        "skip": skip,
        "limit": limit,
    }


# --- Legacy migration endpoints (kept for backward compatibility) ---

@router.post("/run-subscription-migration-emergency")
async def run_subscription_migration_emergency(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_admin_user)
):
    """Emergency migration endpoint - requires admin authentication"""
    try:
        columns_check = db.execute(text("""
            SELECT column_name
            FROM information_schema.columns
            WHERE table_name = 'users'
            AND column_name = 'subscription_plan'
        """))
        if columns_check.scalar():
            return {"message": "Migration already applied", "status": "columns_exist"}

        logger.info("Adding subscription fields to users table...")
        db.execute(text("""
            ALTER TABLE users
            ADD COLUMN IF NOT EXISTS subscription_plan VARCHAR,
            ADD COLUMN IF NOT EXISTS proposals_remaining INTEGER DEFAULT 0,
            ADD COLUMN IF NOT EXISTS subscription_expires_at TIMESTAMP,
            ADD COLUMN IF NOT EXISTS subscription_started_at TIMESTAMP
        """))
        db.commit()

        return {
            "success": True,
            "message": "User subscription columns added successfully",
            "timestamp": datetime.utcnow().isoformat()
        }

    except Exception as e:
        db.rollback()
        logger.error(f"Emergency migration failed: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Migration failed: {str(e)}")


@router.post("/run-subscription-migration")
async def run_subscription_migration(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_admin_user)
):
    """Run database migration to add subscription tables"""
    try:
        result = db.execute(text("SELECT version_num FROM alembic_version"))
        current_version = result.scalar()

        if current_version == "004_subscription_payment":
            return {"message": "Migration already applied", "version": current_version}

        logger.info("Adding subscription fields to users table...")
        db.execute(text("""
            ALTER TABLE users
            ADD COLUMN IF NOT EXISTS subscription_plan VARCHAR,
            ADD COLUMN IF NOT EXISTS proposals_remaining INTEGER DEFAULT 0,
            ADD COLUMN IF NOT EXISTS subscription_expires_at TIMESTAMP,
            ADD COLUMN IF NOT EXISTS subscription_started_at TIMESTAMP
        """))

        logger.info("Creating subscriptions table...")
        db.execute(text("""
            CREATE TABLE IF NOT EXISTS subscriptions (
                id SERIAL PRIMARY KEY,
                user_id INTEGER UNIQUE NOT NULL REFERENCES users(id),
                plan_type VARCHAR NOT NULL,
                proposals_limit INTEGER NOT NULL,
                proposals_used INTEGER NOT NULL DEFAULT 0,
                amount_paid NUMERIC(10, 2) NOT NULL,
                currency VARCHAR DEFAULT 'EUR',
                started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                expires_at TIMESTAMP NOT NULL,
                cancelled_at TIMESTAMP,
                is_active BOOLEAN DEFAULT true,
                auto_renew BOOLEAN DEFAULT false,
                paypal_subscription_id VARCHAR,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """))

        logger.info("Creating payments table...")
        db.execute(text("""
            CREATE TABLE IF NOT EXISTS payments (
                id SERIAL PRIMARY KEY,
                user_id INTEGER NOT NULL REFERENCES users(id),
                subscription_id INTEGER REFERENCES subscriptions(id),
                amount NUMERIC(10, 2) NOT NULL,
                currency VARCHAR DEFAULT 'EUR',
                status VARCHAR DEFAULT 'PENDING',
                paypal_order_id VARCHAR UNIQUE NOT NULL,
                paypal_capture_id VARCHAR,
                paypal_payer_id VARCHAR,
                paypal_payer_email VARCHAR,
                payment_method VARCHAR DEFAULT 'paypal',
                description VARCHAR,
                payment_metadata JSONB,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                completed_at TIMESTAMP,
                refunded_at TIMESTAMP
            )
        """))

        logger.info("Creating indexes...")
        db.execute(text("CREATE INDEX IF NOT EXISTS ix_subscriptions_user_id ON subscriptions(user_id)"))
        db.execute(text("CREATE INDEX IF NOT EXISTS ix_subscriptions_is_active ON subscriptions(is_active)"))
        db.execute(text("CREATE INDEX IF NOT EXISTS ix_payments_user_id ON payments(user_id)"))
        db.execute(text("CREATE INDEX IF NOT EXISTS ix_payments_status ON payments(status)"))
        db.execute(text("CREATE INDEX IF NOT EXISTS ix_payments_paypal_order_id ON payments(paypal_order_id)"))

        db.execute(text("UPDATE alembic_version SET version_num = '004_subscription_payment'"))
        db.commit()

        return {
            "success": True,
            "message": "Subscription migration completed successfully",
            "version": "004_subscription_payment",
            "timestamp": datetime.utcnow().isoformat()
        }

    except Exception as e:
        db.rollback()
        logger.error(f"Migration failed: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Migration failed: {str(e)}")


@router.get("/migration-status")
async def check_migration_status(
    db: Session = Depends(get_db)
):
    """Check current database migration status"""
    try:
        result = db.execute(text("SELECT version_num FROM alembic_version"))
        current_version = result.scalar()

        tables_check = db.execute(text("""
            SELECT table_name
            FROM information_schema.tables
            WHERE table_schema = 'public'
            AND table_name IN ('subscriptions', 'payments')
        """))
        existing_tables = [row[0] for row in tables_check]

        columns_check = db.execute(text("""
            SELECT column_name
            FROM information_schema.columns
            WHERE table_name = 'users'
            AND column_name IN ('subscription_plan', 'proposals_remaining',
                                'subscription_expires_at', 'subscription_started_at')
        """))
        existing_columns = [row[0] for row in columns_check]

        return {
            "current_version": current_version,
            "subscription_tables_exist": "subscriptions" in existing_tables and "payments" in existing_tables,
            "user_columns_exist": len(existing_columns) == 4,
            "existing_tables": existing_tables,
            "existing_user_columns": existing_columns,
            "needs_migration": current_version != "004_subscription_payment"
        }

    except Exception as e:
        logger.error(f"Failed to check migration status: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to check status: {str(e)}")
