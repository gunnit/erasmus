#!/bin/bash

echo "==================================="
echo "Erasmus+ Application System"
echo "Starting with Neo4j Database"
echo "==================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to check if Neo4j is running
neo4j_running() {
    nc -z localhost 7687 2>/dev/null
}

# Step 1: Check and install Neo4j if needed
echo -e "${YELLOW}Step 1: Checking Neo4j installation...${NC}"

if ! command_exists neo4j; then
    echo -e "${YELLOW}Neo4j not found. Installing Neo4j...${NC}"
    
    # Check OS and install accordingly
    if [[ "$OSTYPE" == "linux-gnu"* ]]; then
        # Add Neo4j repository
        wget -O - https://debian.neo4j.com/neotechnology.gpg.key | sudo apt-key add -
        echo 'deb https://debian.neo4j.com stable latest' | sudo tee /etc/apt/sources.list.d/neo4j.list
        sudo apt-get update
        sudo apt-get install -y neo4j
    elif [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS
        if command_exists brew; then
            brew install neo4j
        else
            echo -e "${RED}Please install Homebrew first or download Neo4j from https://neo4j.com/download/${NC}"
            exit 1
        fi
    else
        echo -e "${RED}Please download and install Neo4j from https://neo4j.com/download/${NC}"
        echo "After installation, run this script again."
        exit 1
    fi
fi

# Step 2: Start Neo4j if not running
echo -e "${YELLOW}Step 2: Starting Neo4j database...${NC}"

if ! neo4j_running; then
    # Try to start Neo4j
    if command_exists systemctl; then
        sudo systemctl start neo4j
    elif command_exists neo4j; then
        neo4j start
    else
        echo -e "${YELLOW}Starting Neo4j in console mode...${NC}"
        neo4j console &
        NEO4J_PID=$!
    fi
    
    # Wait for Neo4j to start
    echo "Waiting for Neo4j to start..."
    for i in {1..30}; do
        if neo4j_running; then
            echo -e "${GREEN}Neo4j is running!${NC}"
            break
        fi
        sleep 2
    done
    
    if ! neo4j_running; then
        echo -e "${RED}Failed to start Neo4j. Please start it manually.${NC}"
        echo "You can try: neo4j console"
        exit 1
    fi
else
    echo -e "${GREEN}Neo4j is already running${NC}"
fi

# Step 3: Configure Neo4j credentials
echo -e "${YELLOW}Step 3: Configuring Neo4j...${NC}"
echo "Default Neo4j credentials: neo4j/neo4j"
echo "You may need to change the password on first login"
echo "Update backend/.env with your Neo4j credentials"

# Step 4: Install Python dependencies
echo -e "${YELLOW}Step 4: Installing backend dependencies...${NC}"

cd backend

# Create virtual environment if it doesn't exist
if [ ! -d "venv" ]; then
    echo "Creating Python virtual environment..."
    python3 -m venv venv
fi

# Activate virtual environment
source venv/bin/activate

# Install dependencies
pip install --upgrade pip
pip install -r requirements.txt

# Step 5: Start backend with Neo4j
echo -e "${YELLOW}Step 5: Starting backend server with Neo4j...${NC}"

# Kill any existing backend process
pkill -f "uvicorn app.main" 2>/dev/null

# Start the backend with Neo4j main file
echo -e "${GREEN}Starting backend on http://localhost:8000${NC}"
uvicorn app.main_neo4j:app --reload --port 8000 &
BACKEND_PID=$!

# Wait for backend to start
echo "Waiting for backend to start..."
sleep 5

# Check if backend is running
if curl -s http://localhost:8000/api/health/ready > /dev/null; then
    echo -e "${GREEN}Backend is running!${NC}"
else
    echo -e "${YELLOW}Backend may still be starting...${NC}"
fi

# Step 6: Start frontend
echo -e "${YELLOW}Step 6: Starting frontend...${NC}"

cd ../frontend

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo "Installing frontend dependencies..."
    npm install
fi

# Kill any existing frontend process
pkill -f "react-scripts start" 2>/dev/null

# Start frontend
echo -e "${GREEN}Starting frontend on http://localhost:3000${NC}"
BROWSER=none PORT=3000 npm start &
FRONTEND_PID=$!

# Step 7: Show status
echo ""
echo "==================================="
echo -e "${GREEN}System Started Successfully!${NC}"
echo "==================================="
echo ""
echo "Services running:"
echo "- Neo4j Database: http://localhost:7474 (Browser)"
echo "- Neo4j Bolt: bolt://localhost:7687"
echo "- Backend API: http://localhost:8000"
echo "- Frontend: http://localhost:3000"
echo ""
echo "API Documentation: http://localhost:8000/docs"
echo ""
echo "To stop all services, press Ctrl+C"
echo ""
echo "First time setup:"
echo "1. Go to http://localhost:7474"
echo "2. Login with neo4j/neo4j"
echo "3. Change password when prompted"
echo "4. Update backend/.env with new password"
echo "5. Restart this script"
echo ""

# Keep script running
wait $BACKEND_PID $FRONTEND_PID