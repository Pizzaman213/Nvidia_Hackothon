# AI Babysitter - Quick Reference Guide

## Frontend File Locations (All absolute paths)

### Key Components
- **Child Chat Interface**: `/Users/connorsecrist/Nvidia_hackathon/frontend/src/components/child/VoiceChat.tsx`
- **Parent Dashboard**: `/Users/connorsecrist/Nvidia_hackathon/frontend/src/components/parent/Dashboard.tsx`
- **Alert Display**: `/Users/connorsecrist/Nvidia_hackathon/frontend/src/components/parent/AlertPanel.tsx`
- **Activity Log**: `/Users/connorsecrist/Nvidia_hackathon/frontend/src/components/parent/ActivityLog.tsx`
- **Camera Control**: `/Users/connorsecrist/Nvidia_hackathon/frontend/src/components/child/CameraCapture.tsx`

### State Management
- **Session Context**: `/Users/connorsecrist/Nvidia_hackathon/frontend/src/contexts/SessionContext.tsx`
- **Voice Context**: `/Users/connorsecrist/Nvidia_hackathon/frontend/src/contexts/VoiceContext.tsx`

### API Layer
- **API Service**: `/Users/connorsecrist/Nvidia_hackathon/frontend/src/services/api.ts`
- **useBackendAPI Hook**: `/Users/connorsecrist/Nvidia_hackathon/frontend/src/hooks/useBackendAPI.ts`

### Pages
- **Login Page**: `/Users/connorsecrist/Nvidia_hackathon/frontend/src/pages/Login.tsx`
- **Child Interface**: `/Users/connorsecrist/Nvidia_hackathon/frontend/src/pages/ChildInterface.tsx`
- **Parent Dashboard**: `/Users/connorsecrist/Nvidia_hackathon/frontend/src/pages/ParentDashboard.tsx`

### Configuration
- **Frontend .env**: `/Users/connorsecrist/Nvidia_hackathon/frontend/.env`
  ```env
  REACT_APP_API_URL=http://localhost:8000
  ```

---

## Backend File Locations (All absolute paths)

### Entry Point
- **Main App**: `/Users/connorsecrist/Nvidia_hackathon/backend/app/main.py`
- **Configuration**: `/Users/connorsecrist/Nvidia_hackathon/backend/app/config.py`

### API Endpoints
- **Chat API**: `/Users/connorsecrist/Nvidia_hackathon/backend/app/api/chat.py`
- **Images API**: `/Users/connorsecrist/Nvidia_hackathon/backend/app/api/images.py`
- **Sessions API**: `/Users/connorsecrist/Nvidia_hackathon/backend/app/api/sessions.py`
- **Alerts API**: `/Users/connorsecrist/Nvidia_hackathon/backend/app/api/alerts.py`
- **Activities API**: `/Users/connorsecrist/Nvidia_hackathon/backend/app/api/activities.py`
- **Parent Assistant API**: `/Users/connorsecrist/Nvidia_hackathon/backend/app/api/parent_assistant.py`

### Services (Business Logic)
- **LLM Service**: `/Users/connorsecrist/Nvidia_hackathon/backend/app/services/llm_service.py` ← ERROR MESSAGE HERE (line 90)
- **Safety Service**: `/Users/connorsecrist/Nvidia_hackathon/backend/app/services/safety_service.py`
- **Vision Service**: `/Users/connorsecrist/Nvidia_hackathon/backend/app/services/vision_service.py`
- **Voice Service**: `/Users/connorsecrist/Nvidia_hackathon/backend/app/services/voice_service.py`
- **Notification Service**: `/Users/connorsecrist/Nvidia_hackathon/backend/app/services/notification_service.py`

### Database Models
- **Session Model**: `/Users/connorsecrist/Nvidia_hackathon/backend/app/models/session.py`
- **Message Model**: `/Users/connorsecrist/Nvidia_hackathon/backend/app/models/message.py`
- **Activity Model**: `/Users/connorsecrist/Nvidia_hackathon/backend/app/models/activity.py`
- **Alert Model**: `/Users/connorsecrist/Nvidia_hackathon/backend/app/models/alert.py`
- **Database Setup**: `/Users/connorsecrist/Nvidia_hackathon/backend/app/database/db.py`

