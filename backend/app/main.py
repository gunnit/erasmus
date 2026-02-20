from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from dotenv import load_dotenv
import os
import logging
import traceback

from app.api import form_generator, health, auth, proposals, dashboard, analytics
from app.api import settings as settings_api
from app.api import user_profile as profile
from app.api import progressive_generator
from app.api import simple_generator
from app.api import single_question_generator
from app.api import workplan_generator
from app.api import quality_score
from app.api import payments
from app.api import admin
from app.api import partners
from app.api import conversational_ai
from app.api import ai_assistant
from app.api import paypal_webhook
from app.core.config import settings
from app.db.database import engine, Base

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Create database tables
Base.metadata.create_all(bind=engine)

# Add workplan and quality scoring columns if they don't exist (for existing databases)
from sqlalchemy import text
try:
    with engine.connect() as conn:
        # Add workplan column
        conn.execute(text("ALTER TABLE proposals ADD COLUMN IF NOT EXISTS workplan JSON"))
        # Add quality scoring columns
        conn.execute(text("ALTER TABLE proposals ADD COLUMN IF NOT EXISTS quality_score FLOAT"))
        conn.execute(text("ALTER TABLE proposals ADD COLUMN IF NOT EXISTS section_scores JSON"))
        conn.execute(text("ALTER TABLE proposals ADD COLUMN IF NOT EXISTS quality_feedback JSON"))
        conn.execute(text("ALTER TABLE proposals ADD COLUMN IF NOT EXISTS score_calculated_at TIMESTAMP"))
        # Add credit_used column for tracking proposal credit deduction
        conn.execute(text("ALTER TABLE proposals ADD COLUMN IF NOT EXISTS credit_used BOOLEAN DEFAULT false"))
        # Add user profile columns (migration 007)
        conn.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS phone VARCHAR"))
        conn.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS country VARCHAR"))
        conn.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS bio TEXT"))
        conn.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_url TEXT"))
        conn.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS organization_role VARCHAR"))
        conn.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS profile_data JSON DEFAULT '{}'"))
        conn.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS settings_json JSON DEFAULT '{}'"))
        # Admin flag
        conn.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT false"))
        conn.execute(text("UPDATE users SET is_admin = true WHERE email = 'cryptoboss9@gmail.com'"))
        conn.commit()
except Exception as e:
    print(f"Note: Could not add new columns (may already exist): {e}")

# Create FastAPI app
app = FastAPI(
    title="Erasmus+ Form Completion API",
    description="AI-powered Erasmus+ grant application form completion system",
    version="1.0.0"
)

# Configure CORS
# Build allowed origins list, filtering out empty values for security
allowed_origins = [
    "http://localhost:3000",
    "http://localhost:3001",
    "http://127.0.0.1:3000",      # Additional localhost format
    "https://erasmus-frontend.onrender.com",  # Production frontend
    "https://erasmus-backend.onrender.com",   # Allow backend self-calls
    "https://getyourgrant.eu",    # Production domain
    "https://www.getyourgrant.eu", # Production domain with www
    "http://getyourgrant.eu",     # Production domain (http)
    "http://www.getyourgrant.eu",  # Production domain with www (http)
]

# Add custom frontend URL if provided (must be valid URL)
frontend_url = os.getenv("FRONTEND_URL")
if frontend_url and frontend_url.strip() and frontend_url.startswith(("http://", "https://")):
    allowed_origins.append(frontend_url.strip())

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type", "Accept", "Origin", "X-Requested-With"],
)

# Global exception handler to ensure CORS headers are included on error responses.
# Without this, unhandled exceptions bypass the CORS middleware and the browser
# reports a CORS error instead of the actual server error.
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled exception on {request.method} {request.url.path}: {exc}")
    logger.error(traceback.format_exc())
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal server error"}
    )

# Add request logging middleware
@app.middleware("http")
async def log_requests(request: Request, call_next):
    # Log all incoming requests with their details
    origin = request.headers.get("origin", "No Origin Header")
    method = request.method
    path = request.url.path

    logger.info(f"Request: {method} {path} Origin: {origin}")

    response = await call_next(request)

    logger.info(f"Response: {method} {path} -> {response.status_code}")

    return response

# Include routers
app.include_router(health.router, prefix="/api/health", tags=["health"])
app.include_router(form_generator.router, prefix="/api/form", tags=["form"])
app.include_router(progressive_generator.router, prefix="/api/form/progressive", tags=["progressive"])
app.include_router(simple_generator.router, prefix="/api/form/simple", tags=["simple"])
app.include_router(single_question_generator.router, prefix="/api/form/single", tags=["single-question"])
app.include_router(auth.router, prefix="/api")
app.include_router(proposals.router, prefix="/api")
app.include_router(dashboard.router, prefix="/api")
app.include_router(analytics.router, prefix="/api/analytics", tags=["analytics"])
app.include_router(settings_api.router, prefix="/api/settings", tags=["settings"])
app.include_router(profile.router, prefix="/api/profile", tags=["profile"])
app.include_router(workplan_generator.router)
app.include_router(quality_score.router, prefix="/api/quality-score", tags=["quality"])
app.include_router(payments.router, prefix="/api", tags=["payments"])
app.include_router(admin.router, prefix="/api", tags=["admin"])
app.include_router(partners.router, tags=["partners"])
app.include_router(conversational_ai.router, prefix="/api/ai", tags=["conversational-ai"])
app.include_router(ai_assistant.router, prefix="/api/ai-assistant", tags=["ai-assistant"])
app.include_router(paypal_webhook.router, prefix="/api/webhooks", tags=["webhooks"])

@app.get("/")
async def root():
    return {
        "message": "Erasmus+ Form Completion API",
        "version": "1.0.0",
        "status": "operational"
    }