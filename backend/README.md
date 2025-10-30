# AI Babysitter Backend

Backend API for an AI Babysitter Assistant powered by **NVIDIA Nemotron llama-3.3-nemotron-super-49b-v1.5**.

## Features

- **Conversational AI**: Natural, age-appropriate conversations with children using NVIDIA Nemotron
- **Safety System**: Real-time safety detection and parent alerts
- **Image Analysis**: On-demand homework help, games, and safety checks
- **Voice Processing**: Speech-to-text (Whisper) and text-to-speech
- **Session Management**: Track activities and conversation history
- **Real-time Notifications**: WebSocket-based parent alerts

## Quick Start

### Prerequisites

- Python 3.10+
- NVIDIA API key (for Nemotron LLM)
- Optional: OpenAI API key (for Whisper STT and GPT-4 Vision)
- Optional: Anthropic API key (for Claude Vision)
- Optional: ElevenLabs API key (for high-quality TTS)

### Installation

1. Clone and navigate to the project:
```bash
cd ai-babysitter-backend
```

2. Create virtual environment:
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

3. Install dependencies:
```bash
pip install -r requirements.txt
```

4. Configure environment:
```bash
cp .env.example .env
# Edit .env with your API keys
```

5. Run the server:
```bash
python -m uvicorn app.main:app --reload
```

The API will be available at `http://localhost:8000`

### Docker Setup

```bash
# Copy and configure environment
cp .env.example .env
# Edit .env with your API keys

# Start services
docker-compose up -d

# View logs
docker-compose logs -f backend
```

## API Documentation

Once running, visit:
- **Interactive Docs**: http://localhost:8000/docs
- **Alternative Docs**: http://localhost:8000/redoc

## API Endpoints

### Sessions

- `POST /api/sessions` - Create new session
- `GET /api/sessions/{session_id}` - Get session details
- `POST /api/sessions/{session_id}/end` - End session
- `GET /api/sessions/{session_id}/summary` - Get session summary with stats
- `GET /api/sessions/{session_id}/activities` - Get all activities
- `GET /api/sessions/{session_id}/messages` - Get conversation history
- `GET /api/sessions/{session_id}/alerts` - Get all alerts

### Chat

- `POST /api/chat` - Main conversation endpoint
- `POST /api/chat/story` - Generate story

### Images

- `POST /api/images/analyze` - Analyze image (homework, game, safety, show-tell)
- `POST /api/images/homework-help` - Specialized homework help endpoint

### Voice

- `POST /api/voice/transcribe` - Convert speech to text
- `POST /api/voice/synthesize` - Convert text to speech

### WebSocket

- `WS /ws/parent/{parent_id}` - Real-time parent notifications

## Configuration

Edit `.env` file:

```env
# Required
NVIDIA_API_KEY=your_nvidia_api_key

# Optional (enable additional features)
OPENAI_API_KEY=your_openai_key
ANTHROPIC_API_KEY=your_anthropic_key
ELEVENLABS_API_KEY=your_elevenlabs_key

# Database
DATABASE_URL=sqlite:///./babysitter.db

# Security
SECRET_KEY=your_secret_key
```

## NVIDIA Nemotron Setup

### Option 1: NVIDIA NIM API (Cloud)

