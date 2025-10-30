#!/bin/bash
# AI Babysitter System - Quick Launcher Script

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored messages
print_message() {
    echo -e "${2}${1}${NC}"
}

# Check if Python is installed
if ! command -v python3 &> /dev/null; then
    print_message "Python 3 is not installed!" "$RED"
    exit 1
fi

# Make launcher.py executable
chmod +x launcher.py

# Run the Python launcher with all arguments
python3 launcher.py "$@"