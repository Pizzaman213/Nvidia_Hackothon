# AI Babysitter System - Deployment Checklist

## Pre-Deployment Checklist

### System Requirements
- [ ] Docker Desktop installed and running
- [ ] Docker Compose v2.0+ installed
- [ ] Python 3.10+ installed
- [ ] At least 4GB RAM available
- [ ] At least 2GB disk space available

### API Keys Required
- [ ] NVIDIA API Key obtained from https://build.nvidia.com/
- [ ] OpenAI API Key for vision features
- [ ] ElevenLabs API Key (optional, for voice)

### Network Requirements
- [ ] Ports available: 3000, 8000, 5432, 6379
- [ ] Internet connection for API calls
- [ ] No firewall blocking Docker

---

## Initial Setup Steps

### 1. Project Setup
```bash
# Navigate to project directory
cd Nvidia_hackathon

# Run setup script
./setup.sh
```

**Expected Output:**
```
✓ Docker installed
✓ Docker Compose installed
✓ Python installed
✓ .env file created
✓ Launcher scripts made executable
✓ Created necessary directories
```

- [ ] All checks passed
- [ ] .env file created
- [ ] No error messages

### 2. Configure Environment
```bash
# Edit .env file
nano .env
```

**Required Changes:**
```bash
NVIDIA_API_KEY=nvapi-your-actual-key-here
OPENAI_API_KEY=sk-your-actual-key-here
```

**Optional Changes:**
```bash
ELEVENLABS_API_KEY=your-elevenlabs-key
VOICE_SERVICE=elevenlabs  # or 'gtts' for free alternative
```

- [ ] NVIDIA_API_KEY updated
- [ ] OPENAI_API_KEY updated
- [ ] File saved

### 3. Verify Configuration
```bash
# Check API keys are set
cat .env | grep -E "NVIDIA_API_KEY|OPENAI_API_KEY"
```

- [ ] Keys visible (not placeholder values)
- [ ] No "your_" prefix in values

---

## First Launch

### 4. Start Services (Development Mode)
```bash
# Start all services
./launcher.sh start --detach
```

**Expected Output:**
```
Building and starting containers...
Services started in background

Services running at:
  • Frontend: http://localhost:3000
  • Backend:  http://localhost:8000
  • API Docs: http://localhost:8000/docs
  • Adminer:  http://localhost:8080
```

- [ ] All 4 services started
- [ ] No error messages
- [ ] URLs displayed

### 5. Verify Services Running
```bash
# Check service status
./launcher.sh status
```

**Expected Output:**
```
NAME                  STATUS    PORTS
babysitter-backend    Up        0.0.0.0:8000->8000/tcp
babysitter-frontend   Up        0.0.0.0:3000->3000/tcp
babysitter-db         Up        0.0.0.0:5432->5432/tcp
babysitter-redis      Up        0.0.0.0:6379->6379/tcp
```

- [ ] All services show "Up"
- [ ] Ports are mapped correctly

### 6. Check Logs
```bash
# View backend logs
./launcher.sh logs backend
```

**Look For:**
- [ ] "Application startup complete"
- [ ] "Uvicorn running on http://0.0.0.0:8000"
- [ ] No error tracebacks

```bash
# View frontend logs
./launcher.sh logs frontend
```

**Look For:**
- [ ] "Compiled successfully!"
- [ ] "webpack compiled"
- [ ] No compilation errors

---

## Service Testing

### 7. Test Frontend Access
```bash
# Open in browser
open http://localhost:3000
```

**Verify:**
- [ ] Page loads without errors
- [ ] UI is visible and styled correctly
- [ ] No console errors (F12 → Console)

### 8. Test Backend API
```bash
# Test health endpoint
curl http://localhost:8000/health

# Open API documentation
open http://localhost:8000/docs
```

**Verify:**
- [ ] Health check returns 200 OK
- [ ] API docs page loads
- [ ] Endpoints are listed

