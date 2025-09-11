#!/bin/bash
set -e

echo "Starting backend build process..."

# Install Python dependencies
cd backend
pip install --upgrade pip
pip install -r requirements.txt

# Run database migrations if they exist
if [ -f "alembic.ini" ]; then
    echo "Running database migrations..."
    alembic upgrade head
fi

echo "Backend build completed successfully!"