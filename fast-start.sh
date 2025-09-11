#!/bin/bash

# Ultra-fast startup script - skips checks and runs both services directly

echo "⚡ Fast Start - Erasmus+ Form Completion System"
echo ""

# Kill any existing processes
pkill -f "uvicorn app.main:app" 2>/dev/null
pkill -f "react-scripts start" 2>/dev/null

# Start backend
echo "🚀 Starting backend on port 8000..."
cd backend
source venv/bin/activate 2>/dev/null
uvicorn app.main:app --reload --port 8000 --log-level error &
BACKEND_PID=$!

# Start frontend  
echo "🚀 Starting frontend on port 3000..."
cd ../frontend
PORT=3000 npm start &
FRONTEND_PID=$!

echo ""
echo "✨ Services starting..."
echo ""
echo "📍 Frontend: http://localhost:3000 (may take 30-60 seconds on WSL)"
echo "📍 Backend: http://localhost:8000"
echo ""
echo "Press Ctrl+C to stop"

trap "kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; exit" INT
wait