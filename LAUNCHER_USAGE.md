# AI Babysitter Launcher - Complete Usage Guide

The `launcher.py` script is a comprehensive, all-in-one tool for managing the AI Babysitter system. It handles dependency installation, environment setup, service management, and more.

## Features

- **Automatic First-Run Setup**: Detects first run and automatically installs all dependencies
- **Dependency Management**: Handles Python packages, Node.js packages, and virtual environments
- **Environment Configuration**: Creates and validates `.env` configuration files
- **Service Management**: Start, stop, restart Docker services with a single command
- **Database Initialization**: Automatically sets up the database schema
- **NVIDIA Riva TTS**: Optional auto-setup for high-quality text-to-speech
- **Cross-Platform**: Works on macOS, Linux, and Windows

## Quick Start

### First Time Setup (Automatic)

Simply run the launcher:

```bash
python3 launcher.py
```

Or explicitly run setup:

```bash
python3 launcher.py setup
```

The launcher will automatically:
1. ✅ Check system requirements (Docker, Node.js, Python 3.10+)
2. ✅ Create Python virtual environment in `backend/venv`
3. ✅ Install all backend Python dependencies
4. ✅ Install all frontend Node.js dependencies
5. ✅ Create `.env` configuration file with placeholders
6. ✅ Initialize SQLite database

### Configure API Keys

After setup, edit the `.env` file:

```bash
nano .env
```

Add your API keys:

```env
NVIDIA_API_KEY=nvapi-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
OPENAI_API_KEY=sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

Get your API keys:
- **NVIDIA**: https://build.nvidia.com/ (free)
- **OpenAI**: https://platform.openai.com/

### Start the Application

```bash
python3 launcher.py start
```

Access the interfaces:
- **Child Interface**: http://localhost:3000
- **Parent Dashboard**: http://localhost:3000/parent-login
- **API Documentation**: http://localhost:8000/docs

## All Commands

### Setup Command

Install all dependencies and prepare the project:

```bash
python3 launcher.py setup
```

What it does:
- Creates project directories (`backend/data`, `frontend/build`, `logs`, etc.)
- Sets up Python virtual environment
- Installs backend dependencies from `requirements.txt`
- Installs frontend dependencies from `package.json`
- Initializes database
- Creates `.env` file if missing

### Start Command

Start all application services:

```bash
# Development mode (default)
python3 launcher.py start

# Production mode
python3 launcher.py start --prod

# Background/detached mode
python3 launcher.py start --detach

# Without NVIDIA Riva TTS
python3 launcher.py start --no-riva

# Production + detached
python3 launcher.py start --prod --detach
```

Services started:
- Frontend (React) - http://localhost:3000
- Backend (FastAPI) - http://localhost:8000
- Database (SQLite)
- NVIDIA Riva TTS (optional) - http://localhost:8001

### Stop Command

Stop all running services:

```bash
python3 launcher.py stop
```

Stops:
- All Docker containers
- NVIDIA Riva TTS server (if running)

### Restart Command

Restart all services:

```bash
# Development mode
python3 launcher.py restart

# Production mode
python3 launcher.py restart --prod
```

### Logs Command

View service logs:

```bash
# All services (follow mode)
python3 launcher.py logs

# Specific service
python3 launcher.py logs backend
python3 launcher.py logs frontend

# No follow (one-time output)
python3 launcher.py logs --no-follow
```

### Status Command

Check service status:

```bash
python3 launcher.py status
```

Shows:
- Running containers
- Service health
- Port bindings

### Test Command

Run all tests:

```bash
python3 launcher.py test
```

Runs:
- Backend Python tests (pytest)
- Frontend React tests (npm test)

### Clean Command

Clean up project (removes containers, volumes, dependencies):

```bash
python3 launcher.py clean
```

⚠️ **Warning**: This removes:
- Docker containers and volumes
- `frontend/node_modules`
- `frontend/build`
- Backend cache files

## Command-Line Options

### Global Options

| Option | Short | Description |
|--------|-------|-------------|
| `--help` | `-h` | Show help message |
| `--prod` | | Run in production mode |
| `--detach` | `-d` | Run in background (detached) |
| `--no-follow` | | Don't follow logs (one-time output) |
| `--no-riva` | | Skip NVIDIA Riva TTS startup |
| `--skip-setup` | | Skip automatic first-run setup |

### Examples

```bash
# First run (automatic setup)
python3 launcher.py

# Manual setup only
python3 launcher.py setup

# Start in development mode (with logs)
python3 launcher.py start

# Start in production, background mode
python3 launcher.py start --prod --detach

# Start without Riva TTS
python3 launcher.py start --no-riva

# View backend logs
python3 launcher.py logs backend

# Check service status
python3 launcher.py status

