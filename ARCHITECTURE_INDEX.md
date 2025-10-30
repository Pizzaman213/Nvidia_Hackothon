# AI Babysitter - Codebase Architecture Index

This directory contains comprehensive documentation of the AI Babysitter application architecture.

## Generated Documentation Files

### 1. **CODEBASE_ARCHITECTURE.md** (Primary - 479 lines)
   - **Purpose**: Complete architecture overview
   - **Contents**:
     - Frontend architecture & technology stack
     - Backend architecture & technology stack
     - Component structure and organization
     - API service layer design
     - React contexts and hooks
     - Service layer (LLM, Safety, Vision, Voice, Notifications)
     - Connection flows and integration points
     - Error message tracking (critical finding)
     - Debugging checklist
     - Deployment considerations
   
   **Start here for**: Understanding the full system architecture

### 2. **QUICK_REFERENCE.md** (Secondary - 328 lines)
   - **Purpose**: Quick lookup guide with file paths
   - **Contents**:
     - All file locations with absolute paths
     - Critical error location pinpointed
     - API endpoints summary table
     - Environment variables checklist
     - Running commands for dev/docker
     - Debugging commands
     - Component communication flow diagram
     - Quick navigation to key features
   
   **Start here for**: Finding specific files and debugging

## Key Findings

### Critical Error Location
**Error Message**: "I'm having trouble connecting right now. Please try again in a moment."

**Location**: `/Users/connorsecrist/Nvidia_hackathon/backend/app/services/llm_service.py:90`

**Root Cause**: Exception in `requests.post()` call to NVIDIA Nemotron API

**Trigger Conditions**:
1. Missing or invalid NVIDIA API key
2. Network connectivity issues
3. NVIDIA API endpoint unreachable
4. API rate limits exceeded
5. Request timeout (30 seconds)

## Project Overview

### Architecture Type
Full-stack React TypeScript frontend with Python FastAPI backend

### Technology Stack

**Frontend**:
- React 19.2.0 + TypeScript 4.9.5
- Axios (HTTP client)
- React Router (routing)
- Tailwind CSS (styling)
- Web Speech API (voice)
- MediaDevices API (camera)

**Backend**:
- FastAPI (Python web framework)
- NVIDIA Nemotron LLM (main AI)
- SQLAlchemy (ORM)
- SQLite/PostgreSQL (database)
- WebSockets (real-time)

### Key Features
1. **Child Interface**: Voice chat with AI babysitter
2. **Parent Dashboard**: Real-time monitoring and alerts
3. **Safety System**: Multi-layer safety detection
4. **Activity Tracking**: Session and interaction logging
5. **Image Analysis**: On-demand photo processing
6. **Parent Assistance**: AI-powered parenting advice

## File Organization

### Frontend Components
```
/frontend/src/
  - components/child/: VoiceChat, CameraCapture, ActivitySelector, etc.
  - components/parent/: Dashboard, AlertPanel, ActivityLog, Settings, etc.
  - contexts/: SessionContext, VoiceContext
  - hooks/: useBackendAPI, useVoiceRecognition, useVoiceSynthesis, useCamera
  - pages/: Login, ChildInterface, ParentDashboard
  - services/: api.ts (centralized API client)
  - types/: TypeScript interfaces
```

### Backend Services
```
/backend/app/
  - api/: Routers for sessions, chat, images, alerts, activities, etc.
  - services/: LLM, safety, vision, voice, notification services
  - models/: SQLAlchemy models for database
  - database/: SQLAlchemy configuration
  - utils/: Prompt templates
```

## Communication Architecture

### Frontend to Backend
- **HTTP/REST**: Axios client in `services/api.ts`
- **WebSocket**: Real-time parent notifications
- **Configuration**: `.env` with `REACT_APP_API_URL`

### Backend to External APIs
- **NVIDIA Nemotron**: LLM for chat responses
- **OpenAI** (optional): Whisper STT, GPT-4V Vision, TTS
- **Anthropic** (optional): Claude 3 Vision
- **ElevenLabs** (optional): Premium TTS

## API Design Pattern

### Response Format
Direct responses (not wrapped):
```json
{
  "response": "AI message",
  "audio_url": "/audio/file.mp3",
  "requires_camera": false,
  "safety_status": "none",
  "emotion": "happy"
}
```

### Error Handling
1. **Network Errors**: Caught in Axios interceptor
2. **Server Errors**: Handled in backend endpoints
3. **API Failures**: Graceful fallback messages
4. **User Display**: Red error boxes + spoken error messages

## State Management

### React Context Providers
1. **SessionContext**: Current user session state
2. **VoiceContext**: Voice recognition and synthesis

### Custom Hooks
- `useBackendAPI`: Generic API wrapper with loading/error
- `useVoiceRecognition`: Speech-to-text wrapper
- `useVoiceSynthesis`: Text-to-speech wrapper
- `useCamera`: Camera control (safety-focused)

## Safety Features

### Multi-Layer Detection
1. Keyword matching for urgent concerns
2. LLM analysis for safety issues
3. Emotion detection
4. Image content moderation

