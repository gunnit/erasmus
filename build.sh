#!/bin/bash
set -e

echo "Starting backend build process..."

# Install Python dependencies
cd backend
pip install --upgrade pip
pip install -r requirements.txt

echo "Backend build completed successfully!"