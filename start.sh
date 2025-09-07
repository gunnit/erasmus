#!/bin/bash

echo "🚀 Starting Erasmus+ Form Completion System..."
echo ""

# Check if running on Windows (WSL)
if [[ "$OSTYPE" == "msys" ]] || [[ "$OSTYPE" == "cygwin" ]]; then
    echo "Detected Windows environment"
    PYTHON_CMD="python"
else
    PYTHON_CMD="python3"
fi

# Function to check if port is in use
check_port() {
    if lsof -Pi :$1 -sTCP:LISTEN -t >/dev/null 2>&1; then
        echo "⚠️  Port $1 is already in use"
        return 1
    fi
    return 0
}

# Start backend
echo "📦 Starting backend server..."
cd backend

# Check if virtual environment exists
if [ ! -d "venv" ]; then
    echo "Creating virtual environment..."
    $PYTHON_CMD -m venv venv
fi

# Activate virtual environment
source venv/bin/activate 2>/dev/null || source venv/Scripts/activate 2>/dev/null

# Install dependencies if needed
if [ ! -f ".deps_installed" ]; then
    echo "Installing backend dependencies..."
    pip install -r requirements.txt
    touch .deps_installed
fi

# Check if .env file exists
if [ ! -f ".env" ]; then
    echo "⚠️  WARNING: .env file not found in backend directory"
    echo "Please create backend/.env with your ANTHROPIC_API_KEY"
    echo ""
fi

# Start backend server
check_port 8000
if [ $? -eq 0 ]; then
    echo "Starting FastAPI server on port 8000..."
    uvicorn app.main:app --reload --port 8000 &
    BACKEND_PID=$!
else
    echo "Backend server might already be running"
fi

# Start frontend
echo ""
echo "📱 Starting frontend..."
cd ../frontend

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo "Installing frontend dependencies..."
    npm install
fi

# Start frontend server
check_port 3000
if [ $? -eq 0 ]; then
    echo "Starting React development server on port 3000..."
    npm start &
    FRONTEND_PID=$!
else
    echo "Frontend server might already be running"
fi

echo ""
echo "✅ System starting up..."
echo ""
echo "📍 Frontend: http://localhost:3000"
echo "📍 Backend API: http://localhost:8000"
echo "📍 API Docs: http://localhost:8000/docs"
echo ""
echo "Press Ctrl+C to stop all services"

# Wait for interrupt
trap "echo ''; echo 'Shutting down services...'; kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; exit" INT
wait