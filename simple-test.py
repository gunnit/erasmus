#!/usr/bin/env python3
"""
Simple test to verify FastAPI is working
Run this from backend folder with venv activated
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import uvicorn

app = FastAPI(title="Test Server")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def root():
    return {"status": "Test server is working!", "message": "OpenAI integration ready"}

@app.get("/test")
def test():
    import os
    has_openai_key = bool(os.getenv("OPENAI_API_KEY"))
    return {
        "python": "working",
        "fastapi": "working", 
        "openai_key": "configured" if has_openai_key else "missing"
    }

if __name__ == "__main__":
    print("Starting test server on http://localhost:8000")
    print("Press Ctrl+C to stop")
    uvicorn.run(app, host="0.0.0.0", port=8000)