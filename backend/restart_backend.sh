#!/bin/bash
# Restart backend with clean environment

echo "Killing existing backend processes..."
pkill -f uvicorn
sleep 2

echo "Unsetting any cached environment variables..."
unset NVIDIA_COSMOS_MODEL

echo "Starting backend server..."
cd /Users/connorsecrist/Nvidia_hackathon/backend
source venv/bin/activate
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