### Configuration & Utils
- **Prompts**: `/Users/connorsecrist/Nvidia_hackathon/backend/app/utils/prompts.py`
- **Backend .env**: `/Users/connorsecrist/Nvidia_hackathon/.env`

---

## Critical Error Location

### "I'm having trouble connecting right now. Please try again in a moment."
**File**: `/Users/connorsecrist/Nvidia_hackathon/backend/app/services/llm_service.py`
**Line**: 90
**Trigger**: When NVIDIA API call fails (network error, auth error, timeout, rate limit)

### Flow
```
VoiceChat component (frontend)
  ↓
POST /api/chat
  ↓
Backend chat.py endpoint
  ↓
llm_service.generate() method
  ↓
requests.post() call to NVIDIA API
  ↓
Exception handler returns error message
  ↓
Frontend receives message and displays/speaks it
```

---

## API Endpoints Summary

### Session Management
| Method | Endpoint | Frontend Call |
|--------|----------|---------------|
| POST | `/api/sessions` | `api.session.start()` |
| GET | `/api/sessions/{id}` | `api.session.get()` |
| POST | `/api/sessions/{id}/end` | `api.session.end()` |

### Chat & LLM
| Method | Endpoint | Frontend Call |
|--------|----------|---------------|
| POST | `/api/chat` | `api.chat.sendMessage()` |

### Images
| Method | Endpoint | Frontend Call |
|--------|----------|---------------|
| POST | `/api/images/analyze` | `api.image.analyze()` |

### Alerts
| Method | Endpoint | Frontend Call |
|--------|----------|---------------|
| GET | `/api/alerts/{sessionId}` | `api.alerts.getAll()` |
| GET | `/api/alerts/{sessionId}/unresolved` | `api.alerts.getUnresolved()` |
| PUT | `/api/alerts/{alertId}/resolve` | `api.alerts.resolve()` |

### Activities
| Method | Endpoint | Frontend Call |
|--------|----------|---------------|
| GET | `/api/activities/{sessionId}` | `api.activities.getAll()` |
| POST | `/api/activities` | `api.activities.create()` |

### Parent Assistant
| Method | Endpoint | Frontend Call |
|--------|----------|---------------|
| POST | `/api/parent-assistant` | `api.parentAssistant.getAdvice()` |
| GET | `/api/parent-assistant/conversation-summary/{sessionId}` | `api.parentAssistant.getConversationSummary()` |

### WebSocket
| Protocol | Endpoint | Purpose |
|----------|----------|---------|
| WS | `/ws/parent/{parentId}` | Real-time alerts |

---

## Environment Variables

### Frontend Required
```env
REACT_APP_API_URL=http://localhost:8000
```

### Backend Required
```env
NVIDIA_API_KEY=nvapi-xxxxx
NVIDIA_BASE_URL=https://integrate.api.nvidia.com/v1
NVIDIA_MODEL=llama-3.3-nemotron-super-49b-v1.5
DATABASE_URL=sqlite:///./babysitter.db
SECRET_KEY=your-secret-key-here
```

### Backend Optional
```env
OPENAI_API_KEY=sk-xxxxx
ANTHROPIC_API_KEY=sk-ant-xxxxx
ELEVENLABS_API_KEY=xxxxx
```

---

## Running the Application

### Frontend
```bash
cd /Users/connorsecrist/Nvidia_hackathon/frontend
npm start  # Starts on http://localhost:3000
```

### Backend
```bash
cd /Users/connorsecrist/Nvidia_hackathon/backend
python run.py  # Or: uvicorn app.main:app --reload
# Runs on http://localhost:8000
```

### With Docker
```bash
cd /Users/connorsecrist/Nvidia_hackathon
docker-compose up
```

---

## Common Issue: Connection Error Message

### Symptoms
Child sees/hears: "I'm having trouble connecting right now. Please try again in a moment."

### Probable Causes (in order of likelihood)
1. **Missing NVIDIA API Key**
   - Check: `echo $NVIDIA_API_KEY` (should show key)
   - Check: `.env` file has `NVIDIA_API_KEY=...`
   - Get key: https://build.nvidia.com/

