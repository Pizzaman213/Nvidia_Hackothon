# AI Babysitter Launcher - Overview

## What is the Launcher?

The AI Babysitter Launcher (`launcher.py`) is a unified command-line tool that simplifies the management of the entire AI Babysitter application stack. Instead of manually starting the backend, frontend, database, and other services separately, the launcher provides a single entry point to control everything.

## Key Benefits

### 1. **Simplified Workflow**
- Start the entire application with one command
- No need to remember multiple terminal commands
- Automatically handles service dependencies

### 2. **Environment Validation**
- Checks for required tools (Docker, Python, etc.)
- Verifies API keys are configured
- Creates missing configuration files automatically

### 3. **Consistent Development Experience**
- Developers and production use the same commands
- Reduces setup errors
- Makes onboarding new team members easier

### 4. **Comprehensive Service Management**
- Start, stop, restart services with ease
- View logs from all services or individual ones
- Monitor service health and status
- Clean up Docker artifacts and build files

## What Does It Do?

The launcher performs several important functions:

### Project Setup
- Checks that Docker, Docker Compose, and Python are installed
- Validates environment configuration (`.env` file)
- Creates necessary directories for logs, data, and build artifacts
- Installs backend Python dependencies
- Installs frontend Node.js dependencies

### Service Management
- **Start**: Launches all services using Docker Compose
  - Backend API (FastAPI)
  - Frontend web application (React)
  - Database (PostgreSQL)
  - Optional development tools (Adminer for database management)
- **Stop**: Gracefully shuts down all running services
- **Restart**: Stops and starts services in sequence
- **Status**: Shows which services are running

### Monitoring & Debugging
- **Logs**: View real-time logs from services
  - All services combined
  - Individual service logs
  - Option to follow logs (live updates) or just view static output
- **Status**: Check health of running containers

### Testing & Cleanup
- **Test**: Run automated tests for backend and frontend
- **Clean**: Remove Docker containers, volumes, and build artifacts to start fresh

## Architecture Context

The AI Babysitter system consists of multiple components that work together:

```
┌─────────────────────────────────────────────────────────┐
│                    Launcher (launcher.py)                │
│          Single command-line interface for everything    │
└────────────────────┬─────────────────────────────────────┘
                     │
                     │ Orchestrates
                     │
┌────────────────────▼─────────────────────────────────────┐
│                  Docker Compose                           │
│              Container orchestration layer                │
└─────┬──────────┬──────────┬──────────┬───────────────────┘
      │          │          │          │
      │          │          │          │
┌─────▼────┐ ┌──▼──────┐ ┌─▼──────┐ ┌─▼──────────┐
│ Backend  │ │Frontend │ │Database│ │  Adminer   │
│  (API)   │ │  (UI)   │ │(PgSQL) │ │(Dev Tool)  │
└──────────┘ └─────────┘ └────────┘ └────────────┘
```

## Technology Stack

The launcher is built with:
- **Python 3**: Core scripting language
- **subprocess module**: Execute shell commands
- **argparse**: Command-line argument parsing
- **Docker & Docker Compose**: Container management
- **Colored terminal output**: User-friendly feedback

## Prerequisites

Before using the launcher, you need:

1. **Docker** (version 20.10+)
   - Container runtime for running services
   - Download: https://www.docker.com/get-started

2. **Docker Compose** (version 2.0+)
   - Multi-container orchestration
   - Usually bundled with Docker Desktop

3. **Python 3** (version 3.8+)
   - Required to run the launcher script
   - Check: `python3 --version`

4. **API Keys** (for full functionality)
   - NVIDIA API key (for Nemotron LLM)
   - OpenAI API key (for Whisper, GPT-4 Vision)
   - Optional: Anthropic, ElevenLabs keys

## Quick Start Example

```bash
# 1. First time setup
python launcher.py setup

# 2. Start all services
python launcher.py start

# 3. View logs (in another terminal)
python launcher.py logs

# 4. Check status
python launcher.py status

# 5. Stop services when done
python launcher.py stop
```

## Common Use Cases

### Development Workflow
```bash
# Morning: Start work
python launcher.py start -d          # Start in background

# During development
python launcher.py logs backend      # Check backend logs
python launcher.py restart           # Apply changes

# Before committing
python launcher.py test              # Run tests

# End of day
python launcher.py stop              # Stop everything
```

### Troubleshooting
```bash
# Services not working?
python launcher.py status            # Check what's running
python launcher.py logs              # See error messages

# Fresh start needed?
python launcher.py clean             # Remove everything
python launcher.py setup             # Reinstall
python launcher.py start             # Start fresh
```

## Next Steps

- **[How to Use](02-how-to-use.md)**: Detailed command reference and examples
- **[How It Works](03-how-it-works.md)**: Technical implementation details

---

**Version**: 1.0.0
**Last Updated**: 2025-10-29
**Compatibility**: Python 3.8+, Docker 20.10+, Docker Compose 2.0+
