#!/bin/bash
set -e

echo "Starting backend build process..."

# Install Python dependencies
echo "Installing Python dependencies..."
cd backend
python -m pip install --upgrade pip
python -m pip install -r requirements.txt

# Run database migrations if they exist
if [ -f "alembic.ini" ]; then
    echo "Running database migrations..."
    python -m alembic upgrade head
fi

echo "Backend build completed successfully!"