2. **Backend Not Running**
   - Check: `curl http://localhost:8000/health`
   - Should return: `{"status": "healthy", ...}`

3. **Frontend Pointing to Wrong Backend URL**
   - Check: Frontend `.env` has `REACT_APP_API_URL=http://localhost:8000`
   - Verify: Backend is actually running on that port

4. **Network/API Issues**
   - Check: NVIDIA API endpoint is accessible
   - Test: `curl https://integrate.api.nvidia.com/v1/models`
   - Check: NVIDIA API rate limits

5. **Timeout**
   - Backend sets 30-second timeout for NVIDIA API
   - May need to increase if network is slow

---

## Component Communication Flow

```
User speaks to microphone
  ↓
VoiceChat component (useVoiceRecognition hook)
  ↓
Speech converted to text (transcript)
  ↓
handleSendMessage() called
  ↓
api.chat.sendMessage() via useBackendAPI hook
  ↓
Axios posts to /api/chat
  ↓
Backend chat endpoint
  ↓
llm_service.generate() sends to NVIDIA API
  ↓
Response returns (or error message)
  ↓
ChatResponse object sent to frontend
  ↓
Message added to messages[] state
  ↓
MessageDisplay component renders message
  ↓
useVoiceSynthesis speaks response
```

---

## File Sizes & Line Counts

### Key Frontend Files
- api.ts: 253 lines
- VoiceChat.tsx: 219 lines
- SessionContext.tsx: 97 lines
- Dashboard.tsx: 120 lines
- useBackendAPI.ts: 78 lines

### Key Backend Files
- llm_service.py: 150+ lines
- chat.py (router): 80+ lines
- main.py: 100+ lines
- models/: Multiple files

---

## Debugging Commands

### Check Backend Health
```bash
curl http://localhost:8000/health
curl http://localhost:8000/
```

### Check NVIDIA Connection (backend container)
```bash
python -c "import requests; print(requests.get('https://integrate.api.nvidia.com/v1/models', headers={'Authorization': 'Bearer YOUR_KEY'}).status_code)"
```

### Check Frontend Environment
```bash
echo $REACT_APP_API_URL
```

### View Backend Logs
```bash
docker-compose logs -f backend
# Or if running locally
# python run.py  (will show logs)
```

### Test API Directly
```bash
# Create session
curl -X POST http://localhost:8000/api/sessions \
  -H "Content-Type: application/json" \
  -d '{"child_name":"Test","child_age":8,"parent_id":"parent1"}'

# Send chat message
curl -X POST http://localhost:8000/api/chat \
  -H "Content-Type: application/json" \
  -d '{"session_id":"your-session-id","message":"Hello","child_age":8}'
```

---

## Quick Navigation

### To Understand How Chat Works
1. Read: `/Users/connorsecrist/Nvidia_hackathon/frontend/src/components/child/VoiceChat.tsx` (frontend)
2. Read: `/Users/connorsecrist/Nvidia_hackathon/backend/app/api/chat.py` (backend)
3. Read: `/Users/connorsecrist/Nvidia_hackathon/backend/app/services/llm_service.py` (LLM integration)

### To Understand Session Management
1. Read: `/Users/connorsecrist/Nvidia_hackathon/frontend/src/contexts/SessionContext.tsx`
2. Read: `/Users/connorsecrist/Nvidia_hackathon/backend/app/api/sessions.py`
3. Read: `/Users/connorsecrist/Nvidia_hackathon/backend/app/models/session.py`

### To Understand Parent Dashboard
1. Read: `/Users/connorsecrist/Nvidia_hackathon/frontend/src/components/parent/Dashboard.tsx`
2. Read: `/Users/connorsecrist/Nvidia_hackathon/frontend/src/components/parent/AlertPanel.tsx`
3. Read: `/Users/connorsecrist/Nvidia_hackathon/backend/app/api/alerts.py`

### To Add New Feature
1. Add TypeScript type in `/frontend/src/types/index.ts`
2. Add API method in `/frontend/src/services/api.ts`
3. Add backend route in `/backend/app/api/new_feature.py`
4. Add React component in `/frontend/src/components/...`
5. Update types if needed in `/backend/app/models/...`

