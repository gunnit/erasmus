from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
import os
import logging

# Import Neo4j versions of APIs
from app.api import form_generator, health
from app.api import auth_neo4j as auth
from app.api import proposals_neo4j as proposals
from app.api import dashboard, analytics, settings as settings_api, profile
from app.core.config import settings
from app.db.neo4j_db import neo4j_db, init_neo4j_schema
from app.db.neo4j_models import init_sample_data

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Load environment variables
load_dotenv()

# Create FastAPI app
app = FastAPI(
    title="Erasmus+ Form Completion API (Neo4j)",
    description="AI-powered Erasmus+ grant application form completion system with Neo4j",
    version="2.0.0"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:3001", "*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Startup event
@app.on_event("startup")
async def startup_event():
    """Initialize Neo4j connection and schema"""
    try:
        logger.info("Connecting to Neo4j database...")
        neo4j_db.connect()
        
        logger.info("Initializing Neo4j schema...")
        init_neo4j_schema()
        
        logger.info("Loading sample data...")
        init_sample_data()
        
        logger.info("Neo4j initialization complete")
    except Exception as e:
        logger.error(f"Failed to initialize Neo4j: {e}")
        raise

# Shutdown event
@app.on_event("shutdown")
async def shutdown_event():
    """Close Neo4j connection"""
    neo4j_db.close()
    logger.info("Neo4j connection closed")

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
        "message": "Erasmus+ Form Completion API (Neo4j)",
        "version": "2.0.0",
        "status": "operational",
        "database": "Neo4j"
    }

@app.get("/api/test-neo4j")
async def test_neo4j():
    """Test Neo4j connection"""
    try:
        result = neo4j_db.execute_query("MATCH (n) RETURN count(n) as node_count LIMIT 1")
        return {
            "status": "connected",
            "node_count": result[0]['node_count'] if result else 0
        }
    except Exception as e:
        return {
            "status": "error",
            "error": str(e)
        }