### Parent Notifications
- WebSocket real-time alerts
- Alert severity levels
- Activity logging
- Dashboard display

## Configuration

### Environment Variables

**Frontend** (in `/frontend/.env`):
```env
REACT_APP_API_URL=http://localhost:8000
```

**Backend** (in `/backend/.env`):
```env
NVIDIA_API_KEY=nvapi-xxxxx
NVIDIA_BASE_URL=https://integrate.api.nvidia.com/v1
NVIDIA_MODEL=llama-3.3-nemotron-super-49b-v1.5
DATABASE_URL=sqlite:///./babysitter.db
SECRET_KEY=your-secret-key
```

## Running the Application

### Development Mode
```bash
# Terminal 1 - Frontend
cd frontend
npm install
npm start  # http://localhost:3000

# Terminal 2 - Backend
cd backend
pip install -r requirements.txt
python run.py  # http://localhost:8000
```

### Docker
```bash
docker-compose up
```

## Troubleshooting

### Common Issues

**Issue**: Child sees "I'm having trouble connecting..."
1. Check `NVIDIA_API_KEY` is set and valid
2. Verify backend is running: `curl http://localhost:8000/health`
3. Check frontend `.env` points to correct backend URL
4. Verify NVIDIA API endpoint is accessible

**Issue**: Frontend can't connect to backend
1. Ensure `REACT_APP_API_URL` matches backend address
2. Check CORS settings in `backend/app/main.py`
3. Verify both are running on expected ports

**Issue**: Parent alerts not appearing
1. Check WebSocket connection: `ws://localhost:8000/ws/parent/{parentId}`
2. Verify alerts are generated in `safety_service.py`
3. Check browser console for WebSocket errors

## Additional Documentation

- **CLAUDE.md**: Complete feature documentation (83 KB)
- **PROJECT_SUMMARY.md**: Project overview and features
- **QUICKSTART.md**: Initial setup instructions
- **DEPLOYMENT_CHECKLIST.md**: Production deployment guide
- **README.md**: User-facing documentation

## Key Files by Purpose

### Understanding Chat Flow
1. Frontend: `/frontend/src/components/child/VoiceChat.tsx`
2. Backend: `/backend/app/api/chat.py`
3. LLM: `/backend/app/services/llm_service.py`

### Understanding Parent Dashboard
1. Frontend: `/frontend/src/components/parent/Dashboard.tsx`
2. Alerts: `/frontend/src/components/parent/AlertPanel.tsx`
3. Backend: `/backend/app/api/alerts.py`

### Understanding Session Management
1. Frontend: `/frontend/src/contexts/SessionContext.tsx`
2. Backend: `/backend/app/api/sessions.py`
3. Models: `/backend/app/models/session.py`

### Understanding API Integration
1. Frontend: `/frontend/src/services/api.ts`
2. Frontend Hook: `/frontend/src/hooks/useBackendAPI.ts`
3. Backend: `/backend/app/main.py`

## Development Notes

### Type Safety
- Frontend: Full TypeScript (strict mode)
- Backend: Pydantic models for validation
- Both use type annotations throughout

### Error Handling Strategy
- Try-catch blocks in async functions
- Axios interceptors for HTTP errors
- Fallback messages for all failure paths
- Console logging for debugging

### Performance Considerations
- 30-second timeout for LLM API calls
- 10-second refresh interval for alerts (configurable)
- Message caching in localStorage for sessions
- Lazy loading for activities (pagination)

### Security Notes
- Camera never auto-starts (safety-first)
- Session IDs used for authentication
- WebSocket connections per parent ID
- PIN authentication for parent login (demo only)

## Next Steps for Development

1. **To Add New Feature**:
   - Add type in `/frontend/src/types/index.ts`
   - Add API method in `/frontend/src/services/api.ts`
   - Add backend route in `/backend/app/api/`
   - Add React component in `/frontend/src/components/`

2. **To Debug Issue**:
   - Check logs in backend: `python run.py`
   - Check browser console: F12
   - Check `.env` configuration
   - Use debugging commands in QUICK_REFERENCE.md

3. **To Deploy**:
   - See DEPLOYMENT_CHECKLIST.md
   - Ensure all `.env` variables are set
   - Run `npm run build` for frontend
   - Use `uvicorn` with multiple workers for backend

## Document Summary

| Document | Size | Focus | Audience |
|----------|------|-------|----------|
| CODEBASE_ARCHITECTURE.md | 16 KB | Complete technical overview | Developers, architects |
| QUICK_REFERENCE.md | 10 KB | File locations & commands | Developers debugging |
| CLAUDE.md | 83 KB | Complete feature docs | Feature developers |
| PROJECT_SUMMARY.md | 12 KB | Project features | Project managers |
| QUICKSTART.md | 6 KB | Getting started | New developers |
| DEPLOYMENT_CHECKLIST.md | 10 KB | Production deployment | DevOps, deployment |

---

**Generated**: October 29, 2025
**Status**: Complete and accurate as of this date
**Maintainer**: AI Babysitter Development Team

For questions about specific components, refer to the appropriate documentation or source code files.
