#!/bin/bash

# FastAPI Backend Startup Script
# This script starts the FastAPI backend server on port 8000

echo "🚀 Starting FastAPI Backend..."
echo ""

# Navigate to backend directory
cd "$(dirname "$0")/fastapi_ecommerce-main" || exit 1

# Check if virtual environment exists
if [ -d "venv" ]; then
    echo "📦 Activating virtual environment..."
    source venv/bin/activate
fi

# Check if uvicorn is installed
if ! command -v uvicorn &> /dev/null; then
    echo "❌ uvicorn not found. Installing dependencies..."
    pip install uvicorn fastapi sqlalchemy databases python-dotenv passlib python-jose pydantic-settings
fi

# Check if port 8000 is already in use
if lsof -Pi :8000 -sTCP:LISTEN -t >/dev/null 2>&1 ; then
    echo "⚠️  Port 8000 is already in use. Killing existing process..."
    lsof -ti:8000 | xargs kill -9 2>/dev/null || true
    sleep 1
fi

# Start the backend
echo "✅ Starting backend on http://0.0.0.0:8000"
echo "📝 Press Ctrl+C to stop the server"
echo ""

python3 -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
