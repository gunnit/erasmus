#!/bin/bash

echo "🚀 Starting Erasmus+ Form Completion System (Optimized)"
echo "="*60
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if running on Windows (WSL)
if [[ "$OSTYPE" == "msys" ]] || [[ "$OSTYPE" == "cygwin" ]] || grep -qi microsoft /proc/version 2>/dev/null; then
    echo -e "${YELLOW}⚠️  WSL Detected: Performance may be slower on /mnt/c${NC}"
    echo "   Tip: Copy project to ~/gyg4 for 10x faster performance"
    echo ""
    PYTHON_CMD="python3"
else
    PYTHON_CMD="python3"
fi

# Function to check if port is in use
check_port() {
    if lsof -Pi :$1 -sTCP:LISTEN -t >/dev/null 2>&1; then
        echo -e "${YELLOW}⚠️  Port $1 is already in use${NC}"
        return 1
    fi
    return 0
}

# Kill existing processes
echo "🔍 Checking for existing processes..."
pkill -f "uvicorn app.main:app" 2>/dev/null
pkill -f "react-scripts start" 2>/dev/null
sleep 2

# Start backend
echo -e "${GREEN}📦 Starting backend server...${NC}"
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
    pip install -q -r requirements.txt
    touch .deps_installed
fi

# Check if .env file exists
if [ ! -f ".env" ]; then
    echo -e "${RED}⚠️  ERROR: .env file not found in backend directory${NC}"
    echo "Creating template .env file..."
    cat > .env << EOF
OPENAI_API_KEY=your-api-key-here
OPENAI_MODEL=gpt-4
EOF
    echo "Please edit backend/.env with your OPENAI_API_KEY"
fi

# Start backend server with timeout check
check_port 8000
if [ $? -eq 0 ]; then
    echo "Starting FastAPI server on port 8000..."
    uvicorn app.main:app --reload --port 8000 --log-level warning &
    BACKEND_PID=$!
    
    # Wait for backend to be ready
    echo -n "Waiting for backend to start"
    for i in {1..10}; do
        if curl -s http://localhost:8000 > /dev/null 2>&1; then
            echo -e " ${GREEN}✓${NC}"
            break
        fi
        echo -n "."
        sleep 1
    done
else
    echo -e "${YELLOW}Backend server might already be running${NC}"
fi

# Start frontend
echo ""
echo -e "${GREEN}📱 Starting frontend...${NC}"
cd ../frontend

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo "Installing frontend dependencies (this may take a few minutes)..."
    npm install --silent
fi

# Create optimized .env if not exists
if [ ! -f ".env" ]; then
    echo "Creating optimized frontend .env..."
    cat > .env << EOF
GENERATE_SOURCEMAP=false
FAST_REFRESH=true
REACT_APP_API_URL=http://localhost:8000/api
BROWSER=none
EOF
fi

# Start frontend server with progress indicator
check_port 3000
if [ $? -eq 0 ]; then
    echo "Starting React development server on port 3000..."
    echo -e "${YELLOW}Note: Initial compilation may take 30-60 seconds on WSL${NC}"
    
    # Start npm in background and capture output
    npm start 2>&1 | while IFS= read -r line; do
        if [[ "$line" == *"Compiled"* ]]; then
            echo -e "${GREEN}✅ Frontend compiled successfully!${NC}"
        elif [[ "$line" == *"webpack compiled"* ]]; then
            echo -e "${GREEN}✅ Webpack compilation complete!${NC}"
        elif [[ "$line" == *"Failed to compile"* ]]; then
            echo -e "${RED}❌ Compilation failed!${NC}"
            echo "$line"
        elif [[ "$line" == *"Warning"* ]]; then
            echo -e "${YELLOW}⚠️  $line${NC}"
        fi
    done &
    FRONTEND_PID=$!
    
    # Wait and check if frontend is responding
    echo -n "Waiting for frontend to be ready"
    for i in {1..60}; do
        if curl -s http://localhost:3000 > /dev/null 2>&1; then
            echo -e " ${GREEN}✓${NC}"
            echo -e "${GREEN}✨ Frontend is ready!${NC}"
            break
        fi
        echo -n "."
        sleep 2
    done
else
    echo -e "${YELLOW}Frontend server might already be running${NC}"
fi

echo ""
echo "="*60
echo -e "${GREEN}✅ System is ready!${NC}"
echo ""
echo "📍 Frontend: http://localhost:3000"
echo "📍 Backend API: http://localhost:8000"
echo "📍 API Docs: http://localhost:8000/docs"
echo ""
echo -e "${YELLOW}Performance Tips:${NC}"
echo "• If slow, move project to WSL filesystem: cp -r /mnt/c/Dev/gyg4 ~/gyg4"
echo "• Open http://localhost:3000 in your browser now"
echo ""
echo "Press Ctrl+C to stop all services"

# Wait for interrupt
trap "echo ''; echo 'Shutting down services...'; kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; exit" INT
wait