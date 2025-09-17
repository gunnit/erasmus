from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
import os

from app.api import form_generator, health, auth, proposals, dashboard, analytics
from app.api import settings as settings_api
from app.api import user_profile as profile
from app.api import progressive_generator
from app.api import simple_generator
from app.api import single_question_generator
from app.api import workplan_generator
from app.api import quality_score
from app.core.config import settings
from app.db.database import engine, Base

# Load environment variables
load_dotenv()

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
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000", 
        "http://localhost:3001",
        "https://erasmus-frontend.onrender.com",  # Production frontend
        "https://erasmus-backend.onrender.com",   # Allow backend self-calls
        os.getenv("FRONTEND_URL", "")  # Allow custom frontend URL
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

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

@app.get("/")
async def root():
    return {
        "message": "Erasmus+ Form Completion API",
        "version": "1.0.0",
        "status": "operational"
    }