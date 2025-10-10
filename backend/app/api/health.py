from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import text
from datetime import datetime
from app.db.database import get_db
from app.core.config import settings
import logging

router = APIRouter()
logger = logging.getLogger(__name__)

@router.get("/")
async def health_check():
    """Basic health check endpoint"""
    return {
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "service": "Erasmus+ Form Completion API"
    }

@router.get("/ready")
async def readiness_check(db: Session = Depends(get_db)):
    """Comprehensive readiness check for all critical services"""
    checks = {}
    all_ready = True

    # 1. Check database connection
    try:
        db.execute(text("SELECT 1"))
        checks["database"] = {"status": "healthy", "message": "PostgreSQL connection successful"}
    except Exception as e:
        logger.error(f"Database health check failed: {e}")
        checks["database"] = {"status": "unhealthy", "message": str(e)}
        all_ready = False

    # 2. Check OpenAI API key configuration
    try:
        if not settings.OPENAI_API_KEY:
            raise ValueError("OPENAI_API_KEY not configured")
        if settings.OPENAI_API_KEY == "sk-...":
            raise ValueError("OPENAI_API_KEY is placeholder value")
        checks["openai"] = {"status": "configured", "model": settings.OPENAI_MODEL}
    except Exception as e:
        logger.error(f"OpenAI configuration check failed: {e}")
        checks["openai"] = {"status": "misconfigured", "message": str(e)}
        all_ready = False

    # 3. Check secret key configuration
    try:
        if not settings.SECRET_KEY or settings.SECRET_KEY == "development-secret-key-change-in-production":
            raise ValueError("SECRET_KEY not properly configured for production")
        checks["security"] = {"status": "configured", "message": "JWT secret key is set"}
    except Exception as e:
        logger.warning(f"Security configuration warning: {e}")
        checks["security"] = {"status": "warning", "message": str(e)}
        # Don't fail readiness for this, but warn

    # 4. Check database URL format
    try:
        db_url = str(settings.DATABASE_URL)
        if "postgresql://" in db_url:
            checks["database_config"] = {"status": "production", "type": "PostgreSQL"}
        elif "sqlite://" in db_url:
            checks["database_config"] = {"status": "development", "type": "SQLite"}
        else:
            checks["database_config"] = {"status": "unknown", "type": "Unknown"}
    except Exception as e:
        checks["database_config"] = {"status": "error", "message": str(e)}

    # 5. Check Firecrawl API (optional service)
    if settings.FIRECRAWL_API_KEY and settings.FIRECRAWL_API_KEY != "fc-your-firecrawl-api-key-here":
        checks["firecrawl"] = {"status": "configured", "message": "API key present"}
    else:
        checks["firecrawl"] = {"status": "not_configured", "message": "Partner search features may be limited"}

    # 6. Check PayPal configuration (for payments)
    try:
        paypal_configured = (
            settings.PAYPAL_CLIENT_ID and
            settings.PAYPAL_CLIENT_SECRET and
            settings.PAYPAL_CLIENT_ID != "" and
            settings.PAYPAL_CLIENT_SECRET != ""
        )
        if paypal_configured:
            checks["paypal"] = {
                "status": "configured",
                "mode": settings.PAYPAL_MODE,
                "message": f"PayPal {settings.PAYPAL_MODE} mode configured"
            }
        else:
            checks["paypal"] = {
                "status": "not_configured",
                "message": "Payment features unavailable - configure PayPal credentials"
            }
    except Exception as e:
        checks["paypal"] = {"status": "error", "message": str(e)}

    # 7. Check DEBUG mode (should be False in production)
    try:
        is_production = "postgresql://" in str(settings.DATABASE_URL)
        debug_mode = getattr(settings, 'DEBUG', False)

        if is_production and debug_mode:
            checks["debug_mode"] = {
                "status": "warning",
                "message": "DEBUG=True in production environment!"
            }
        else:
            checks["debug_mode"] = {
                "status": "ok",
                "message": f"DEBUG={debug_mode}"
            }
    except Exception as e:
        checks["debug_mode"] = {"status": "unknown", "message": str(e)}

    return {
        "ready": all_ready,
        "checks": checks,
        "timestamp": datetime.now().isoformat(),
        "version": "1.0.0",
        "environment": "production" if "postgresql://" in str(settings.DATABASE_URL) else "development"
    }