1. Get API key from [NVIDIA NGC](https://catalog.ngc.nvidia.com/)
2. Add to `.env`:
```env
NVIDIA_API_KEY=nvapi-...
NVIDIA_BASE_URL=https://integrate.api.nvidia.com/v1
```

### Option 2: Local Deployment

```bash
# Pull and run NVIDIA NIM container
docker run -it --rm \
  --gpus all \
  -p 8000:8000 \
  nvcr.io/nim/llama-3.3-nemotron-super-49b-v1.5

# Update .env
NVIDIA_BASE_URL=http://localhost:8000/v1
```

## Safety Features

The system includes multiple safety layers:

1. **Message Analysis**: Every child message is analyzed for safety concerns
2. **Emotion Detection**: Detects distress, fear, sadness
3. **Keyword Monitoring**: Instant alerts for urgent keywords (injury, emergency, etc.)
4. **Image Moderation**: All images are checked before analysis
5. **Parent Alerts**: Real-time WebSocket notifications

### Alert Levels

- **INFO**: Normal activity logs
- **WARNING**: Minor concerns, check later
- **URGENT**: Parent should check soon
- **EMERGENCY**: Immediate parent notification

## Usage Examples

### Start a Session

```python
import requests

response = requests.post("http://localhost:8000/api/sessions", json={
    "child_name": "Emma",
    "child_age": 8,
    "parent_id": "parent123"
})

session_id = response.json()["session_id"]
```

### Chat with AI

```python
response = requests.post("http://localhost:8000/api/chat", json={
    "session_id": session_id,
    "message": "Can you tell me a story about dinosaurs?",
    "child_age": 8,
    "voice_output": True
})

print(response.json()["response"])
print(response.json()["audio_url"])  # If voice_output=True
```

### Analyze Homework Image

```python
with open("homework.jpg", "rb") as f:
    files = {"image": f}
    data = {
        "session_id": session_id,
        "context": "homework",
        "child_age": 8,
        "prompt": "Help me with this math problem"
    }
    response = requests.post(
        "http://localhost:8000/api/images/analyze",
        files=files,
        data=data
    )

print(response.json()["ai_response"])
```

### WebSocket Parent Monitoring

```javascript
const ws = new WebSocket('ws://localhost:8000/ws/parent/parent123');

ws.onmessage = (event) => {
    const data = JSON.parse(event.data);

    if (data.type === 'alert') {
        console.log(`ALERT [${data.level}]: ${data.message}`);
        // Show notification to parent
    }

    if (data.type === 'activity_update') {
        console.log(`Activity: ${data.activity}`);
    }
};

// Keep alive
setInterval(() => ws.send('ping'), 30000);
```

## Architecture

```
ai-babysitter-backend/
├── app/
│   ├── main.py              # FastAPI application
│   ├── config.py            # Configuration
│   ├── api/                 # API endpoints
│   │   ├── chat.py
│   │   ├── images.py
│   │   ├── sessions.py
│   │   └── voice.py
│   ├── services/            # Business logic
│   │   ├── llm_service.py   # NVIDIA Nemotron
│   │   ├── vision_service.py
│   │   ├── voice_service.py
│   │   ├── safety_service.py
│   │   └── notification_service.py
│   ├── models/              # Data models
│   ├── database/            # Database setup
│   └── utils/               # Utilities
├── tests/                   # Unit tests
├── requirements.txt
├── Dockerfile
└── docker-compose.yml
```

## Development

### Run Tests

```bash
pytest tests/ -v
```

### Add New Endpoint

1. Create endpoint in `app/api/`
2. Import router in `app/main.py`
3. Add to `app.include_router()`

### Customize Prompts

Edit `app/utils/prompts.py` to customize:
- System prompts for different age groups
- Safety analysis prompts
- Story generation templates

## Production Deployment

1. **Use PostgreSQL** instead of SQLite:
```env
DATABASE_URL=postgresql://user:pass@host/db
```

2. **Set secure secret key**:
```bash
python -c "import secrets; print(secrets.token_hex(32))"
```

3. **Disable debug mode**:
```env
DEBUG=False
```

4. **Configure CORS** in `app/main.py` with specific origins

5. **Add reverse proxy** (nginx) for production

## Troubleshooting

### NVIDIA API Connection Issues

- Verify API key is valid
- Check network connectivity
- Ensure model name is correct

### Image Analysis Not Working

- Configure at least one vision API (OpenAI or Anthropic)
- Check API quotas and limits

### Voice Features Unavailable

- OpenAI API required for Whisper STT
- At least one TTS provider needed (ElevenLabs, OpenAI, or gTTS)

## License

MIT

## Support

For issues and questions, please open an issue on the repository.

## Important Notes

- **No Constant Monitoring**: Images are only analyzed when explicitly uploaded by users
- **Safety First**: The system errs on the side of caution with all safety checks
- **Age-Appropriate**: Content is tailored to the child's age
- **Parent Control**: Parents receive real-time alerts and can monitor all activity
