"""Admin API endpoints for system management"""
from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from sqlalchemy import text
from app.db.database import get_db
from app.api.dependencies import get_current_user
from app.db.models import User
import logging
from datetime import datetime
import os

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/admin", tags=["admin"])

@router.post("/run-subscription-migration")
async def run_subscription_migration(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Run database migration to add subscription tables"""
    try:
        # Check if user is admin (you might want to add an is_admin field)
        if current_user.email not in ["cryptoboss9@gmail.com", "greg@example.com"]:
            raise HTTPException(status_code=403, detail="Not authorized")

        # Check current migration status
        result = db.execute(text("SELECT version_num FROM alembic_version"))
        current_version = result.scalar()

        if current_version == "004_subscription_payment":
            return {"message": "Migration already applied", "version": current_version}

        # Add subscription fields to users table
        logger.info("Adding subscription fields to users table...")
        db.execute(text("""
            ALTER TABLE users
            ADD COLUMN IF NOT EXISTS subscription_plan VARCHAR,
            ADD COLUMN IF NOT EXISTS proposals_remaining INTEGER DEFAULT 0,
            ADD COLUMN IF NOT EXISTS subscription_expires_at TIMESTAMP,
            ADD COLUMN IF NOT EXISTS subscription_started_at TIMESTAMP
        """))

        # Create subscription table
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

        # Create payment table
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

        # Create indexes
        logger.info("Creating indexes...")
        db.execute(text("CREATE INDEX IF NOT EXISTS ix_subscriptions_user_id ON subscriptions(user_id)"))
        db.execute(text("CREATE INDEX IF NOT EXISTS ix_subscriptions_is_active ON subscriptions(is_active)"))
        db.execute(text("CREATE INDEX IF NOT EXISTS ix_payments_user_id ON payments(user_id)"))
        db.execute(text("CREATE INDEX IF NOT EXISTS ix_payments_status ON payments(status)"))
        db.execute(text("CREATE INDEX IF NOT EXISTS ix_payments_paypal_order_id ON payments(paypal_order_id)"))

        # Update alembic version
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
        # Check alembic version
        result = db.execute(text("SELECT version_num FROM alembic_version"))
        current_version = result.scalar()

        # Check if subscription tables exist
        tables_check = db.execute(text("""
            SELECT table_name
            FROM information_schema.tables
            WHERE table_schema = 'public'
            AND table_name IN ('subscriptions', 'payments')
        """))
        existing_tables = [row[0] for row in tables_check]

        # Check if user columns exist
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