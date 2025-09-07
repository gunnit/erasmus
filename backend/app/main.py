from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
import os

from app.api import form_generator, health
from app.core.config import settings

# Load environment variables
load_dotenv()

# Create FastAPI app
app = FastAPI(
    title="Erasmus+ Form Completion API",
    description="AI-powered Erasmus+ grant application form completion system",
    version="1.0.0"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:3001"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(health.router, prefix="/api/health", tags=["health"])
app.include_router(form_generator.router, prefix="/api/form", tags=["form"])

@app.get("/")
async def root():
    return {
        "message": "Erasmus+ Form Completion API",
        "version": "1.0.0",
        "status": "operational"
    }