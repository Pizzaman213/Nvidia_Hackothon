# AI Babysitter - Complete Setup and Deployment Guide

**Version**: 1.0.0
**Last Updated**: October 31, 2025
**Status**: Production Ready

---

## Table of Contents

1. [Quick Start (5 Minutes)](#quick-start-5-minutes)
2. [Prerequisites](#prerequisites)
3. [Installation](#installation)
4. [Configuration](#configuration)
5. [Running the Application](#running-the-application)
6. [Testing](#testing)
7. [Troubleshooting](#troubleshooting)
8. [Deployment](#deployment)
9. [Logging and Monitoring](#logging-and-monitoring)
10. [Quick Reference](#quick-reference)
11. [Advanced Configuration](#advanced-configuration)

---

## Quick Start (5 Minutes)

For impatient developers who want to get started immediately:

```bash
# 1. Navigate to project directory
cd Nvidia_hackathon

# 2. Run initial setup
./setup.sh

# 3. Add API keys to .env file
nano .env
# Add: NVIDIA_API_KEY=nvapi-xxxxx
# Add: OPENAI_API_KEY=sk-xxxxx

# 4. Start all services
./launcher.sh start --detach

# 5. Access the application
open http://localhost:3000
```

**That's it!** Your AI Babysitter is running at http://localhost:3000

---

## Prerequisites

### Required Software

- **Docker Desktop**: v20.10+ (with Docker Compose v2.0+)
- **Python**: 3.10 or higher
- **Node.js**: 20.x or higher (for frontend development)
- **Modern Browser**: Chrome or Edge (recommended for voice/camera features)

### Required API Keys

- **NVIDIA API Key** (Required): Get from https://build.nvidia.com/
- **OpenAI API Key** (Required for vision): Get from https://platform.openai.com/

### Optional API Keys

- **ElevenLabs API Key**: For premium voice synthesis (https://elevenlabs.io/)
- **Anthropic API Key**: Alternative vision provider (https://console.anthropic.com/)

### System Requirements

- **Memory**: At least 4GB RAM available
- **Disk Space**: At least 2GB free
- **Ports**: 3000, 8000, 5432, 6379 must be available
- **Internet**: Active connection for API calls and initial setup

### Verification Checklist

Run these commands to verify prerequisites:

```bash
# Check Docker
docker --version
# Expected: Docker version 20.10.0+

# Check Docker Compose
docker compose version
# Expected: Docker Compose version v2.0.0+

# Check Python
python3 --version
# Expected: Python 3.10.0+

# Check Node (if developing frontend)
node --version
# Expected: v20.0.0+

# Check Docker is running
docker ps
# Should show active containers or empty list (no error)

# Check ports are available
lsof -i :3000 :8000 :5432 :6379
# Should show no processes using these ports
```

---

## Installation

### Step 1: Initial Setup

```bash
# Clone or navigate to project directory
cd /Users/connorsecrist/Nvidia_hackathon

# Run setup script
./setup.sh
```

**The setup script will:**
- ✅ Verify Docker and Docker Compose are installed
- ✅ Verify Python is installed
- ✅ Create `.env` file from template
- ✅ Make launcher scripts executable
- ✅ Create necessary directories

**Expected Output:**
```
✓ Docker installed (28.5.1)
✓ Docker Compose installed (v2.40.0)
✓ Python installed (3.13.7)
✓ .env file created
✓ Launcher scripts made executable
✓ Created necessary directories
✓ Setup completed successfully!
```

### Step 2: Backend Dependencies (Optional - for local development)

If you plan to run the backend locally (outside Docker):

```bash
cd backend

# Create virtual environment
python3 -m venv venv

# Activate virtual environment
source venv/bin/activate  # On macOS/Linux
# OR
venv\Scripts\activate     # On Windows

# Install dependencies
pip install -r requirements.txt
```

**Key Dependencies:**
- `fastapi==0.120.2` - Backend framework
- `uvicorn==0.38.0` - ASGI server
- `sqlalchemy==2.0.44` - Database ORM
- `openai==2.6.1` - OpenAI API client
- `chromadb` - Vector database for RAG
- `sentence-transformers` - Embeddings model

### Step 3: Frontend Dependencies (Optional - for local development)

If you plan to run the frontend locally (outside Docker):

```bash
cd frontend

# Install dependencies
npm install
```

**Key Dependencies:**
- `react==18.3.1` - UI framework
- `react-router-dom==6.x` - Routing
- `axios` - HTTP client
- `tailwindcss==3.4.18` - Styling

---

## Configuration

### Environment Variables Setup

Edit the `.env` file in the project root:

```bash
nano .env
```

### Required Configuration

```env
# ==========================================
# NVIDIA Nemotron LLM (Required)
# ==========================================
NVIDIA_API_KEY=nvapi-xxxxxxxxxxxxxxxxxxxxx
NVIDIA_BASE_URL=https://integrate.api.nvidia.com/v1
NVIDIA_MODEL=llama-3.3-nemotron-super-49b-v1.5

# ==========================================
# OpenAI (Required for vision)
# ==========================================
OPENAI_API_KEY=sk-xxxxxxxxxxxxxxxxxxxxx

# ==========================================
# Database
# ==========================================
DATABASE_URL=sqlite:///./babysitter.db

# ==========================================
# Security
# ==========================================
SECRET_KEY=your-secret-key-min-32-characters
```

### Optional Configuration

```env
# ==========================================
# NVIDIA Cosmos Vision (Recommended)
# ==========================================
NVIDIA_COSMOS_ENABLED=True
NVIDIA_COSMOS_MODEL=nvidia/cosmos-reason1-7b
NVIDIA_COSMOS_BASE_URL=https://integrate.api.nvidia.com/v1

# ==========================================
# Alternative Vision Providers
# ==========================================
ANTHROPIC_API_KEY=sk-ant-xxxxxxxxxxxxxxxxxxxxx

# ==========================================
# Premium Voice (ElevenLabs)
# ==========================================
ELEVENLABS_API_KEY=xxxxxxxxxxxxxxxxxxxxx

# ==========================================
# Server Configuration
# ==========================================
DEBUG=True
HOST=0.0.0.0
PORT=8000
```

### Logging Configuration

```env
# ==========================================
# Logging (Backend)
# ==========================================
LOGGING_ENABLED=True
LOG_LEVEL=INFO                    # DEBUG, INFO, WARNING, ERROR, CRITICAL
LOG_TO_FILE=True
LOG_TO_CONSOLE=True
LOG_FORMAT=text                   # text or json
LOG_REQUESTS=True
```

Frontend logging (in `frontend/.env`):

```env
# ==========================================
# Logging (Frontend)
# ==========================================
REACT_APP_LOGGING_ENABLED=true
REACT_APP_LOG_LEVEL=DEBUG        # DEBUG, INFO, WARN, ERROR
REACT_APP_LOG_CATEGORIES=        # Leave empty for all categories
REACT_APP_LOG_IN_PRODUCTION=false
```

### Getting API Keys

#### NVIDIA NGC Catalog

1. Visit https://build.nvidia.com/
2. Sign in or create NVIDIA account
3. Navigate to "Nemotron" or "Cosmos" models
4. Click "Get API Key"
5. Copy the key (starts with `nvapi-`)
6. Add to `.env` as `NVIDIA_API_KEY`

**Note**: The same NVIDIA API key works for both Nemotron LLM and Cosmos Vision.

#### OpenAI

1. Visit https://platform.openai.com/
2. Sign in or create account
3. Go to API Keys section
4. Create new secret key
5. Copy the key (starts with `sk-`)
6. Add to `.env` as `OPENAI_API_KEY`

#### ElevenLabs (Optional)

1. Visit https://elevenlabs.io/
2. Sign in or create account
3. Go to Profile → API Keys
4. Copy your API key
5. Add to `.env` as `ELEVENLABS_API_KEY`

### Generate Secure Secret Key

```bash
# Generate a secure random key
python3 -c "import secrets; print(secrets.token_urlsafe(32))"
```

Copy the output and use it for `SECRET_KEY` in `.env`.

---

## Running the Application

### Development Mode (Recommended for Testing)

Start all services with hot-reload enabled:

```bash
./launcher.sh start
```

Or with detached mode (runs in background):

```bash
./launcher.sh start --detach
```

**Services Started:**
- ✅ PostgreSQL database (port 5432)
- ✅ Redis cache (port 6379)
- ✅ FastAPI backend (port 8000)
- ✅ React frontend (port 3000)
- ✅ Adminer database admin (port 8080)

### Production Mode

```bash
./launcher.sh start --prod --detach
```

**Production Differences:**
- PostgreSQL instead of SQLite
- Optimized builds
- Debug mode disabled
- Nginx reverse proxy (if using `--profile production`)

### Using Python Launcher Directly

```bash
python launcher.py start --detach
```

Available commands:
- `start` - Start all services
- `stop` - Stop all services
- `restart` - Restart all services
- `status` - Check service status
- `logs` - View logs
- `test` - Run tests
- `clean` - Clean everything (containers, volumes, build artifacts)

### Running Services Individually

#### Backend Only (Local Development)

```bash
cd backend
source venv/bin/activate
python run.py

# Or with uvicorn directly
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

#### Frontend Only (Local Development)

```bash
cd frontend
npm start
```

**Note**: Frontend requires backend to be running at http://localhost:8000

### Access Points

Once services are running:

| Service | URL | Purpose |
|---------|-----|---------|
| **Frontend** | http://localhost:3000 | User interface |
| **Backend API** | http://localhost:8000 | API server |
| **API Docs** | http://localhost:8000/docs | Interactive API documentation |
| **Health Check** | http://localhost:8000/health | Backend health status |
| **Database Admin** | http://localhost:8080 | Adminer (PostgreSQL GUI) |

### Stopping Services

```bash
# Stop all services
./launcher.sh stop

# Or using Python launcher
python launcher.py stop
```

### Monitoring Services

```bash
# Check status
./launcher.sh status

# View all logs
./launcher.sh logs

# View specific service logs
./launcher.sh logs backend
./launcher.sh logs frontend

# Follow logs in real-time
./launcher.sh logs -f
```

---

## Testing

### Automated Testing

```bash
# Run all tests
./launcher.sh test

# Run backend tests only
cd backend
pytest tests/ -v

# Run with coverage
pytest tests/ --cov=app --cov-report=html
```

### Manual Testing Checklist

#### Frontend Tests

- [ ] **Application loads**: http://localhost:3000 accessible
- [ ] **No console errors**: Open DevTools (F12) → Console
- [ ] **Login page works**: Can select Child or Parent
- [ ] **Routing works**: Can navigate between pages

#### Child Interface Tests

- [ ] **Voice Recognition**:
  - Click microphone button
  - Grant permission when prompted
  - Speak and see transcript appear
  - AI responds with text and voice

- [ ] **Camera Interface**:
  - Click "Take Picture" button
  - Grant permission when prompted
  - Camera preview appears
  - Can capture photo
  - Camera stops after capture

- [ ] **Activity Selection**:
  - Can select different activities (Story Time, I Spy, Homework, Free Chat)
  - Activity changes reflected in UI

- [ ] **Message Display**:
  - Messages show in chat history
  - Child messages vs AI messages distinguished
  - Timestamps visible

#### Parent Dashboard Tests

- [ ] **Access Dashboard**: Navigate to parent view (PIN: 1234 for demo)
- [ ] **View Alerts**: Alerts tab shows safety alerts
- [ ] **View Activities**: Activities tab shows session history
- [ ] **View Settings**: Settings tab allows configuration
- [ ] **Citations Panel**: Sources tab shows RAG citations

#### Backend API Tests

```bash
# Health check
curl http://localhost:8000/health

# Expected response:
# {
#   "status": "healthy",
#   "nvidia_api_configured": true,
#   "openai_api_configured": true
# }

# Create session
curl -X POST http://localhost:8000/api/sessions \
  -H "Content-Type: application/json" \
  -d '{
    "child_name": "Test",
    "child_age": 8,
    "parent_id": "test_parent"
  }'

# Send chat message (replace SESSION_ID)
curl -X POST http://localhost:8000/api/chat \
  -H "Content-Type: application/json" \
  -d '{
    "session_id": "SESSION_ID",
    "message": "Hello!",
    "child_age": 8
  }'
```

#### Voice Features Tests

Browser compatibility:
- ✅ **Chrome/Edge**: Full support
- ⚠️ **Safari**: Limited support
- ❌ **Firefox**: Poor support

Test in browser console:
```javascript
// Check speech recognition support
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
console.log('Speech Recognition supported:', !!SpeechRecognition);

// Check speech synthesis support
console.log('Speech Synthesis supported:', !!window.speechSynthesis);

// Check camera support
console.log('Camera supported:', !!navigator.mediaDevices?.getUserMedia);
```

#### Database Tests

```bash
# Check database connection (via Adminer)
open http://localhost:8080

# Login credentials:
# System: PostgreSQL
# Server: db
# Username: postgres
# Password: postgres
# Database: babysitter

# Or via command line
docker exec babysitter-db psql -U postgres -d babysitter -c "\dt"
```

#### RAG System Tests

```bash
# Test citations API
curl http://localhost:8000/api/citations/sources

# Expected: List of cited sources (CDC, CPSC, etc.)
```

### Test Results Summary

Based on comprehensive testing (see TEST_RESULTS.md):

- **Total Tests**: 50+
- **Passed**: 50+ ✅
- **Failed**: 0 ❌
- **Success Rate**: 100%

**Status**: 🟢 **PRODUCTION READY**

---

## Troubleshooting

### Common Issues

#### 1. Services Won't Start

**Symptoms**: Docker containers fail to start or crash immediately

**Diagnostic Steps**:
```bash
# Check Docker is running
docker ps

# View logs for errors
./launcher.sh logs

# Check service status
./launcher.sh status
```

**Solutions**:
```bash
# Clean and restart
./launcher.sh clean
./launcher.sh start

# If ports are in use:
lsof -i :3000  # Check what's using port 3000
lsof -i :8000  # Check what's using port 8000

# Kill processes or change ports in docker-compose.yml
```

#### 2. API Keys Not Working

**Symptoms**: "API key not configured" or authentication errors

**Diagnostic Steps**:
```bash
# Verify .env file has valid keys
cat .env | grep -E "NVIDIA_API_KEY|OPENAI_API_KEY"

# Check for placeholder values
grep "your_" .env
grep "test_" .env
```

**Solutions**:
```bash
# Edit .env and add real API keys
nano .env

# Restart services to pick up changes
./launcher.sh restart

# Verify keys are loaded
curl http://localhost:8000/health
# Check: "nvidia_api_configured": true
```

#### 3. Frontend Can't Connect to Backend

**Symptoms**: Network errors, CORS errors, API calls failing

**Diagnostic Steps**:
```bash
# Check backend is running
curl http://localhost:8000/health

# Check frontend .env
cat frontend/.env | grep API_URL
# Should be: REACT_APP_API_URL=http://localhost:8000

# Check browser console for errors
# Open DevTools (F12) → Console
```

**Solutions**:
```bash
# Verify both services are running
./launcher.sh status

# Check backend logs
./launcher.sh logs backend

# Restart frontend
docker-compose restart frontend
```

#### 4. Database Errors

**Symptoms**: "OperationalError", "no such column", "database locked"

**Solutions**:
```bash
# Run database migrations
docker exec babysitter-backend python /app/init_db.py

# Or restart backend (migrations run automatically)
docker-compose restart backend

# If database is corrupted (data will be lost):
./launcher.sh stop
rm backend/babysitter.db
./launcher.sh start
```

#### 5. Voice Recognition Not Working

**Symptoms**: Microphone button doesn't work, no transcript appears

**Browser Requirements**:
- Chrome/Edge: ✅ Best support
- Safari: ⚠️ Limited support
- Firefox: ❌ Poor support

**Solutions**:
```bash
# Use Chrome or Edge browser

# Check microphone permissions in browser settings

# Close other apps using microphone (Zoom, Teams, etc.)

# Test microphone in browser console:
navigator.mediaDevices.getUserMedia({audio: true})
  .then(() => console.log('✓ Microphone works'))
  .catch(err => console.error('✗ Microphone error:', err));
```

#### 6. Camera Not Working

**Symptoms**: Camera preview doesn't appear, permission denied

**Requirements**:
- Must use HTTPS in production (or localhost for dev)
- Browser must support getUserMedia API
- Camera permission must be granted

**Solutions**:
```bash
# Use Chrome or Edge browser

# Check camera permissions in browser settings

# Close other apps using camera

# Test camera in browser console:
navigator.mediaDevices.getUserMedia({video: true})
  .then(stream => {
    console.log('✓ Camera works');
    stream.getTracks().forEach(t => t.stop());
  })
  .catch(err => console.error('✗ Camera error:', err));
```

#### 7. Image Analysis Failing

**Symptoms**: "Vision analysis unavailable" error

**Diagnostic Steps**:
```bash
# Check API keys
cat .env | grep -E "OPENAI_API_KEY|NVIDIA_COSMOS_ENABLED"

# Check backend logs
./launcher.sh logs backend | grep -i vision
```

**Solutions**:
```bash
# Ensure at least one vision API is configured:
# Option 1: OpenAI (easiest)
OPENAI_API_KEY=sk-your_real_key_here

# Option 2: NVIDIA Cosmos
NVIDIA_COSMOS_ENABLED=True
NVIDIA_COSMOS_MODEL=nvidia/cosmos-reason1-7b

# Restart backend
./launcher.sh restart backend
```

#### 8. Port Already in Use

**Symptoms**: "Address already in use" error

**Find and Kill Process**:
```bash
# Find process using port
lsof -i :3000

# Kill process
kill -9 <PID>

# Or change port in docker-compose.yml
```

#### 9. Docker Permission Errors

**Symptoms**: "permission denied" when running docker commands

**Solutions**:
```bash
# Add user to docker group (Linux)
sudo usermod -aG docker $USER
newgrp docker

# On macOS, restart Docker Desktop
```

#### 10. Build Failures

**Symptoms**: Docker build fails, dependency errors

**Solutions**:
```bash
# Clear cache and rebuild
docker-compose build --no-cache

# Remove old images
docker system prune -a

# Rebuild from scratch
./launcher.sh clean
./launcher.sh start --build
```

### Emergency Reset

If everything is broken and you need a fresh start:

```bash
# WARNING: This deletes all data!

# 1. Stop all containers
./launcher.sh stop

# 2. Remove database
rm backend/babysitter.db

# 3. Clear Docker cache
docker system prune -af
docker volume prune -f

# 4. Rebuild and start
./launcher.sh start --build

# 5. Verify
curl http://localhost:8000/health
open http://localhost:3000
```

### Debug Mode

Enable detailed logging for troubleshooting:

```bash
# Backend debug mode
echo "DEBUG=True" >> .env
echo "LOG_LEVEL=DEBUG" >> .env

# Frontend debug mode
echo "REACT_APP_LOG_LEVEL=DEBUG" >> frontend/.env

# Restart services
./launcher.sh restart

# View detailed logs
./launcher.sh logs -f
```

### Getting Help

If you're still stuck:

1. **Check logs first**: `./launcher.sh logs`
2. **Check this guide**: Look for similar issues above
3. **Check browser console**: For frontend issues (F12)
4. **Check API documentation**: http://localhost:8000/docs
5. **Check environment**: Verify `.env` files are configured

---

## Deployment

### Local Production Mode

```bash
# Update .env for production
DEBUG=False
DATABASE_URL=postgresql://postgres:postgres@db:5432/babysitter
SECRET_KEY=<generate-secure-key>
ALLOWED_ORIGINS=https://yourdomain.com

# Generate secure secret key
python3 -c "import secrets; print(secrets.token_urlsafe(32))"

# Start in production mode
./launcher.sh start --prod --detach
```

### Docker Deployment

#### Build Images

```bash
# Build all images
docker-compose build

# Build specific service
docker-compose build backend
docker-compose build frontend
```

#### Run Containers

```bash
# Start all services
docker-compose up -d

# Start with production profile
docker-compose --profile production up -d

# Check status
docker-compose ps

# View logs
docker-compose logs -f
```

### Cloud Deployment

#### Prerequisites

- Docker-compatible cloud platform (AWS, GCP, Azure, DigitalOcean)
- Domain name (for HTTPS)
- SSL certificate (Let's Encrypt recommended)

#### AWS Deployment Example

```bash
# 1. Push to ECR
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin <account-id>.dkr.ecr.us-east-1.amazonaws.com

docker tag ai-babysitter-backend <account-id>.dkr.ecr.us-east-1.amazonaws.com/ai-babysitter-backend:latest
docker push <account-id>.dkr.ecr.us-east-1.amazonaws.com/ai-babysitter-backend:latest

docker tag ai-babysitter-frontend <account-id>.dkr.ecr.us-east-1.amazonaws.com/ai-babysitter-frontend:latest
docker push <account-id>.dkr.ecr.us-east-1.amazonaws.com/ai-babysitter-frontend:latest

# 2. Deploy to ECS/EKS
# (Use your preferred deployment method)

# 3. Configure environment variables in AWS Console
# 4. Set up load balancer and SSL
# 5. Point domain to load balancer
```

#### VPS Deployment (DigitalOcean, Linode, etc.)

```bash
# 1. SSH into VPS
ssh user@your-server.com

# 2. Clone repository
git clone <your-repo>
cd Nvidia_hackathon

# 3. Copy .env file (don't commit to git!)
scp .env user@your-server.com:~/Nvidia_hackathon/

# 4. Install Docker and Docker Compose
# (Follow official docs for your OS)

# 5. Start services
docker-compose --profile production up -d

# 6. Configure nginx reverse proxy (optional)
# 7. Set up SSL with Let's Encrypt
```

### SSL/TLS Configuration

#### Let's Encrypt (Recommended)

```bash
# Install certbot
sudo apt install certbot python3-certbot-nginx

# Obtain certificate
sudo certbot --nginx -d yourdomain.com

# Auto-renewal (certbot sets this up automatically)
sudo certbot renew --dry-run
```

#### nginx Configuration

Create `/etc/nginx/sites-available/ai-babysitter`:

```nginx
server {
    listen 80;
    server_name yourdomain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name yourdomain.com;

    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;

    # Frontend
    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Backend API
    location /api/ {
        proxy_pass http://localhost:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # WebSocket
    location /ws/ {
        proxy_pass http://localhost:8000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
    }
}
```

Enable and restart:
```bash
sudo ln -s /etc/nginx/sites-available/ai-babysitter /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### Production Checklist

Before deploying to production:

- [ ] Set `DEBUG=False` in .env
- [ ] Generate secure `SECRET_KEY`
- [ ] Configure PostgreSQL (not SQLite)
- [ ] Set up SSL certificates
- [ ] Configure CORS for your domain
- [ ] Enable firewall (ufw, iptables, cloud security groups)
- [ ] Set up automated backups
- [ ] Configure log rotation
- [ ] Set up monitoring (Sentry, Datadog, etc.)
- [ ] Test all features on production environment
- [ ] Document deployment process
- [ ] Set up CI/CD pipeline (optional)

### Backup and Recovery

#### Database Backup

```bash
# Backup PostgreSQL database
docker exec babysitter-db pg_dump -U postgres babysitter > backup.sql

# Automated backup script
cat > backup.sh << 'EOF'
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
docker exec babysitter-db pg_dump -U postgres babysitter > "backup_${DATE}.sql"
# Keep last 7 days
find . -name "backup_*.sql" -mtime +7 -delete
EOF

chmod +x backup.sh

# Schedule with cron (daily at 2 AM)
crontab -e
# Add: 0 2 * * * /path/to/backup.sh
```

#### Restore from Backup

```bash
# Stop services
./launcher.sh stop

# Restore database
docker exec -i babysitter-db psql -U postgres babysitter < backup.sql

# Start services
./launcher.sh start --detach
```

#### Volume Backup

```bash
# Backup Docker volumes
docker run --rm \
  -v nvidia_hackathon_postgres-data:/data \
  -v $(pwd):/backup \
  alpine tar czf /backup/postgres-data.tar.gz /data

docker run --rm \
  -v nvidia_hackathon_redis-data:/data \
  -v $(pwd):/backup \
  alpine tar czf /backup/redis-data.tar.gz /data
```

---

## Logging and Monitoring

### Backend Logging

#### Configuration

Backend logging is configured via environment variables in `.env`:

```env
LOGGING_ENABLED=True
LOG_LEVEL=INFO                # DEBUG, INFO, WARNING, ERROR, CRITICAL
LOG_TO_FILE=True
LOG_TO_CONSOLE=True
LOG_FORMAT=text               # text or json
LOG_REQUESTS=True
```

#### Log Levels

- **DEBUG**: Detailed debugging information
- **INFO**: General informational messages
- **WARNING**: Potential issues
- **ERROR**: Errors that don't crash the app
- **CRITICAL**: Critical errors

#### Configuration Examples

**Development (Verbose)**:
```env
LOGGING_ENABLED=True
LOG_LEVEL=DEBUG
LOG_TO_FILE=True
LOG_TO_CONSOLE=True
LOG_FORMAT=text
LOG_REQUESTS=True
```

**Production (Optimized)**:
```env
LOGGING_ENABLED=True
LOG_LEVEL=WARNING
LOG_TO_FILE=True
LOG_TO_CONSOLE=False
LOG_FORMAT=json
LOG_REQUESTS=True
```

**Production with Log Aggregation**:
```env
LOGGING_ENABLED=True
LOG_LEVEL=INFO
LOG_TO_FILE=False
LOG_TO_CONSOLE=True           # Captured by log aggregation service
LOG_FORMAT=json
LOG_REQUESTS=True
```

#### Viewing Logs

```bash
# View all logs
./launcher.sh logs

# View backend logs only
./launcher.sh logs backend

# Follow logs in real-time
./launcher.sh logs -f backend

# View log files (if LOG_TO_FILE=True)
tail -f backend/logs/app.log
tail -f backend/logs/error.log
```

#### Log Format Examples

**Text Format**:
```
2025-10-30 11:40:15 | INFO | app.api.chat:chat:47 | Chat request received
```

**JSON Format**:
```json
{
  "timestamp": "2025-10-30T11:40:15.123Z",
  "level": "INFO",
  "logger": "app.api.chat",
  "message": "Chat request received",
  "module": "chat",
  "function": "chat",
  "line": 47
}
```

### Frontend Logging

#### Configuration

Frontend logging is configured in `frontend/.env`:

```env
REACT_APP_LOGGING_ENABLED=true
REACT_APP_LOG_LEVEL=DEBUG       # DEBUG, INFO, WARN, ERROR
REACT_APP_LOG_CATEGORIES=       # Leave empty for all categories
REACT_APP_LOG_IN_PRODUCTION=false
```

#### Log Categories

- **API**: API calls and responses
- **SESSION**: Session management
- **VOICE**: Voice recognition and synthesis
- **CAMERA**: Camera operations
- **UI**: User interface events
- **WEBSOCKET**: WebSocket communications
- **SAFETY**: Safety alerts and concerns
- **GENERAL**: General application events

#### Viewing Frontend Logs

1. Open browser DevTools (F12)
2. Go to Console tab
3. Logs are color-coded:
   - 🔵 Blue = INFO
   - ⚪ Gray = DEBUG
   - 🟡 Yellow = WARN
   - 🔴 Red = ERROR

#### Filtering Logs

Use Chrome DevTools filter:
```
[API]       // Show only API logs
[VOICE]     // Show only voice logs
[CAMERA]    // Show only camera logs
[ERROR]     // Show only errors
```

#### Runtime Configuration

Change logging at runtime in browser console:

```javascript
// Disable logging
logger.setEnabled(false);

// Change log level
logger.setMinLevel(LogLevel.ERROR);

// Enable specific categories
logger.setCategories([LogCategory.API, LogCategory.CAMERA]);

// View current configuration
logger.getConfig();

// Export logs
logger.exportLogs();
```

### Monitoring

#### Health Checks

```bash
# Backend health
curl http://localhost:8000/health

# PostgreSQL health
docker exec babysitter-db pg_isready -U postgres

# Redis health
docker exec babysitter-redis redis-cli ping
```

#### Resource Monitoring

```bash
# Docker resource usage
docker stats

# Specific container
docker stats babysitter-backend

# System resource usage
htop
```

#### Application Monitoring

For production, consider integrating:

- **Sentry**: Error tracking and monitoring
- **Datadog**: Application performance monitoring
- **LogRocket**: Session replay and debugging
- **Google Analytics**: User analytics

### Log Rotation

For production deployments with file logging:

```bash
# Install logrotate
sudo apt install logrotate

# Create logrotate configuration
sudo nano /etc/logrotate.d/ai-babysitter

# Add configuration:
/path/to/Nvidia_hackathon/backend/logs/*.log {
    daily
    rotate 7
    compress
    delaycompress
    notifempty
    create 0644 user user
    sharedscripts
    postrotate
        docker-compose restart backend
    endscript
}
```

---

## Quick Reference

### Essential Commands

```bash
# Start application
./launcher.sh start --detach

# Stop application
./launcher.sh stop

# Restart application
./launcher.sh restart

# Check status
./launcher.sh status

# View logs
./launcher.sh logs

# Run tests
./launcher.sh test

# Clean everything
./launcher.sh clean
```

### Service URLs

| Service | URL |
|---------|-----|
| Frontend | http://localhost:3000 |
| Backend API | http://localhost:8000 |
| API Docs | http://localhost:8000/docs |
| Health Check | http://localhost:8000/health |
| Database Admin | http://localhost:8080 |

### Docker Commands

```bash
# View running containers
docker ps

# View all containers
docker ps -a

# View logs for specific container
docker logs babysitter-backend
docker logs babysitter-frontend

# Access container shell
docker exec -it babysitter-backend /bin/bash

# Restart specific container
docker-compose restart backend

# Rebuild specific container
docker-compose up -d --build backend

# Remove all containers
docker-compose down

# Remove all containers and volumes
docker-compose down -v
```

### Database Commands

```bash
# Access PostgreSQL
docker exec -it babysitter-db psql -U postgres -d babysitter

# Common SQL commands
\dt                  # List tables
\d sessions          # Describe table
SELECT * FROM sessions;
\q                   # Quit

# Backup database
docker exec babysitter-db pg_dump -U postgres babysitter > backup.sql

# Restore database
docker exec -i babysitter-db psql -U postgres babysitter < backup.sql
```

### API Endpoints

#### Session Management
```bash
# Create session
POST /api/sessions
Body: {"child_name": "Emma", "child_age": 8, "parent_id": "parent123"}

# Get session
GET /api/sessions/{session_id}

# End session
POST /api/sessions/{session_id}/end
```

#### Chat & LLM
```bash
# Send message
POST /api/chat
Body: {"session_id": "xxx", "message": "Hello", "child_age": 8}
```

#### Images
```bash
# Analyze image
POST /api/images/analyze
Form Data: session_id, context, child_age, image (file)
```

#### Alerts
```bash
# Get alerts
GET /api/alerts/{session_id}

# Get unresolved alerts
GET /api/alerts/{session_id}/unresolved

# Resolve alert
PUT /api/alerts/{alert_id}/resolve
```

### Diagnostic Commands

```bash
# Check backend health
curl http://localhost:8000/health

# Test API connectivity
curl http://localhost:8000/

# Check database connectivity
docker exec babysitter-db pg_isready -U postgres

# Check Redis connectivity
docker exec babysitter-redis redis-cli ping

# View backend logs
./launcher.sh logs backend | tail -50

# Check environment variables
docker exec babysitter-backend env | grep -E "NVIDIA|OPENAI"

# Check disk usage
docker system df

# Check port usage
lsof -i :3000
lsof -i :8000
```

### Quick Fixes

```bash
# Services won't start
./launcher.sh clean && ./launcher.sh start

# API keys not working
nano .env  # Edit keys
./launcher.sh restart

# Port already in use
lsof -i :8000 | grep LISTEN
kill -9 <PID>

# Database errors
docker exec babysitter-backend python /app/init_db.py

# Frontend can't connect
# Check: frontend/.env has REACT_APP_API_URL=http://localhost:8000
./launcher.sh restart frontend

# Clear all data (WARNING: Deletes everything)
./launcher.sh stop
docker-compose down -v
rm backend/babysitter.db
./launcher.sh start
```

---

## Advanced Configuration

### TTS (Text-to-Speech) Configuration

The system supports multiple TTS providers with automatic fallback:

#### Provider Priority

1. **NVIDIA Riva** (if enabled) - Highest quality, local processing
2. **ElevenLabs** (if API key set) - Premium quality
3. **OpenAI TTS** (if API key set) - Good quality
4. **gTTS** (always available) - Basic quality, free

#### Configuration

```env
# NVIDIA Riva (requires Linux + GPU)
NVIDIA_RIVA_ENABLED=False
NVIDIA_RIVA_LOCAL_URL=localhost:50051

# ElevenLabs (premium)
ELEVENLABS_API_KEY=your-key-here

# OpenAI TTS (already configured if you have OpenAI key)
OPENAI_API_KEY=sk-your-key-here

# gTTS is always available as fallback
```

#### Voice Styles

All providers support these styles:
- `friendly`: Warm, engaging (default)
- `calm`: Soothing, relaxed
- `excited`: Energetic, enthusiastic

### RAG (Retrieval-Augmented Generation) System

The system uses ChromaDB for knowledge base and citations:

#### Configuration

```bash
# Install RAG dependencies (if not already installed)
cd backend
pip install chromadb sentence-transformers
```

#### Verification

```bash
# Check knowledge base
curl http://localhost:8000/api/citations/sources

# Should return CDC/CPSC sources
```

#### Customization

Edit `backend/app/utils/ingest_knowledge.py` to add custom sources:

```python
{
    "text": """Your content here...""",
    "metadata": {
        "source_type": "cdc",
        "source_title": "Your Title",
        "source_url": "https://...",
        "topic": "your_topic",
        "age_range": "all"
    }
}
```

Then reset knowledge base:
```bash
rm -rf backend/data/chroma_db/
./launcher.sh restart backend
```

### Multi-Child Support

Enable multiple child profiles:

```bash
# Backend automatically supports multiple children
# Frontend needs configuration:

# Edit frontend/src/components/parent/ChildrenManager.tsx
# Add child management UI

# Database already has child_id support in sessions table
```

### Theming and Customization

#### Frontend Theme

Edit `frontend/src/index.css` for global styles.

Edit `frontend/tailwind.config.js` for Tailwind customization:

```javascript
module.exports = {
  theme: {
    extend: {
      colors: {
        primary: '#your-color',
        secondary: '#your-color',
      },
    },
  },
};
```

#### Logo and Branding

Replace files in `frontend/public/`:
- `logo.png` - Main logo
- `favicon.ico` - Browser icon
- `manifest.json` - PWA configuration

### Performance Tuning

#### Backend

```env
# Increase workers for production
# In Dockerfile or docker-compose.yml
command: uvicorn app.main:app --workers 4 --host 0.0.0.0 --port 8000
```

#### Database

```env
# Use connection pooling
DATABASE_URL=postgresql://postgres:postgres@db:5432/babysitter?pool_size=20&max_overflow=0
```

#### Frontend

```bash
# Build optimized production bundle
cd frontend
npm run build

# Analyze bundle size
npm install --save-dev source-map-explorer
npm run build
npx source-map-explorer 'build/static/js/*.js'
```

### Security Hardening

#### Production Environment Variables

```env
# Disable debug mode
DEBUG=False

# Use strong secret key
SECRET_KEY=<64-character-random-string>

# Restrict CORS
ALLOWED_ORIGINS=https://yourdomain.com

# Use HTTPS only
SECURE_SSL_REDIRECT=True

# Set secure cookie flags
SESSION_COOKIE_SECURE=True
CSRF_COOKIE_SECURE=True
```

#### Rate Limiting

Add to `backend/app/main.py`:

```python
from slowapi import Limiter
from slowapi.util import get_remote_address

limiter = Limiter(key_func=get_remote_address)
app.state.limiter = limiter

@app.post("/api/chat")
@limiter.limit("10/minute")
async def chat(request: Request):
    # ...
```

#### Authentication

For production, implement proper authentication:

```python
from fastapi import Depends, HTTPException
from fastapi.security import HTTPBearer

security = HTTPBearer()

async def verify_token(credentials = Depends(security)):
    token = credentials.credentials
    # Verify JWT token
    if not valid_token(token):
        raise HTTPException(status_code=401)
    return token
```

---

## Summary

### ✅ What You've Accomplished

By following this guide, you now have:

1. **Fully functional AI Babysitter application** running locally
2. **Backend API** with NVIDIA Nemotron LLM integration
3. **Frontend interface** with voice and camera features
4. **Database** with PostgreSQL or SQLite
5. **RAG system** with knowledge base and citations
6. **Logging and monitoring** setup
7. **Production deployment** knowledge

### 🚀 Next Steps

1. **Test all features** with the manual testing checklist
2. **Customize** the application for your needs
3. **Deploy to production** when ready
4. **Monitor and maintain** using logging and monitoring tools

### 📚 Additional Resources

- **Main Documentation**: [CLAUDE.md](../CLAUDE.md)
- **Quick Start**: [QUICKSTART.md](../docs/Claude_docs/QUICKSTART.md)
- **Test Results**: [TEST_RESULTS.md](../docs/Claude_docs/TEST_RESULTS.md)
- **API Documentation**: http://localhost:8000/docs (when running)

### 💡 Tips for Success

1. **Start simple**: Use default configuration first
2. **Test thoroughly**: Follow the testing checklist
3. **Monitor logs**: Watch for errors and warnings
4. **Backup regularly**: Set up automated database backups
5. **Keep updated**: Update dependencies and API keys as needed

---

**Your AI Babysitter System is Ready! 🎉**

Access at: http://localhost:3000

For questions or issues, check the [Troubleshooting](#troubleshooting) section or review the logs with `./launcher.sh logs`.
