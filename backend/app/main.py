from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
import os

from app.api import form_generator, health, auth, proposals, dashboard, analytics
from app.api import settings as settings_api
from app.api import user_profile as profile
from app.core.config import settings
from app.db.database import engine, Base

# Load environment variables
load_dotenv()

# Create database tables
Base.metadata.create_all(bind=engine)

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
        "https://*.onrender.com",  # Allow all Render subdomains
        os.getenv("FRONTEND_URL", "")  # Allow custom frontend URL
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(health.router, prefix="/api/health", tags=["health"])
app.include_router(form_generator.router, prefix="/api/form", tags=["form"])
app.include_router(auth.router)
app.include_router(proposals.router)
app.include_router(dashboard.router)
app.include_router(analytics.router, prefix="/api/analytics", tags=["analytics"])
app.include_router(settings_api.router, prefix="/api/settings", tags=["settings"])
app.include_router(profile.router, prefix="/api/profile", tags=["profile"])

@app.get("/")
async def root():
    return {
        "message": "Erasmus+ Form Completion API",
        "version": "1.0.0",
        "status": "operational"
    }