# Quick Start Guide

Get AI Babysitter running in 5 minutes!

## Prerequisites

Before you begin, ensure you have:

- **Docker Desktop** (v20.10+) installed and running
- **NVIDIA API Key** - [Get one free here](https://build.nvidia.com/)
- **OpenAI API Key** - [Get one here](https://platform.openai.com/) (for voice and vision features)
- **macOS, Linux, or Windows** with WSL2

---

## Step 1: Clone the Repository

```bash
git clone <your-repo-url>
cd Nvidia_hackathon
```

---

## Step 2: Run Setup Script

The setup script will create all necessary configuration files:

```bash
./setup.sh
```

This creates:
- `.env` file for API keys
- `docker-compose.yml` for services
- Required directories for data storage

---

## Step 3: Add Your API Keys

Edit the `.env` file and add your API keys:

```bash
nano .env
# or use your preferred editor
```

Add these lines:

```env
NVIDIA_API_KEY=nvapi-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
OPENAI_API_KEY=sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

Save and exit (Ctrl+X, then Y, then Enter in nano).

---

## Step 4: Start the Application

```bash
./launcher.sh start --detach
```

This will:
- Build Docker containers (first time only - takes 2-3 minutes)
- Start backend and frontend services
- Initialize the database
- Set up the RAG knowledge base

---

## Step 5: Access the Application

Once started, you can access:

| Interface | URL |
|-----------|-----|
| **Child Interface** | http://localhost:3000 |
| **Parent Dashboard** | http://localhost:3000/parent-login |
| **Babysitter Dashboard** | http://localhost:3000/babysitter-login |
| **API Documentation** | http://localhost:8000/docs |
| **Backend Health** | http://localhost:8000/health |

### Default Login Credentials

**Parent Login:**
- Email: `parent@example.com`
- Password: `parent123`

**Babysitter Login:**
- Email: `babysitter@example.com`
- Password: `babysitter123`

**Child Interface:**
- Just enter any name to start!

---

## Step 6: Try It Out!

### For Children:

1. Go to http://localhost:3000
2. Enter child's name and age
3. Select an activity (Story Time, Free Chat, etc.)
4. Start chatting!

### For Parents:

1. Go to http://localhost:3000/parent-login
2. Log in with default credentials
3. Click "Auto-Discover Children" to find existing sessions
4. View conversations, alerts, and activities

---

## Managing Services

### View Logs

```bash
# All services
./launcher.sh logs

# Backend only
./launcher.sh logs backend

# Frontend only
./launcher.sh logs frontend
```

### Stop Services

```bash
./launcher.sh stop
```

### Restart Services

```bash
./launcher.sh restart
```

### Check Status

```bash
./launcher.sh status
```

---

## Troubleshooting

### Services Won't Start

**Check Docker is running:**
```bash
docker ps
```

If you see an error, start Docker Desktop.

**Check logs for errors:**
```bash
./launcher.sh logs
```

**Clean restart:**
```bash
docker compose down -v
./launcher.sh start
```

---

### API Keys Not Working

**Verify keys are set:**
```bash
cat .env | grep API_KEY
```

Make sure there are no extra spaces or quotes around the keys.

**Restart to reload environment:**
```bash
./launcher.sh restart
```

**Test NVIDIA connection:**
```bash
curl http://localhost:8000/settings/nvidia
```

---

### Port Already in Use

**Check what's using the ports:**
```bash
lsof -i :3000
lsof -i :8000
```

**Option 1: Kill the process**
```bash
kill -9 <PID>
```

**Option 2: Change ports**

Edit `docker-compose.yml` and change the port mappings:
```yaml
ports:
  - "3001:3000"  # Change 3000 to 3001
```

---

### Frontend Shows Connection Error

**Check backend is running:**
```bash
curl http://localhost:8000/health
```

Expected response:
```json
{
  "status": "healthy",
  "nvidia_configured": true,
  "openai_configured": true
}
```

**Check CORS settings:**

If accessing from a different domain, update `CORS_ORIGINS` in `.env`:
```env
CORS_ORIGINS=http://localhost:3000,http://yourserver.com
```

---

### Camera/Microphone Not Working

1. **Use HTTPS or localhost** - Browsers require secure context
2. **Check permissions** - Allow camera/microphone when prompted
3. **Use Chrome or Edge** - Best compatibility
4. **Check browser console** - Press F12 and look for errors

---

### RAG Knowledge Base Issues

**Check if ChromaDB directory exists:**
```bash
ls -la backend/data/chroma_db/
```

**Reinitialize knowledge base:**
```bash
rm -rf backend/data/chroma_db/
./launcher.sh restart
```

The backend will automatically rebuild the knowledge base on startup.

---

### Database Errors

**Reset database:**
```bash
rm backend/data/babysitter.db
./launcher.sh restart
```

This will create a fresh database with all tables.

---

### Voice Features Not Working

**Speech-to-Text (STT) Issues:**
- Ensure `OPENAI_API_KEY` is set (uses Whisper)
- Check microphone permissions
- Try speaking louder/clearer

**Text-to-Speech (TTS) Issues:**
- Browser TTS is used by default (no API required)
- For better quality, add `ELEVENLABS_API_KEY` in `.env`
- Check browser console for errors

---

## Next Steps

Now that you're up and running:

1. **Read the [User Guide](USER_GUIDE.md)** to learn all features
2. **Explore the [Parent Dashboard](PARENT_GUIDE.md)** guide
3. **Check out [Features](FEATURES.md)** for detailed feature documentation
4. **Review [Safety & Privacy](SAFETY_PRIVACY.md)** to understand our commitments

---

## Getting Help

If you're still having issues:

1. Check the [full documentation](README.md)
2. Review [API documentation](http://localhost:8000/docs) (when running)
3. Check Docker logs: `./launcher.sh logs`
4. Open an issue on GitHub

---

## Development Mode

Want to develop or modify the app? See the [Development Guide](DEVELOPMENT.md) for:
- Running backend/frontend separately
- Hot reload setup
- Testing procedures
- Code contribution guidelines

---

**You're ready to go! Enjoy using AI Babysitter.**
