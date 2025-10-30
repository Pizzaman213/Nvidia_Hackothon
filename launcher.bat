@echo off
REM AI Babysitter System - Quick Launcher Script (Windows)

echo ========================================
echo AI Babysitter System Launcher
echo ========================================
echo.

REM Check if Python is installed
python --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Python is not installed!
    echo Please install Python 3.10 or higher
    pause
    exit /b 1
)

REM Run the Python launcher with all arguments
python launcher.py %*