# AI Babysitter System

<div align="center">

**An intelligent, AI-powered babysitting assistant built with NVIDIA Nemotron**

[![Python 3.10+](https://img.shields.io/badge/python-3.10+-blue.svg)](https://www.python.org/downloads/)
[![React](https://img.shields.io/badge/react-19.2.0-blue.svg)](https://reactjs.org/)
[![FastAPI](https://img.shields.io/badge/fastapi-latest-green.svg)](https://fastapi.tiangolo.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

[Features](#-features) • [Quick Start](#-quick-start) • [Documentation](#-documentation) • [Safety & Privacy](#privacy--safety) • [Architecture](#-architecture)

---

### Quick Navigation

| I want to... | Go here |
|--------------|---------|
| **Get started in 5 minutes** | [Quick Start](#-quick-start) or [Quick Start Guide](docs/QUICK_START.md) |
| **Understand what this does** | [Overview](#overview) or [Project Overview](docs/PROJECT_OVERVIEW.md) |
| **Learn how to use it** | [Usage](#usage) or [User Guide](docs/USER_GUIDE.md) |
| **See all features** | [Features](#-features) or [Features Guide](docs/FEATURES.md) |
| **Understand the architecture** | [Architecture](#-architecture) or [Technical Overview](docs/TECHNICAL_OVERVIEW.md) |
| **Check privacy and safety** | [Privacy & Safety](#privacy--safety) or [Safety Guide](docs/SAFETY_PRIVACY.md) |
| **Troubleshoot issues** | [Troubleshooting](#troubleshooting) or [Troubleshooting Guide](docs/QUICK_START.md#troubleshooting) |
| **Deploy to production** | [Deployment](#deployment) or [Technical Overview](docs/TECHNICAL_OVERVIEW.md) |
| **Contribute to the project** | [Contributing](#contributing) |

</div>

---

## Overview

AI Babysitter is a comprehensive virtual assistant designed to engage, educate, and keep children safe through interactive conversations, educational games, and real-time parental monitoring. Built on NVIDIA Nemotron LLM with advanced RAG (Retrieval-Augmented Generation) capabilities, it provides accurate, age-appropriate responses grounded in trusted sources like CDC, CPSC, and NIH.

### Key Highlights

- **Voice-First Interface**: Natural speech recognition and text-to-speech for seamless interaction
- **Multi-Child Support**: Manage profiles, preferences, and conversations for multiple children
- **RAG-Powered Responses**: Fact-based answers with source citations from government health/safety agencies
- **Interactive Modes**: Story time, homework help, "I Spy" game, and free chat
- **Emergency Features**: One-tap emergency calling with WebRTC integration
- **Parent Dashboard**: Real-time conversation monitoring, alerts, and activity tracking
- **Privacy-First**: On-demand camera only (no constant surveillance)

---

## Features

### For Children

**🎮 Interactive Modes**
- **Story Time**: AI-generated age-appropriate stories with educational themes
- **Homework Helper**: Camera-based worksheet analysis and step-by-step guidance
- **I Spy Game**: Interactive visual game using camera feed
- **Free Chat**: General conversation with safety monitoring

**🎤 Voice & Camera**
- Natural voice conversations with TTS/STT
- On-demand camera for homework help and games
- Configurable voice settings and themes

**🎨 Customization**
- Adjustable themes and color schemes
- Personalized AI assistant name
- Age-appropriate content filtering

### For Parents

**📊 Dashboard & Monitoring**
- Real-time conversation transcripts
- Activity tracking and session history
- Safety alerts and notifications
- Source citations for AI responses (RAG transparency)

**👨‍👩‍👧‍👦 Multi-Child Management**
- Individual child profiles with age/preferences
- Per-child conversation history
- Customizable settings for each child

**🚨 Safety Features**
- Instant emergency call button (WebRTC signaling)
- Automated alerts for concerning conversations
- Content filtering and moderation
- Notification system for parent awareness

### Technical Features

**🤖 AI & Intelligence**
- NVIDIA Nemotron LLM for natural language understanding
- RAG system with 18 curated safety/health documents
- Vector search with ChromaDB
- Age-appropriate response generation

**🔧 Developer Features**
- Comprehensive REST API (FastAPI)
- WebSocket support for real-time features
- Structured logging and monitoring
- Docker-based deployment
- Full API documentation at `/docs`

---

## Quick Start

### Prerequisites

- **Docker Desktop** (v20.10+) with Docker Compose
- **Python** 3.10 or higher
- **NVIDIA API Key** - [Get one free](https://build.nvidia.com/)
- **OpenAI API Key** - [Get one here](https://platform.openai.com/) (for vision features)

### Installation (5 Minutes)

1. **Clone and navigate to the project:**
   ```bash
   git clone <your-repo-url>
   cd Nvidia_hackathon
   ```

2. **Run the setup script:**
   ```bash
   ./setup.sh
   ```

3. **Configure your API keys:**
   ```bash
   # Edit .env file and add your keys
   nano .env
   ```

   Add the following:
   ```env
   NVIDIA_API_KEY=nvapi-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
   OPENAI_API_KEY=sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
   ```

4. **Launch the application:**
   ```bash
   ./launcher.sh start --detach
   ```

5. **Access the interfaces:**
   - **Child Interface**: http://localhost:3000
   - **Parent Dashboard**: http://localhost:3000/parent-login
   - **Babysitter Dashboard**: http://localhost:3000/babysitter-login
   - **API Documentation**: http://localhost:8000/docs
   - **Backend Health**: http://localhost:8000/health

**Default Login Credentials:**
- Child Interface: Enter any name to start
- Parent Dashboard: Email: `parent@example.com`, Password: `parent123`
- Babysitter Dashboard: Email: `babysitter@example.com`, Password: `babysitter123`

---

## Usage

### Managing Services

```bash
# Start in development mode (with logs)
./launcher.sh start

# Start in background (detached mode)
./launcher.sh start --detach

# Stop all services
./launcher.sh stop

# Restart services
./launcher.sh restart

# View logs
./launcher.sh logs              # All services
./launcher.sh logs backend      # Backend only
./launcher.sh logs frontend     # Frontend only

# Check service status
./launcher.sh status

# Run tests
./launcher.sh test
```

### Using the Child Interface

1. Navigate to http://localhost:3000
2. Enter child's name and age
3. Select an activity mode (Story Time, Homework Help, I Spy, or Free Chat)
4. Start talking or typing to interact with the AI assistant
5. Use the camera button for homework help or I Spy game

### Using the Parent Dashboard

1. Navigate to http://localhost:3000/parent-login
2. Log in with parent credentials
3. View real-time conversations in the **Chat History** tab
4. Check safety alerts in the **Alerts** tab
5. Review AI response sources in the **Sources** tab
6. Manage multiple children in the **Children** tab
7. View session activity in the **Activities** tab

### Using the Babysitter Dashboard

1. Navigate to http://localhost:3000/babysitter-login
2. Log in with babysitter credentials
3. **Select a child** from the Children tab to begin monitoring
4. View real-time conversations in the **AI Assistant** tab
5. Check safety alerts in the **Alerts** tab
6. Review AI response sources in the **Sources** tab
7. View session activity in the **Activities** tab
8. Note: Babysitters have read-only access to all children and cannot add/edit/delete profiles

---

## Architecture

### System Overview

```
┌──────────────────────────────────────────────────────────────────┐
│                         Frontend (React)                         │
│                       http://localhost:3000                      │
│                                                                  │
│  ┌─────────────┐  ┌──────────────┐  ┌────────────────────────┐ │
│  │   Child     │  │   Parent     │  │  Theme & Settings     │ │
│  │  Interface  │  │  Dashboard   │  │  Customization        │ │
│  └─────────────┘  └──────────────┘  └────────────────────────┘ │
└────────────┬─────────────────────────────────────────────────────┘
             │ HTTP/REST + WebSocket
┌────────────▼─────────────────────────────────────────────────────┐
│                      Backend (FastAPI)                           │
│                    http://localhost:8000                         │
│                                                                  │
│  ┌──────────┐  ┌──────────┐  ┌───────────┐  ┌──────────────┐  │
│  │   Chat   │  │  Voice   │  │   Image   │  │   Emergency  │  │
│  │   API    │  │   API    │  │   API     │  │   Calling    │  │
│  └────┬─────┘  └────┬─────┘  └─────┬─────┘  └──────┬───────┘  │
│       │             │              │                │           │
│  ┌────▼─────────────▼──────────────▼────────────────▼───────┐  │
│  │              Service Layer                               │  │
│  │  • LLM Service (NVIDIA Nemotron)                         │  │
│  │  • RAG Service (ChromaDB + Vector Search)                │  │
│  │  • TTS/STT Service                                       │  │
│  │  • Notification Service                                  │  │
│  │  • Emergency Phone Service (WebRTC)                      │  │
│  └──────────────────────┬───────────────────────────────────┘  │
│                         │                                       │
│  ┌──────────────────────▼───────────────────────────────────┐  │
│  │              Data Layer (SQLite)                         │  │
│  │  • Sessions  • Children  • Messages  • Alerts            │  │
│  │  • Citations • Activities • Settings                     │  │
│  └──────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────────┘

                              │
                ┌─────────────┴─────────────┐
                │                           │
        ┌───────▼────────┐          ┌──────▼───────┐
        │  NVIDIA API    │          │  OpenAI API  │
        │  (Nemotron)    │          │  (Vision)    │
        └────────────────┘          └──────────────┘
```

### Technology Stack

**Frontend**
- React 19.2.0 with TypeScript
- React Router for navigation
- Zustand for state management
- Axios for API communication
- TailwindCSS for styling
- Web Audio API for voice

**Backend**
- FastAPI (Python 3.10+)
- SQLite database
- ChromaDB for vector storage
- sentence-transformers for embeddings
- NVIDIA Nemotron API
- OpenAI Vision API

**Infrastructure**
- Docker & Docker Compose
- Uvicorn ASGI server
- CORS middleware
- Structured logging

---

## Documentation

### Complete Guides

📚 **[Documentation Index](docs/README.md)** - Start here for all documentation

**Getting Started:**
- **[Quick Start Guide](docs/QUICK_START.md)** - Get up and running in 5 minutes
- **[User Guide](docs/USER_GUIDE.md)** - Complete guide for parents, children, and babysitters
- **[Features](docs/FEATURES.md)** - Complete feature documentation with examples

**Understanding the Project:**
- **[Project Overview](docs/PROJECT_OVERVIEW.md)** - What it is, why it exists, and use cases
- **[Safety & Privacy](docs/SAFETY_PRIVACY.md)** - Our commitments, policies, and compliance

**For Developers:**
- **[Technical Overview](docs/TECHNICAL_OVERVIEW.md)** - Architecture, technology stack, and design decisions

### API Documentation

When the backend is running, interactive API documentation is available at:
- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

### Key Endpoints

```
POST   /api/chat                 # Send chat message
POST   /api/voice/transcribe     # Speech-to-text
POST   /api/voice/synthesize     # Text-to-speech
POST   /api/images/analyze       # Image analysis for homework help
GET    /api/sessions/{id}        # Get session details
GET    /api/alerts               # Get safety alerts
POST   /api/emergency/call       # Initiate emergency call
GET    /api/parent/conversations # Get conversation history
GET    /api/citations/{session}  # Get RAG sources for session
```

---

## Configuration

### Environment Variables

Key configuration options in `.env`:

```env
# Required
NVIDIA_API_KEY=nvapi-xxxxx           # NVIDIA Nemotron API key
OPENAI_API_KEY=sk-xxxxx              # OpenAI API key (vision)

# Optional
ELEVENLABS_API_KEY=xxxxx             # Premium TTS (optional)
ANTHROPIC_API_KEY=sk-ant-xxxxx       # Alternative vision API

# Server Configuration
BACKEND_HOST=0.0.0.0
BACKEND_PORT=8000
FRONTEND_PORT=3000

# Logging
LOG_LEVEL=INFO                       # DEBUG, INFO, WARNING, ERROR
LOG_FORMAT=json                      # json or text
LOG_REQUESTS=true                    # Log HTTP requests

# CORS
CORS_ORIGINS=*                       # Comma-separated origins
```

For complete configuration options, see [docs/TECHNICAL_OVERVIEW.md](docs/TECHNICAL_OVERVIEW.md).

---

## Development

### Project Structure

```
Nvidia_hackathon/
├── frontend/                    # React TypeScript application
│   ├── src/
│   │   ├── components/         # Reusable UI components
│   │   ├── contexts/           # React contexts (Session, Voice, Theme)
│   │   ├── hooks/              # Custom React hooks
│   │   ├── pages/              # Page components
│   │   ├── services/           # API client services
│   │   └── utils/              # Utility functions
│   └── package.json
│
├── backend/                     # FastAPI Python application
│   ├── app/
│   │   ├── api/                # API route handlers
│   │   ├── models/             # Database models
│   │   ├── services/           # Business logic services
│   │   ├── database/           # Database configuration
│   │   ├── middleware/         # Custom middleware
│   │   └── utils/              # Utility functions
│   ├── data/                   # SQLite database & ChromaDB
│   └── requirements.txt
│
├── docs/                        # Documentation
├── logs/                        # Application logs
├── docker-compose.yml           # Service orchestration
├── launcher.py                  # Python launcher script
├── launcher.sh                  # Bash launcher script
└── setup.sh                     # Initial setup script
```

### Running in Development

**Backend (Python):**
```bash
cd backend
python -m venv venv
source venv/bin/activate  # or `venv\Scripts\activate` on Windows
pip install -r requirements.txt
python run.py
```

**Frontend (React):**
```bash
cd frontend
npm install
npm start
```

### Running Tests

```bash
# Backend tests
cd backend
pytest

# Frontend tests
cd frontend
npm test

# All tests via launcher
./launcher.sh test
```

---

## Troubleshooting

### Services won't start

```bash
# Check Docker is running
docker ps

# Check container logs
./launcher.sh logs

# Clean and restart
docker compose down -v
./launcher.sh start
```

### API Keys Not Working

```bash
# Verify .env file exists and has correct keys
cat .env | grep API_KEY

# Restart backend to reload environment
./launcher.sh restart
```

### Port Conflicts

```bash
# Check what's using the ports
lsof -i :3000
lsof -i :8000

# Option 1: Kill conflicting processes
kill -9 <PID>

# Option 2: Change ports in docker-compose.yml
```

### RAG Knowledge Base Issues

```bash
# Check if ChromaDB directory exists
ls -la backend/data/chroma_db/

# Reinitialize knowledge base
rm -rf backend/data/chroma_db/
./launcher.sh restart
```

### Camera/Microphone Not Working

- Ensure you're using HTTPS or localhost
- Check browser permissions (allow camera/microphone)
- Use Chrome or Edge (best compatibility)
- Check browser console for errors (F12)

**For complete troubleshooting guide, see [Quick Start - Troubleshooting](docs/QUICK_START.md#troubleshooting).**

---

## Deployment

### Docker Deployment (Recommended)

```bash
# Production mode with optimizations
./launcher.sh start --prod --detach

# Monitor logs
docker compose logs -f
```

### Cloud Deployment

The application is containerized and ready for cloud deployment:

**Platforms:**
- AWS (ECS, Fargate, or EC2)
- Google Cloud Platform (Cloud Run, GKE)
- Azure (Container Instances, AKS)
- DigitalOcean (App Platform)

**Requirements:**
- Set environment variables in cloud platform
- Configure persistent storage for SQLite database
- Set up SSL/TLS certificates
- Configure CORS for your domain

For detailed deployment instructions, see [docs/TECHNICAL_OVERVIEW.md](docs/TECHNICAL_OVERVIEW.md).

---

## Privacy & Safety

**We take children's privacy and safety seriously.** [Read our complete Safety & Privacy Guide →](docs/SAFETY_PRIVACY.md)

### Privacy Commitments

- **No Constant Monitoring**: Camera only activates when user explicitly clicks "Take Picture"
- **Local-First Storage**: All data stays on your infrastructure, no mandatory cloud storage
- **No Data Selling**: We never sell or share user data with third parties
- **Encrypted Transmission**: All API communications use HTTPS encryption
- **Parent Control**: Full visibility and control over all data and settings
- **Minimal Data Collection**: Only collect what's needed for functionality

### Safety Features

- **Multi-Layer Monitoring**: Keyword detection + AI context analysis for safety
- **Real-Time Alerts**: Instant parent notifications for concerning conversations (INFO, WARNING, URGENT, EMERGENCY levels)
- **Content Filtering**: Age-appropriate responses with strict/moderate/relaxed filtering
- **Emergency Button**: One-tap emergency access with instant parent notification
- **Trusted Sources**: RAG system uses only CDC, CPSC, and NIH sources (public domain)
- **Citation Transparency**: Parents can verify all AI response sources

### Compliance

- **COPPA Consideration**: Designed with child privacy in mind
- **Public Domain Sources**: All RAG knowledge from U.S. government (17 USC § 105)
- **Open Source**: Full transparency with MIT License
- **No Third-Party Tracking**: No cookies, analytics, or external trackers

**For detailed information on data collection, third-party services, and compliance, see [Safety & Privacy Guide](docs/SAFETY_PRIVACY.md).**

---

## Contributing

We welcome contributions! Here's how to get started:

1. **Fork the repository**
2. **Create a feature branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```
3. **Make your changes**
   - Follow existing code style
   - Add tests for new features
   - Update documentation as needed
4. **Run tests**
   ```bash
   ./launcher.sh test
   ```
5. **Commit your changes**
   ```bash
   git commit -m "Add feature: description"
   ```
6. **Push and create a Pull Request**
   ```bash
   git push origin feature/your-feature-name
   ```

### Development Guidelines

- Follow PEP 8 for Python code
- Use TypeScript strict mode for frontend
- Write unit tests for new features
- Update README and docs for user-facing changes
- Keep commits atomic and well-documented

---

## License

This project is licensed under the **MIT License** - see the LICENSE file for details.

### Third-Party Licenses

- NVIDIA Nemotron: [NVIDIA AI Foundation Models License](https://www.nvidia.com/en-us/ai-data-science/foundation-models/)
- OpenAI API: [OpenAI Terms of Use](https://openai.com/policies/terms-of-use)
- ChromaDB: Apache License 2.0
- FastAPI: MIT License
- React: MIT License

---

## Acknowledgments

- **NVIDIA** for the incredible Nemotron LLM and developer platform
- **OpenAI** for Whisper and Vision APIs
- **ChromaDB** for the vector database
- **FastAPI** team for the excellent Python web framework
- **React** team for the frontend framework
- **CDC, CPSC, NIH** for public domain safety and health resources

---

## Support & Contact

- **Documentation**: [docs/](docs/)
- **Issues**: [GitHub Issues](https://github.com/yourusername/nvidia_hackathon/issues)
- **API Docs**: http://localhost:8000/docs (when running)

---

## Documentation Map

```
📚 Documentation Structure
│
├── 🚀 Quick Start Guide          → Get running in 5 minutes
│   └── Installation, setup, troubleshooting
│
├── 📖 User Guide                 → How to use all features
│   ├── For Children             → Activities, voice, camera, emergency
│   ├── For Parents              → Dashboard, monitoring, alerts, AI assistant
│   └── For Babysitters          → Read-only monitoring
│
├── ⭐ Features Guide             → Complete feature documentation
│   ├── Child Features           → Chat, stories, homework, games
│   ├── Parent Features          → Monitoring, alerts, profiles, settings
│   └── AI/ML Features           → LLM, RAG, vision, voice, safety
│
├── 🎯 Project Overview           → What, why, and use cases
│   ├── Problem & Solution       → What we're solving
│   ├── Key Features             → Main capabilities
│   ├── Use Cases                → Real-world scenarios
│   └── Roadmap                  → Future plans
│
├── 🔒 Safety & Privacy Guide     → Our commitments
│   ├── Privacy Commitments      → Data protection policies
│   ├── Safety Features          → Multi-layer monitoring
│   ├── Data Collection          → What we collect and why
│   └── Compliance               → COPPA, public domain sources
│
└── 🛠️ Technical Overview         → For developers
    ├── Architecture             → System design
    ├── Technology Stack         → Tools and frameworks
    ├── API Documentation        → Endpoints and usage
    └── Development Guide        → Setup and contribution
```

**Start here:** [Documentation Index](docs/README.md)

---

<div align="center">

**Built with ❤️ for the NVIDIA AI Hackathon**

⭐ Star this repo if you find it useful!

</div>
