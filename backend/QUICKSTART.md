# Quick Start Guide

## 1. Setup (5 minutes)

### Install Dependencies
```bash
cd ai-babysitter-backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
```

### Configure API Keys
```bash
cp .env.example .env
```

Edit `.env` and add your NVIDIA API key:
```env
NVIDIA_API_KEY=nvapi-your-key-here
```

Optional keys for additional features:
- `OPENAI_API_KEY` - For Whisper STT and GPT-4 Vision
- `ANTHROPIC_API_KEY` - For Claude Vision
- `ELEVENLABS_API_KEY` - For high-quality TTS

## 2. Run the Server

```bash
python run.py
```

Or:
```bash
uvicorn app.main:app --reload
```

Server starts at: **http://localhost:8000**

## 3. Test the API

### Open API Documentation
Visit: http://localhost:8000/docs

### Test with curl

**Create a session:**
```bash
curl -X POST "http://localhost:8000/api/sessions" \
  -H "Content-Type: application/json" \
  -d '{
    "child_name": "Emma",
    "child_age": 8,
    "parent_id": "parent123"
  }'
```

**Chat with AI:**
```bash
curl -X POST "http://localhost:8000/api/chat" \
  -H "Content-Type: application/json" \
  -d '{
    "session_id": "YOUR_SESSION_ID",
    "message": "Tell me a story about a brave puppy",
    "child_age": 8,
    "voice_output": false
  }'
```

### Test with Python

```python
import requests

# Create session
response = requests.post("http://localhost:8000/api/sessions", json={
    "child_name": "Emma",
    "child_age": 8,
    "parent_id": "parent123"
})
session_id = response.json()["session_id"]

# Chat
response = requests.post("http://localhost:8000/api/chat", json={
    "session_id": session_id,
    "message": "Can you help me with my homework?",
    "child_age": 8
})
print(response.json()["response"])
```

## 4. Key Endpoints

- **Sessions**: `/api/sessions`
- **Chat**: `/api/chat`
- **Images**: `/api/images/analyze`
- **Voice**: `/api/voice/transcribe`, `/api/voice/synthesize`
- **WebSocket**: `ws://localhost:8000/ws/parent/{parent_id}`

## 5. Docker Setup (Alternative)

```bash
docker-compose up -d
docker-compose logs -f backend
```

## Common Issues

### "NVIDIA API key not configured"
- Add your API key to `.env` file
- Get key from: https://catalog.ngc.nvidia.com/

### "Image analysis unavailable"
- Configure at least one vision API (OpenAI or Anthropic)

### "Database errors"
- Delete `babysitter.db` and restart server to recreate

## Next Steps

1. Integrate with your frontend application
2. Configure all API keys for full features
3. Test safety alerts and WebSocket notifications
4. Deploy to production (see README.md)

## Support

Check the full [README.md](README.md) for detailed documentation.
