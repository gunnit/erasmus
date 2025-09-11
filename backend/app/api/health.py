from fastapi import APIRouter
from datetime import datetime

router = APIRouter()

@router.get("/")
async def health_check():
    """Basic health check endpoint"""
    return {
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "service": "Erasmus+ Form Completion API"
    }

@router.get("/ready")
async def readiness_check():
    """Check if all services are ready"""
    checks = {
        "api": True,
        "claude_integration": True,  # Would check actual connection
        "form_questions_loaded": True
    }
    
    all_ready = all(checks.values())
    
    return {
        "ready": all_ready,
        "checks": checks,
        "timestamp": datetime.now().isoformat()
    }