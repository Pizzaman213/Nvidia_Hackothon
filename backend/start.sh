#!/bin/bash
# Start script for AI Babysitter Backend
# This script loads environment variables, runs migrations, and starts the server

set -e

# Change to backend directory
cd "$(dirname "$0")"

echo "========================================"
echo "AI Babysitter Backend Startup"
echo "========================================"
echo ""

# Load environment variables from .env file
if [ -f .env ]; then
    export $(cat .env | grep -v '^#' | grep -v '^$' | xargs)
    echo "✓ Environment variables loaded"
fi

# Run database initialization/migrations
echo ""
echo "Running database migrations..."
python init_db.py
echo ""

# Start uvicorn server
echo "Starting FastAPI server..."
echo "========================================"
exec venv/bin/uvicorn app.main:app --host 0.0.0.0 --port 8000