# Stop all services
python3 launcher.py stop
```

## System Requirements

### Required

- **Docker Desktop** v20.10+
- **Python** 3.10 or higher
- **Node.js** v16+ (includes npm)
- **Docker Compose** (usually included with Docker Desktop)

### Optional

- **NVIDIA GPU** + nvidia-docker (for Riva TTS)
- **Git** (for cloning repository)

### Installation Links

If any requirements are missing, install them:

- **Docker Desktop**: https://docs.docker.com/get-docker/
- **Python 3.10+**: https://www.python.org/downloads/
- **Node.js**: https://nodejs.org/

## First Run Behavior

The launcher automatically detects first run by checking for:
- `backend/venv` directory
- `frontend/node_modules` directory
- `.env` file

If none exist, it triggers automatic setup.

### Skip First-Run Setup

To skip automatic setup:

```bash
python3 launcher.py --skip-setup start
```

## Environment Configuration

### Required Environment Variables

```env
NVIDIA_API_KEY=nvapi-xxxxx    # Required
OPENAI_API_KEY=sk-xxxxx       # Required
```

### Optional Environment Variables

```env
# Premium TTS
ELEVENLABS_API_KEY=xxxxx

# Alternative vision API
ANTHROPIC_API_KEY=sk-ant-xxxxx

# Emergency calling
TWILIO_ACCOUNT_SID=xxxxx
TWILIO_AUTH_TOKEN=xxxxx
TWILIO_PHONE_NUMBER=+1234567890

# Server configuration
BACKEND_HOST=0.0.0.0
BACKEND_PORT=8000
FRONTEND_PORT=3000

# Logging
LOG_LEVEL=INFO
LOG_FORMAT=json
LOG_REQUESTS=true

# CORS
CORS_ORIGINS=*
```

## Troubleshooting

### Missing Dependencies

If you see "NOT installed" errors:

```bash
# Install missing tools first, then re-run setup
python3 launcher.py setup
```

### Port Already in Use

If ports 3000 or 8000 are in use:

```bash
# Find and kill the process
lsof -i :3000
lsof -i :8000
kill -9 <PID>

# Or change ports in docker-compose.yml
```

### Virtual Environment Issues

If venv creation fails:

```bash
# Install venv module
python3 -m pip install virtualenv

# Manually create venv
cd backend
python3 -m venv venv
source venv/bin/activate  # Linux/Mac
# or: venv\Scripts\activate  # Windows
pip install -r requirements.txt
```

### npm Install Fails

If frontend dependency installation fails:

```bash
# Clear npm cache
cd frontend
npm cache clean --force
rm -rf node_modules package-lock.json
npm install
```

### Docker Issues

If Docker services won't start:

```bash
# Check Docker is running
docker ps

# Clean up and restart
docker compose down -v
python3 launcher.py start
```

### Database Initialization Failed

If database setup fails:

```bash
# Manually initialize database
cd backend
source venv/bin/activate
python -c "from app.database.db import init_db; init_db()"
```

## Advanced Usage

### Manual Dependency Installation

If automatic installation fails, install manually:

**Backend:**
```bash
cd backend
python3 -m venv venv
source venv/bin/activate  # Linux/Mac
# or: venv\Scripts\activate  # Windows
pip install --upgrade pip
pip install -r requirements.txt
```

**Frontend:**
```bash
cd frontend
npm install
```

### Development Mode vs Production Mode

**Development Mode** (`--dev`, default):
- Source maps enabled
- Hot reload
- Verbose logging
- Adminer database UI (http://localhost:8080)

**Production Mode** (`--prod`):
- Optimized builds
- No source maps
- Production logging
- Better performance

### Running Services Separately

Instead of using Docker, you can run services manually:

**Backend:**
```bash
cd backend
source venv/bin/activate
python run.py
```

**Frontend:**
```bash
cd frontend
npm start
```

## NVIDIA Riva TTS (Optional)

The launcher includes auto-setup for NVIDIA Riva TTS (high-quality voice):

### First Run

You'll be prompted for:
1. NGC API key (get at https://ngc.nvidia.com/setup/api-key)
2. Model download (~5GB, 10-30 minutes)

### Subsequent Runs

Riva starts automatically (unless `--no-riva` flag used).

### Skip Riva

```bash
python3 launcher.py start --no-riva
```

### Manual Riva Setup

```bash
bash setup_riva_local.sh
cd ~/riva
bash riva_init.sh
bash riva_start.sh
```

## Tips & Best Practices

1. **First Run**: Always run `python3 launcher.py setup` first
2. **API Keys**: Configure `.env` before starting services
3. **Development**: Use `--detach` for background mode
4. **Logs**: Monitor logs with `python3 launcher.py logs`
5. **Cleanup**: Run `clean` before major updates
6. **Updates**: After pulling code, re-run `setup`

## Support

For issues or questions:
- Check logs: `python3 launcher.py logs`
- Check status: `python3 launcher.py status`
- See API docs: http://localhost:8000/docs (when running)
- GitHub Issues: [Report an issue](https://github.com/yourusername/nvidia_hackathon/issues)

## Summary

The launcher.py script provides:
- ✅ Automatic dependency installation
- ✅ Environment configuration
- ✅ Database initialization
- ✅ Service management
- ✅ First-run detection
- ✅ Cross-platform support
- ✅ NVIDIA Riva TTS integration
- ✅ Production-ready deployment

Just run `python3 launcher.py` and you're ready to go!