### 9. Test Voice Interface
**In the frontend (http://localhost:3000):**
- [ ] Click microphone button
- [ ] Speak a test message
- [ ] See transcription appear
- [ ] Receive AI response
- [ ] Hear audio response (if enabled)

### 10. Test Camera Interface
**In the frontend:**
- [ ] Click "Take Picture" button
- [ ] Allow camera permissions (if prompted)
- [ ] Camera preview appears
- [ ] Can capture image
- [ ] AI can analyze image

### 11. Test Parent Dashboard
**In the frontend:**
- [ ] Navigate to Parent Dashboard
- [ ] See activity log
- [ ] View session history
- [ ] Check alerts (if any)

---

## Production Deployment

### 12. Production Configuration
```bash
# Edit .env for production
nano .env
```

**Change:**
```bash
DEBUG=False
DATABASE_URL=postgresql://postgres:postgres@db:5432/babysitter
SECRET_KEY=generate-a-secure-random-key-here
ALLOWED_ORIGINS=https://your-domain.com
```

- [ ] DEBUG set to False
- [ ] DATABASE_URL uses PostgreSQL
- [ ] SECRET_KEY changed from default
- [ ] ALLOWED_ORIGINS set to actual domain

### 13. Generate Secret Key
```bash
# Generate secure secret key
python3 -c "import secrets; print(secrets.token_urlsafe(32))"
```

- [ ] Copy output to .env SECRET_KEY

### 14. SSL Certificates (Production)
```bash
# Place SSL certificates
cp fullchain.pem nginx/ssl/
cp privkey.pem nginx/ssl/
```

- [ ] SSL certificates in nginx/ssl/
- [ ] nginx.conf updated with domain

### 15. Start Production Mode
```bash
# Stop dev services
./launcher.sh stop

# Start production mode
./launcher.sh start --prod --detach
```

- [ ] All services started
- [ ] PostgreSQL used (not SQLite)
- [ ] Nginx proxy running (if profile enabled)

---

## Monitoring & Maintenance

### 16. Log Monitoring
```bash
# Monitor all logs
./launcher.sh logs -f
```

**Watch For:**
- [ ] No repeated errors
- [ ] API requests completing
- [ ] Database queries working

### 17. Resource Monitoring
```bash
# Check Docker resource usage
docker stats
```

**Verify:**
- [ ] CPU usage reasonable (<80%)
- [ ] Memory usage within limits
- [ ] No constantly restarting services

### 18. Database Check
```bash
# Access database admin
open http://localhost:8080

# Or connect directly
docker exec -it babysitter-db psql -U postgres -d babysitter
```

- [ ] Database accessible
- [ ] Tables created
- [ ] Data persisting

---

## Backup & Recovery

### 19. Database Backup
```bash
# Backup PostgreSQL database
docker exec babysitter-db pg_dump -U postgres babysitter > backup.sql
```

- [ ] Backup file created
- [ ] File size reasonable

### 20. Data Volumes Backup
```bash
# List volumes
docker volume ls | grep babysitter

# Backup volumes (example)
docker run --rm -v nvidia_hackathon_postgres-data:/data -v $(pwd):/backup alpine tar czf /backup/db-backup.tar.gz /data
```

- [ ] Volume backup created

---

## Troubleshooting Tests

### 21. Service Recovery Test
```bash
# Stop one service
docker stop babysitter-backend

# Check auto-restart
docker ps | grep babysitter-backend
```

- [ ] Service auto-restarts (restart policy working)

### 22. Clean Restart Test
```bash
# Stop all services
./launcher.sh stop

# Verify all stopped
./launcher.sh status

# Start again
./launcher.sh start --detach

# Verify all running
./launcher.sh status
```

- [ ] Clean stop works
- [ ] Clean start works
- [ ] All data persists

---

## Performance Tests

### 23. API Response Time
```bash
# Test API latency
time curl http://localhost:8000/health
```

**Expected:**
- [ ] Response time < 1 second

### 24. Frontend Load Time
**In browser:**
- [ ] Open DevTools → Network
- [ ] Refresh page
- [ ] Check "Load" time < 3 seconds

### 25. Concurrent Requests
```bash
# Test with Apache Bench (if installed)
ab -n 100 -c 10 http://localhost:8000/health
```

- [ ] All requests succeed
- [ ] No 500 errors

---

## Security Checks

### 26. Environment Security
```bash
# Check .env is not in git
git status
```

- [ ] .env not tracked by git
- [ ] .gitignore includes .env

### 27. API Key Security
```bash
# Verify keys not in logs
./launcher.sh logs | grep -i "api_key" || echo "Safe"
```

- [ ] No API keys in logs

### 28. CORS Configuration
```bash
# Test CORS headers
curl -I http://localhost:8000/health
```

- [ ] Appropriate CORS headers set

---

## Documentation Review

### 29. Documentation Complete
- [ ] README.md reviewed
- [ ] QUICKSTART.md reviewed
- [ ] PROJECT_SUMMARY.md reviewed
- [ ] All URLs updated
- [ ] All commands tested

### 30. Team Handoff
- [ ] Repository access provided
- [ ] API keys shared securely
- [ ] Deployment process documented
- [ ] Contact info for support

---

## Final Verification

### All Systems Go ✓

- [ ] Setup script runs without errors
- [ ] All services start successfully
- [ ] Frontend accessible and functional
- [ ] Backend API responding
- [ ] Voice interface working
- [ ] Camera interface working
- [ ] Parent dashboard functional
- [ ] Logs are clean
- [ ] Database persisting data
- [ ] Production mode tested
- [ ] Backup procedures in place
- [ ] Documentation complete

---

## Post-Deployment

### Monitoring Setup
- [ ] Set up log aggregation (optional)
- [ ] Configure alerting (optional)
- [ ] Set up uptime monitoring (optional)

### Maintenance Schedule
- [ ] Weekly log review
- [ ] Monthly security updates
- [ ] Quarterly dependency updates
- [ ] Regular database backups

---

## Emergency Procedures

### If Services Won't Start
```bash
# 1. Check Docker
docker ps

# 2. View logs
./launcher.sh logs

# 3. Clean restart
./launcher.sh clean
./launcher.sh start
```

### If Database Corrupted
```bash
# 1. Stop services
./launcher.sh stop

# 2. Restore from backup
docker exec -i babysitter-db psql -U postgres babysitter < backup.sql

# 3. Restart
./launcher.sh start --detach
```

### If API Keys Invalid
```bash
# 1. Update .env
nano .env

# 2. Restart services
./launcher.sh restart
```

---

## Success! 🎉

Your AI Babysitter System is now fully deployed and operational!

**Quick Reference:**
- Start: `./launcher.sh start --detach`
- Stop: `./launcher.sh stop`
- Logs: `./launcher.sh logs`
- Status: `./launcher.sh status`

**Access Points:**
- Frontend: http://localhost:3000
- Backend: http://localhost:8000
- API Docs: http://localhost:8000/docs

**Support:**
- Check logs: `./launcher.sh logs`
- Read docs: See README.md
- Troubleshoot: See QUICKSTART.md

Enjoy your unified AI Babysitter System!
