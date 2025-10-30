# AI Babysitter System - Quick Start Guide

## Prerequisites Check

Before starting, ensure you have:
- [ ] Docker Desktop installed and running
- [ ] Python 3.10 or higher
- [ ] NVIDIA API Key from https://build.nvidia.com/
- [ ] OpenAI API Key (for vision features)

## Installation (5 minutes)

### Step 1: Initial Setup

```bash
# Run the setup script
./setup.sh
```

This will:
- Check all required dependencies
- Create necessary directories
- Generate a `.env` file from template
- Make launcher scripts executable

### Step 2: Configure API Keys

Edit the `.env` file and add your API keys:

```bash
nano .env
```

Required keys:
```bash
NVIDIA_API_KEY=nvapi-xxxxxxxxxxxxxxxxxxxxx
OPENAI_API_KEY=sk-xxxxxxxxxxxxxxxxxxxxx
```

Optional keys:
```bash
ELEVENLABS_API_KEY=xxxxxxxxxxxxxxxxxxxxx  # For high-quality voice
```

### Step 3: Launch the System

```bash
# Start all services (frontend, backend, database, redis)
./launcher.sh start --detach
```

Or use the Python launcher directly:
```bash
python launcher.py start --detach
```

### Step 4: Access the Application

Once started (takes 1-2 minutes on first run), access:

- **Frontend (User Interface)**: http://localhost:3000
- **Backend API**: http://localhost:8000
- **API Documentation**: http://localhost:8000/docs
- **Database Admin** (dev mode): http://localhost:8080

## Common Commands

### Starting & Stopping

```bash
# Start in development mode (with hot-reload)
./launcher.sh start

# Start in background
./launcher.sh start --detach

# Stop all services
./launcher.sh stop

# Restart services
./launcher.sh restart
```

### Monitoring

```bash
# View all logs
./launcher.sh logs

# View specific service logs
./launcher.sh logs backend
./launcher.sh logs frontend

# Check service status
./launcher.sh status
```

### Development

```bash
# Run tests
./launcher.sh test

# Clean everything (containers, volumes, build artifacts)
./launcher.sh clean
```

## Troubleshooting

### Issue: Services won't start

```bash
# Check Docker is running
docker ps

# Check logs for errors
./launcher.sh logs

# Clean and restart
./launcher.sh clean
./launcher.sh start
```

### Issue: Port already in use

If you see errors about ports 3000 or 8000 being in use:

```bash
# Check what's using the ports
lsof -i :3000
lsof -i :8000

# Kill the processes or change ports in docker-compose.yml
```

### Issue: API keys not working

```bash
# Verify your .env file has valid keys
cat .env | grep API_KEY

# Restart services to pick up changes
./launcher.sh restart
```

### Issue: Frontend can't connect to backend

Check that both services are running:
```bash
./launcher.sh status
```

Check backend logs for errors:
```bash
./launcher.sh logs backend
```

## Project Structure

```
Nvidia_hackathon/
├── launcher.py          # Main launcher script
├── launcher.sh          # Shell wrapper (Unix/Mac)
├── launcher.bat         # Batch wrapper (Windows)
├── setup.sh            # Initial setup
├── docker-compose.yml  # Service orchestration
├── .env                # Your API keys (created by setup)
├── .env.example        # Template
├── README.md           # Full documentation
│
├── frontend/           # React application
│   ├── src/
│   ├── public/
│   ├── package.json
│   └── Dockerfile
│
├── backend/            # FastAPI application
│   ├── app/
│   ├── requirements.txt
│   └── Dockerfile
│
├── nginx/             # Reverse proxy (production)
│   └── nginx.conf
│
└── docs/              # Additional documentation
```

## Development Workflow

### Making Changes

1. **Backend changes**: Edit files in `backend/`, services auto-reload
2. **Frontend changes**: Edit files in `frontend/src/`, auto-reload
3. **View changes**: Refresh http://localhost:3000

### Adding Dependencies

**Backend (Python)**:
```bash
# Add to backend/requirements.txt
cd backend
echo "new-package==1.0.0" >> requirements.txt

# Rebuild
cd ..
./launcher.sh restart
```

**Frontend (Node)**:
```bash
# Install in frontend
cd frontend
npm install new-package

# Rebuild
cd ..
./launcher.sh restart
```

## Production Deployment

### Local Production Mode

```bash
# Start with production settings
./launcher.sh start --prod --detach
```

This enables:
- PostgreSQL instead of SQLite
- Optimized builds
- Nginx reverse proxy (with `--profile production`)

### Cloud Deployment

The system is ready for cloud deployment:

1. **Push to GitHub**:
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git push
   ```

2. **Deploy to cloud provider** (AWS, GCP, Azure):
   - Use the Dockerfiles provided
   - Set environment variables in cloud platform
   - Ensure GPU available for NVIDIA Nemotron
   - Configure domain and SSL certificates

3. **Or use Docker Compose** on a VPS:
   ```bash
   # On server
   git clone <your-repo>
   cd Nvidia_hackathon
   cp .env.example .env
   # Edit .env with production keys
   docker-compose -f docker-compose.yml --profile production up -d
   ```

## Features to Test

Once running, try:

1. **Voice Chat**: Click microphone, speak to the AI
2. **Camera**: Click "Take Picture" for homework help
3. **Games**: Ask to play "I Spy" or tell a story
4. **Parent Dashboard**: View activity logs and alerts

## Getting Help

- **Documentation**: See [README.md](README.md)
- **API Docs**: http://localhost:8000/docs (when running)
- **Issues**: Check logs with `./launcher.sh logs`

## Next Steps

1. ✅ Run `./setup.sh`
2. ✅ Edit `.env` with your API keys
3. ✅ Run `./launcher.sh start --detach`
4. ✅ Open http://localhost:3000
5. ✅ Test voice and camera features

Enjoy your AI Babysitter System!
