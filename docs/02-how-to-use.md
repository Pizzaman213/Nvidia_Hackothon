# AI Babysitter Launcher - How to Use

## Table of Contents
1. [Getting Started](#getting-started)
2. [Command Reference](#command-reference)
3. [Common Workflows](#common-workflows)
4. [Command Options](#command-options)
5. [Troubleshooting](#troubleshooting)

---

## Getting Started

### Installation

The launcher comes with the AI Babysitter project. No separate installation needed.

### First Time Setup

```bash
# Navigate to project directory
cd /path/to/Nvidia_hackathon

# Make launcher executable (optional)
chmod +x launcher.py

# Run setup
python launcher.py setup
```

The setup command will:
1. Check if Docker and Docker Compose are installed
2. Create a `.env` file from `.env.example` if missing
3. Create necessary directories
4. Install backend dependencies
5. Install frontend dependencies

### Configuration

Before starting services, edit your `.env` file:

```bash
# Edit the environment file
nano .env

# Add your API keys:
NVIDIA_API_KEY=your_nvidia_key_here
OPENAI_API_KEY=your_openai_key_here
```

---

## Command Reference

### `setup` - Initial Project Setup

**Purpose**: Prepare the project for first use

**Usage**:
```bash
python launcher.py setup
```

**What it does**:
- Checks for required tools (Docker, Docker Compose, Python)
- Creates `.env` file if missing
- Creates necessary directories
- Installs backend Python packages
- Installs frontend Node.js packages

**When to use**:
- First time setting up the project
- After cloning the repository
- When dependencies are missing or corrupted

**Example output**:
```
============================================================
               Checking Requirements
============================================================

✓ docker is installed
✓ docker-compose is installed
✓ python is installed

============================================================
          Checking Environment Configuration
============================================================

⚠ .env file not found
ℹ Creating .env from .env.example...
✓ .env file created
⚠ Please edit .env and add your API keys!
```

---

### `start` - Start All Services

**Purpose**: Launch the entire application stack

**Usage**:
```bash
python launcher.py start [OPTIONS]
```

**Options**:
- `--prod`: Start in production mode
- `--detach` or `-d`: Run in background (detached mode)

**Examples**:
```bash
# Start in development mode (foreground)
python launcher.py start

# Start in development mode (background)
python launcher.py start -d

# Start in production mode (background)
python launcher.py start --prod -d
```

**What it does**:
- Validates requirements and configuration
- Builds Docker containers (first time or after changes)
- Starts all services:
  - Backend API (FastAPI) on port 8000
  - Frontend (React) on port 3000
  - Database (PostgreSQL) on port 5432
  - Adminer (dev mode only) on port 8080
- Shows service URLs when running in detached mode

**Development vs Production Mode**:

| Feature | Development Mode | Production Mode |
|---------|-----------------|-----------------|
| Hot reload | ✅ Enabled | ❌ Disabled |
| Debug mode | ✅ Enabled | ❌ Disabled |
| Adminer | ✅ Available | ❌ Not included |
| Volumes | Source code mounted | Build artifacts only |
| Optimization | Faster startup | Better performance |

**Example output (detached)**:
```
============================================================
          Starting Services (dev mode)
============================================================

ℹ Building and starting containers...
ℹ This may take a few minutes on first run...
✓ Services started in background

Services running at:
  • Frontend: http://localhost:3000
  • Backend:  http://localhost:8000
  • API Docs: http://localhost:8000/docs
  • Adminer:  http://localhost:8080

View logs: python launcher.py logs
Stop services: python launcher.py stop
```

---

### `stop` - Stop All Services

**Purpose**: Gracefully shut down all running services

**Usage**:
```bash
python launcher.py stop
```

**What it does**:
- Sends stop signal to all containers
- Waits for graceful shutdown
- Removes containers (but keeps volumes)
- Network cleanup

**Example output**:
```
============================================================
                  Stopping Services
============================================================

✓ Services stopped
```

**Note**: This does NOT remove:
- Docker images (can be reused)
- Database volumes (data persists)
- Build artifacts

---

### `restart` - Restart All Services

**Purpose**: Stop and start services (useful after code changes)

**Usage**:
```bash
python launcher.py restart [--prod]
```

**Options**:
- `--prod`: Restart in production mode

**What it does**:
1. Stops all running services
2. Waits 2 seconds
3. Starts services again (in detached mode)

**When to use**:
- After making backend code changes
- After updating environment variables
- After changing configuration files
- When services are behaving unexpectedly

**Example**:
```bash
# Restart in development mode
python launcher.py restart

# Restart in production mode
python launcher.py restart --prod
```

---

### `logs` - View Service Logs

**Purpose**: Display logs from running services

**Usage**:
```bash
python launcher.py logs [SERVICE] [OPTIONS]
```

**Arguments**:
- `SERVICE` (optional): Specific service name (backend, frontend, db, adminer)

**Options**:
- `--no-follow`: Show logs without following (non-interactive)

**Examples**:
```bash
# View all logs (live, following)
python launcher.py logs

# View only backend logs (live)
python launcher.py logs backend

# View frontend logs (live)
python launcher.py logs frontend

# View all logs (static, exit after showing)
python launcher.py logs --no-follow

# View backend logs (static)
python launcher.py logs backend --no-follow
```

**Tips**:
- Press `Ctrl+C` to exit log viewing
- Use `--no-follow` for scripting or one-time checks
- Combine with `grep` for filtering:
  ```bash
  python launcher.py logs backend --no-follow | grep ERROR
  ```

**Example output**:
```
backend_1   | INFO:     Started server process [1]
backend_1   | INFO:     Waiting for application startup.
backend_1   | INFO:     Application startup complete.
frontend_1  | Compiled successfully!
frontend_1  | webpack compiled in 2543 ms
```

---

### `status` - Check Service Status

**Purpose**: Show current state of all services

**Usage**:
```bash
python launcher.py status
```

**What it shows**:
- Service names
- Current state (Up, Down, Restarting, etc.)
- Ports exposed
- Health status

**Example output**:
```
============================================================
                  Service Status
============================================================

NAME                STATE      PORTS
backend_1           Up         0.0.0.0:8000->8000/tcp
frontend_1          Up         0.0.0.0:3000->3000/tcp
db_1                Up         5432/tcp
adminer_1           Up         0.0.0.0:8080->8080/tcp
```

**Use cases**:
- Quick check if services are running
- Verify which ports are in use
- Troubleshooting startup issues

---

### `test` - Run Tests

**Purpose**: Execute automated tests for backend and/or frontend

**Usage**:
```bash
python launcher.py test
```

**What it does**:
- Runs backend tests using pytest
- Runs frontend tests using npm test
- Shows test results and coverage

**Example output**:
```
============================================================
                Running all Tests
============================================================

ℹ Running backend tests...
======================== test session starts ========================
collected 24 items

tests/test_api.py ........................                      [100%]

======================== 24 passed in 3.42s =========================
✓ All tests passed

ℹ Running frontend tests...
PASS  src/components/VoiceChat.test.tsx
PASS  src/services/api.test.ts

Test Suites: 2 passed, 2 total
Tests:       15 passed, 15 total
✓ All tests passed
```

---

### `clean` - Clean Up Project

**Purpose**: Remove all containers, volumes, and build artifacts

**Usage**:
```bash
python launcher.py clean
```

**⚠️ WARNING**: This is a destructive operation!

**What it removes**:
- All Docker containers
- All Docker volumes (INCLUDING DATABASE DATA)
- Frontend build directory
- Frontend node_modules
- Backend Python cache

**Interactive confirmation**:
```
============================================================
                  Cleaning Project
============================================================

⚠ This will remove all containers, volumes, and build artifacts!
Are you sure? (yes/no): yes

ℹ Removing Docker volumes...
ℹ Cleaning frontend build...
ℹ Cleaning backend cache...
✓ Project cleaned
```

**When to use**:
- Starting completely fresh
- Freeing up disk space
- Troubleshooting persistent issues
- Before re-cloning repository

**After cleaning**:
```bash
# Reinstall everything
python launcher.py setup

# Start fresh
python launcher.py start
```

---

## Common Workflows

### Daily Development Workflow

```bash
# 1. Start your day
python launcher.py start -d

# 2. Make code changes...

# 3. Check logs if needed
python launcher.py logs backend

# 4. Restart to apply changes
python launcher.py restart

# 5. Run tests before committing
python launcher.py test

# 6. End of day
python launcher.py stop
```

### Debugging Issues

```bash
# 1. Check what's running
python launcher.py status

# 2. View logs for errors
python launcher.py logs

# 3. Look at specific service
python launcher.py logs backend

# 4. Try restarting
python launcher.py restart

# 5. If still broken, clean start
python launcher.py stop
python launcher.py clean
python launcher.py setup
python launcher.py start
```

### Testing Before Deployment

```bash
# 1. Test in development mode
python launcher.py start -d
python launcher.py test

# 2. Test in production mode
python launcher.py stop
python launcher.py start --prod -d
# Manually test functionality

# 3. Check logs for errors
python launcher.py logs --no-follow
```

### New Developer Onboarding

```bash
# 1. Clone repository
git clone <repo-url>
cd Nvidia_hackathon

# 2. Run setup
python launcher.py setup

# 3. Add API keys to .env
nano .env

# 4. Start services
python launcher.py start -d

# 5. Verify everything works
python launcher.py status
python launcher.py test
```

---

## Command Options

### Global Options

These work with multiple commands:

#### `--prod`
- **Available for**: `start`, `restart`
- **Purpose**: Use production configuration
- **Effect**: Disables debug mode, enables optimizations

```bash
python launcher.py start --prod
python launcher.py restart --prod
```

#### `--detach` or `-d`
- **Available for**: `start`
- **Purpose**: Run services in background
- **Effect**: Returns control to terminal immediately

```bash
python launcher.py start -d
python launcher.py start --detach
```

#### `--no-follow`
- **Available for**: `logs`
- **Purpose**: Show logs without following
- **Effect**: Display logs and exit (non-interactive)

```bash
python launcher.py logs --no-follow
python launcher.py logs backend --no-follow
```

---

## Troubleshooting

### Error: "docker is NOT installed"

**Problem**: Docker is not installed or not in PATH

**Solution**:
```bash
# macOS (using Homebrew)
brew install --cask docker

# Or download Docker Desktop from:
# https://www.docker.com/products/docker-desktop
```

### Error: "Command failed: docker-compose up"

**Problem**: Docker daemon is not running

**Solution**:
- Start Docker Desktop application
- Or on Linux: `sudo systemctl start docker`

### Error: "Missing or placeholder API keys"

**Problem**: `.env` file doesn't have valid API keys

**Solution**:
```bash
# Edit .env file
nano .env

# Add real API keys:
NVIDIA_API_KEY=nvapi-xxxxxxxxxxxxx
OPENAI_API_KEY=sk-xxxxxxxxxxxxx

# Save and try again
python launcher.py start
```

### Services won't start

**Problem**: Ports already in use

**Solution**:
```bash
# Find what's using the port
lsof -i :3000  # Frontend
lsof -i :8000  # Backend

# Kill the process or stop conflicting service
kill -9 <PID>

# Or change ports in docker-compose.yml
```

### "Database locked" errors

**Problem**: SQLite database conflicts

**Solution**:
```bash
# Stop everything
python launcher.py stop

# Clean and restart
python launcher.py clean
python launcher.py setup
python launcher.py start
```

### Containers keep restarting

**Problem**: Service crashes on startup

**Solution**:
```bash
# Check logs for error messages
python launcher.py logs backend --no-follow

# Common causes:
# - Missing API keys
# - Port conflicts
# - Configuration errors

# Try clean restart
python launcher.py clean
python launcher.py setup
python launcher.py start
```

---

## Advanced Usage

### Custom Docker Compose Files

The launcher uses these files:
- `docker-compose.yml`: Base configuration
- `docker-compose.dev.yml`: Development overrides

To modify services:
1. Edit the appropriate compose file
2. Restart services: `python launcher.py restart`

### Environment Variables

Override launcher behavior:

```bash
# Use different compose files
export COMPOSE_FILE=docker-compose.custom.yml
python launcher.py start

# Change Docker Compose command
alias docker-compose='docker compose'  # Use newer syntax
python launcher.py start
```

### Running Individual Services

If you need just one service:

```bash
# Start only backend
docker-compose up backend

# Start only frontend
docker-compose up frontend
```

---

## Help Command

Get quick help:

```bash
# Show all available commands
python launcher.py --help

# Example output shows usage and examples
```

---

## Next Steps

- **[Overview](01-overview.md)**: Understand what the launcher does
- **[How It Works](03-how-it-works.md)**: Learn technical implementation details

---

**Need more help?** Check the logs or status first, then refer to the troubleshooting section above.
