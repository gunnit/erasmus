#!/bin/bash

# Run database migrations
echo "Running database migrations..."
cd /opt/render/project/src/backend
python -m alembic upgrade head

# Start the application
echo "Starting application..."
exec uvicorn app.main:app --host 0.0.0.0 --port $PORT