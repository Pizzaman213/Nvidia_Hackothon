#!/bin/bash
# Initial setup script for AI Babysitter System

set -e

echo "=========================================="
echo "AI Babysitter System - Initial Setup"
echo "=========================================="
echo ""

# Check requirements
echo "Checking requirements..."

# Check Docker
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed"
    echo "Please install Docker from: https://docs.docker.com/get-docker/"
    exit 1
fi
echo "✓ Docker installed"

# Check Docker Compose
if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose is not installed"
    echo "Please install Docker Compose from: https://docs.docker.com/compose/install/"
    exit 1
fi
echo "✓ Docker Compose installed"

# Check Python
if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 is not installed"
    echo "Please install Python 3.10 or higher"
    exit 1
fi
echo "✓ Python installed"

# Create .env file if it doesn't exist
if [ ! -f .env ]; then
    echo ""
    echo "Creating .env file from template..."
    if [ -f .env.example ]; then
        cp .env.example .env
        echo "✓ .env file created"
        echo ""
        echo "⚠️  IMPORTANT: Edit .env and add your API keys:"
        echo "   - NVIDIA_API_KEY"
        echo "   - OPENAI_API_KEY (for vision)"
        echo "   - ELEVENLABS_API_KEY (optional, for voice)"
    else
        echo "❌ .env.example not found"
        exit 1
    fi
else
    echo "✓ .env file already exists"
fi

# Make launcher scripts executable
chmod +x launcher.py
chmod +x launcher.sh
echo "✓ Launcher scripts made executable"

# Create necessary directories
mkdir -p backend/data
mkdir -p frontend/build
mkdir -p logs
mkdir -p nginx/ssl
echo "✓ Created necessary directories"

echo ""
echo "=========================================="
echo "Setup Complete!"
echo "=========================================="
echo ""
echo "Next steps:"
echo "1. Edit .env file and add your API keys"
echo "2. Run: ./launcher.sh start"
echo "   or: python launcher.py start"
echo ""
echo "The system will be available at:"
echo "  • Frontend: http://localhost:3000"
echo "  • Backend:  http://localhost:8000"
echo "  • API Docs: http://localhost:8000/docs"
echo ""
echo "For help: ./launcher.sh --help"
echo ""