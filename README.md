# AI Babysitter System

A comprehensive AI-powered babysitting assistant using NVIDIA Nemotron, with voice interaction and on-demand camera capabilities.

## Quick Start

### Prerequisites
- Docker & Docker Compose
- Python 3.10+
- NVIDIA API Key ([Get one here](https://build.nvidia.com/))
- OpenAI API Key (for vision)

### Installation

1. **Clone and setup:**
   ```bash
   git clone <your-repo-url>
   cd Nvidia_hackathon
   ./setup.sh
   ```

2. **Configure environment:**
   ```bash
   # Edit .env and add your API keys
   nano .env
   ```

3. **Launch the system:**
   ```bash
   ./launcher.sh start
   ```

4. **Access the application:**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:8000
   - API Documentation: http://localhost:8000/docs

## Usage

### Start the system:
```bash
# Development mode (recommended for testing)
./launcher.sh start

# Production mode
./launcher.sh start --prod

# Background mode
./launcher.sh start --detach
```

### Stop the system:
```bash
./launcher.sh stop
```

### View logs:
```bash
# All services
./launcher.sh logs

# Specific service
./launcher.sh logs backend
./launcher.sh logs frontend
```

### Check status:
```bash
./launcher.sh status
```

### Run tests:
```bash
./launcher.sh test
```

## Architecture

```
┌─────────────────┐
│   Frontend      │  React + Voice + Camera
│   localhost:3000│
└────────┬────────┘
         │ HTTP/WebSocket
┌────────▼────────┐
│   Backend       │  FastAPI + NVIDIA Nemotron
│   localhost:8000│
└────────┬────────┘
         │
    ┌────┴────┬─────────┬────────┐
    │         │         │        │
┌───▼───┐ ┌──▼──┐  ┌───▼───┐ ┌─▼──┐
│ LLM   │ │ STT │  │  TTS  │ │ DB │
│Nemotron│ │Whisper│ │ElevenL│ │PG  │
└───────┘ └─────┘  └───────┘ └────┘
```

## Features

- **Natural Conversation**: NVIDIA Nemotron LLM for child-friendly AI chat
- **Voice Interface**: Speech-to-text and text-to-speech
- **Homework Help**: Camera-based worksheet analysis
- **Interactive Games**: "I Spy", story time, educational activities
- **Safety Monitoring**: Real-time parent alerts for concerns
- **Privacy First**: Camera only activates on user request (never constant monitoring)

## Privacy & Safety

- **No Constant Monitoring**: Camera only activates when user clicks "Take Picture"
- **Content Filtering**: All AI responses are age-appropriate
- **Parent Alerts**: Immediate notification of safety concerns
- **Data Privacy**: Local processing where possible, encrypted transmissions

## Development

### Project Structure:
```
Nvidia_hackathon/
├── frontend/          # React application
├── backend/           # FastAPI application
├── docker-compose.yml # Service orchestration
├── launcher.py        # Main launcher script
└── docs/             # Documentation
```

### Running in Development:
```bash
# Start with hot-reload
./launcher.sh start

# Frontend runs on: http://localhost:3000
# Backend runs on: http://localhost:8000
```

### Environment Variables:
See `.env.example` for all configuration options.

### Testing:
```bash
# Run all tests
./launcher.sh test

# Run specific tests
cd backend && pytest tests/test_chat.py
cd frontend && npm test
```

## Troubleshooting

### Services won't start:
```bash
# Check Docker is running
docker ps

# Check logs
./launcher.sh logs

# Clean and restart
./launcher.sh clean
./launcher.sh start
```

### API keys not working:
```bash
# Verify .env file
cat .env | grep API_KEY

# Restart services
./launcher.sh restart
```

### Port conflicts:
```bash
# Check what's using ports
lsof -i :3000
lsof -i :8000

# Stop conflicting services or change ports in docker-compose.yml
```

## Deployment

### For Production:
```bash
# Use production mode
./launcher.sh start --prod --detach

# With SSL (nginx proxy)
docker-compose --profile production up -d
```

### For Cloud Deployment:
- Use the Dockerfiles provided
- Set environment variables in cloud platform
- Ensure GPU available for NVIDIA Nemotron
- Configure domain and SSL certificates

## Documentation

- [Architecture Documentation](docs/architecture.md)
- [API Documentation](http://localhost:8000/docs) (when running)
- [Deployment Guide](docs/deployment.md)

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests: `./launcher.sh test`
5. Submit a pull request

## License

MIT License

## Acknowledgments

- NVIDIA Nemotron for LLM capabilities
- OpenAI Whisper for speech recognition
- React team for the frontend framework
- FastAPI for the backend framework

---

**Need Help?** Check the [documentation](docs/) or open an issue.
