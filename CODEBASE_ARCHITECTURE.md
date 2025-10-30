# AI Babysitter Application - Codebase Architecture Summary

## Overview
This is a **full-stack React/FastAPI application** for AI-powered child supervision. The system consists of a TypeScript React frontend and a Python FastAPI backend that integrates with NVIDIA Nemotron LLM.

---

## FRONTEND ARCHITECTURE

### Technology Stack
- **Framework**: React 19.2.0 with TypeScript 4.9.5
- **Routing**: React Router v7
- **HTTP Client**: Axios 1.13.1
- **State Management**: React Context API + custom hooks
- **Styling**: Tailwind CSS 3.4.18
- **Build Tool**: Create React App (react-scripts 5.0.1)
- **Web APIs**: Web Speech API (voice), MediaDevices API (camera)

### Directory Structure
```
frontend/src/
├── components/
│   ├── child/                    # Child interface components
│   │   ├── VoiceChat.tsx         # Main voice interaction
│   │   ├── CameraCapture.tsx     # Photo capture
│   │   ├── ActivitySelector.tsx  # Activity picker
│   │   ├── MessageDisplay.tsx    # Chat history
│   │   └── PanicButton.tsx       # Emergency button
│   ├── parent/                   # Parent dashboard components
│   │   ├── Dashboard.tsx         # Main parent view (tabs)
│   │   ├── AlertPanel.tsx        # Safety alerts
│   │   ├── ActivityLog.tsx       # Activity history
│   │   ├── Settings.tsx          # Configuration
│   │   └── ParentAssistant.tsx   # AI advice for parents
│   └── shared/                   # Reusable components
│       ├── LoadingSpinner.tsx
│       └── AudioPlayer.tsx
├── contexts/                     # React Context providers
│   ├── SessionContext.tsx        # User session state
│   └── VoiceContext.tsx          # Voice API wrapper
├── hooks/                        # Custom React hooks
│   ├── useBackendAPI.ts         # Generic API call wrapper
│   ├── useVoiceRecognition.ts   # Speech-to-text
│   ├── useVoiceSynthesis.ts     # Text-to-speech
│   └── useCamera.ts             # Camera control
├── pages/                        # Main page components
│   ├── Login.tsx                # Authentication
│   ├── ChildInterface.tsx       # Child main page
│   └── ParentDashboard.tsx      # Parent main page
├── services/
│   └── api.ts                   # Centralized API service
├── types/
│   └── index.ts                 # TypeScript type definitions
└── App.tsx                      # Root component with routing
```

### Key API Service Layer (`src/services/api.ts`)

**Configuration**:
- Base URL: `process.env.REACT_APP_API_URL` (defaults to `http://localhost:8000`)
- Timeout: 30 seconds
- Axios instance with request/response interceptors

**API Endpoints** (organized by feature):
```typescript
api.session.start(childName, childAge, parentId)      // POST /api/sessions
api.session.end(sessionId)                             // POST /api/sessions/{id}/end
api.session.get(sessionId)                             // GET /api/sessions/{id}

api.chat.sendMessage(request)                          // POST /api/chat
api.image.analyze(request)                             // POST /api/images/analyze

api.alerts.getAll(sessionId)                           // GET /api/alerts/{id}
api.alerts.getUnresolved(sessionId)                    // GET /api/alerts/{id}/unresolved
api.alerts.resolve(alertId)                            // PUT /api/alerts/{id}/resolve

api.activities.getAll(sessionId, page, pageSize)       // GET /api/activities/{id}
api.activities.create(sessionId, type, description)    // POST /api/activities

api.settings.get(parentId)                             // GET /api/settings/{id}
api.settings.update(parentId, settings)                // PUT /api/settings/{id}

api.emergency.trigger(sessionId, reason)               // POST /api/emergency

api.parentAssistant.getAdvice(request)                 // POST /api/parent-assistant
api.parentAssistant.getConversationSummary(sessionId)  // GET /api/parent-assistant/conversation-summary/{id}
```

### React Contexts

#### SessionContext
- Manages current user session state
- Provides `startSession()` and `endSession()` methods
- Persists session to localStorage
- Used by both child and parent interfaces

#### VoiceContext
- Wraps Web Speech API (voice recognition) and Text-to-Speech
- Provides `isListening`, `isSpeaking`, `transcript` state
- Handles microphone permissions and errors

### Custom Hooks

#### useBackendAPI
Generic hook for making API calls with loading/error handling:
- Returns: `{ data, loading, error, execute, reset }`
- Error handling for Axios errors with fallback messages
- Used throughout app for all API interactions

#### useVoiceRecognition
- Wraps `window.SpeechRecognition` or `window.webkitSpeechRecognition`
- Provides interim and final transcripts
- Handles permission denied and browser support

#### useVoiceSynthesis
- Uses `window.speechSynthesis` API
- Multiple voice options with fallbacks
- Rate/pitch/volume control

#### useCamera
- Wraps `navigator.mediaDevices.getUserMedia()`
- **Critical safety feature**: Camera never auto-starts
- User must explicitly click to activate
- Stops immediately after capture

### Error Handling in Frontend

**Error Flow**:
1. API calls use `useBackendAPI` hook
2. Axios interceptor catches network errors
3. AxiosError handling distinguishes:
   - `err.response`: Server returned error (HTTP 4xx/5xx)
   - `err.request`: No response received (network error)
   - Other: Client-side error (request setup failed)
4. Error messages displayed to user in UI

**Example Error States**:
- VoiceChat component displays errors in red box
- AlertPanel shows "Failed to load alerts" message
- ActivityLog shows error on first load attempt

---

## BACKEND ARCHITECTURE

### Technology Stack
- **Framework**: FastAPI (Python 3.10+)
- **LLM**: NVIDIA Nemotron llama-3.3-nemotron-super-49b-v1.5
- **Vision** (optional): OpenAI GPT-4V or Anthropic Claude 3 Opus
- **Speech-to-Text** (optional): OpenAI Whisper
- **Text-to-Speech** (optional): ElevenLabs or OpenAI TTS
- **Database**: SQLite (dev) or PostgreSQL (production)
- **ORM**: SQLAlchemy
- **Real-time**: WebSockets for parent notifications

### Directory Structure
```
backend/app/
├── main.py                          # FastAPI app entry point
├── config.py                        # Configuration management
├── api/                             # API endpoint routers
│   ├── chat.py                     # Chat & story endpoints
│   ├── images.py                   # Image analysis
│   ├── sessions.py                 # Session management
│   ├── voice.py                    # Speech processing
│   ├── activities.py               # Activity tracking
│   ├── alerts.py                   # Safety alerts
│   ├── emergency.py                # Panic button
│   ├── settings.py                 # Parent settings
│   └── parent_assistant.py         # AI parenting advice
├── services/                        # Business logic
│   ├── llm_service.py              # NVIDIA Nemotron integration
│   ├── vision_service.py           # Image analysis
│   ├── voice_service.py            # STT/TTS
│   ├── safety_service.py           # Safety detection
│   └── notification_service.py     # WebSocket notifications
├── models/                          # Data models
│   ├── session.py                  # SessionDB
│   ├── message.py                  # MessageDB
│   ├── activity.py                 # ActivityDB
│   └── alert.py                    # SafetyAlertDB
├── database/
│   └── db.py                       # SQLAlchemy setup
└── utils/
    └── prompts.py                  # LLM prompt templates
```

### Core Services

#### LLM Service (`llm_service.py`)
**Location of Connection Error**:
```python
async def generate(self, message: str, ...) -> str:
    try:
        response = requests.post(
            f"{self.base_url}/chat/completions",
            headers={"Authorization": f"Bearer {self.api_key}", ...},
            json={...},
            timeout=30
        )
        response.raise_for_status()
        result = response.json()
        return result["choices"][0]["message"]["content"]
    
    except requests.exceptions.RequestException as e:
        print(f"Error calling NVIDIA API: {e}")
        # THIS IS THE "I'm having trouble connecting" MESSAGE:
        return "I'm having trouble connecting right now. Please try again in a moment."
```

**Error Causes**:
1. Missing/invalid `NVIDIA_API_KEY` in `.env`
2. Network connectivity issues
3. NVIDIA API endpoint unreachable
4. API rate limits exceeded
5. Timeout (30 seconds) exceeded

#### Safety Service (`safety_service.py`)
- Multi-layer safety detection:
  1. Keyword matching (urgent keywords)
  2. LLM analysis for concerns
  3. Emotion detection
  4. Image content moderation
- Creates `SafetyAlertDB` records
- Notifies parent via WebSocket

#### Vision Service (`vision_service.py`)
- Provider priority:
  1. NVIDIA Cosmos (if enabled)
  2. OpenAI GPT-4V
  3. Anthropic Claude 3
- Contexts: homework, game, safety_check, show_tell

#### Voice Service (`voice_service.py`)
- **STT**: OpenAI Whisper (requires `OPENAI_API_KEY`)
- **TTS**: ElevenLabs → OpenAI → gTTS (fallback)

### Configuration (`config.py`)

**Required Environment Variables**:
```env
NVIDIA_API_KEY=nvapi-xxxxx                          # LLM access
NVIDIA_BASE_URL=https://integrate.api.nvidia.com/v1
NVIDIA_MODEL=llama-3.3-nemotron-super-49b-v1.5
```

**Optional Environment Variables**:
```env
OPENAI_API_KEY=sk-xxxxx                  # Whisper STT, GPT-4V
ANTHROPIC_API_KEY=sk-ant-xxxxx           # Claude Vision
ELEVENLABS_API_KEY=xxxxx                 # Premium TTS
DATABASE_URL=sqlite:///./babysitter.db   # Or PostgreSQL
```

### API Response Format

**Direct Response (No Wrapper)**:
- Frontend expects direct data, not wrapped in `{ success, data }`
- Example chat response:
```json
{
  "response": "Hello! How can I help?",
  "audio_url": "/audio/xyz.mp3",
  "requires_camera": false,
  "safety_status": "none",
  "emotion": "happy"
}
```

---

## CONNECTION FLOW

### Session Initialization
```
Login Page → Select Child
  ↓
Child Setup Form (name, age)
  ↓
SessionContext.startSession() → POST /api/sessions
  ↓
Backend creates SessionDB record
  ↓
Frontend stores sessionId in state + localStorage
  ↓
ChildInterface renders (if session exists)
```

### Message Flow (Example)
```
Child: Press microphone
  ↓
VoiceChat component calls startListening()
  ↓
useVoiceRecognition: Speech recognition captures audio
  ↓
When speech ends, currentTranscript triggers handleSendMessage()
  ↓
POST /api/chat with { message, session_id, child_age }
  ↓
Backend:
  1. Verify session exists
  2. Safety check (LLM analysis)
  3. Generate response (NVIDIA Nemotron)
  4. Save to MessageDB
  ↓
Response: { response, audio_url, requires_camera, ... }
  ↓
Frontend:
  1. Display message in MessageDisplay
  2. Call useVoiceSynthesis to speak response
  3. Request camera if required
```

### Parent Monitoring
```
Parent: Open Dashboard
  ↓
Dashboard renders (checks for active session)
  ↓
AlertPanel fetches alerts: GET /api/alerts/{sessionId}/unresolved
  ↓
Auto-refresh every 10 seconds (configurable)
  ↓
WebSocket connection: /ws/parent/{parentId}
  ↓
Backend sends real-time alerts via WebSocket
  ↓
Frontend updates AlertPanel instantly
```

---

## KEY INTEGRATION POINTS

### Frontend → Backend Communication
1. **HTTP Requests** (Axios)
   - All REST API calls go through `api.ts`
   - Centralized error handling in `useBackendAPI` hook
   - Base URL from `.env`: `REACT_APP_API_URL`

2. **WebSocket** (Real-time alerts)
   - Parent dashboard connects to `/ws/parent/{parentId}`
   - Receives alerts from safety_service
   - Auto-reconnect on disconnect

3. **Error Handling**
   - Axios interceptor catches network errors
   - Backend errors caught in try-catch in `useBackendAPI`
   - User-friendly error messages displayed
   - Console logging for debugging

### Configuration Files
- **Frontend**: `.env` with `REACT_APP_API_URL`
- **Backend**: `.env` with `NVIDIA_API_KEY`, `DATABASE_URL`, etc.
- Both need to reference correct API endpoint for cross-environment communication

---

## ERROR MESSAGE TRACKING: "I'm having trouble connecting right now"

### Location
**File**: `/Users/connorsecrist/Nvidia_hackathon/backend/app/services/llm_service.py`
**Line**: 90

### Context
```python
async def generate(self, message: str, ...) -> str:
    """Generate response using NVIDIA Nemotron"""
    try:
        response = requests.post(
            f"{self.base_url}/chat/completions",
            headers={"Authorization": f"Bearer {self.api_key}", ...},
            json={"model": self.model, "messages": messages, ...},
            timeout=30
        )
        response.raise_for_status()
        return result["choices"][0]["message"]["content"]
    
    except requests.exceptions.RequestException as e:
        print(f"Error calling NVIDIA API: {e}")
        return "I'm having trouble connecting right now. Please try again in a moment."
```

### When This Message Appears
1. **Network Error**: Cannot reach NVIDIA API endpoint
2. **Authentication Error**: Invalid or missing `NVIDIA_API_KEY`
3. **API Error**: HTTP 4xx or 5xx from NVIDIA
4. **Timeout**: Request takes > 30 seconds
5. **Rate Limit**: NVIDIA API quota exceeded

### Frontend Propagation
```
Backend returns: "I'm having trouble connecting right now..."
  ↓
ChatResponse.response = "I'm having trouble connecting..."
  ↓
VoiceChat component receives response
  ↓
Creates Message object with sender='ai'
  ↓
MessageDisplay renders the message
  ↓
useVoiceSynthesis speaks the error message
```

---

## DEBUGGING CHECKLIST

### Frontend Issues
- [ ] Check browser console for errors
- [ ] Verify `REACT_APP_API_URL` in `.env` matches backend URL
- [ ] Ensure backend is running on correct port
- [ ] Test network connectivity: `curl http://localhost:8000/health`

### Backend Issues
- [ ] Verify `NVIDIA_API_KEY` is set and valid
- [ ] Check NVIDIA API endpoint is accessible
- [ ] Verify database connection
- [ ] Check backend logs for stack traces
- [ ] Test API manually: `curl http://localhost:8000/`

### Connection Error Specific
- [ ] Verify NVIDIA API key is correct (24+ characters)
- [ ] Check NVIDIA API endpoint URL is correct
- [ ] Verify internet connectivity
- [ ] Check NVIDIA API rate limits
- [ ] Test with direct curl to NVIDIA endpoint

---

## DEPLOYMENT CONSIDERATIONS

### Frontend Build
```bash
npm run build  # Creates optimized build in ./build
# Serve with: npx serve -s build
# Or deploy to Netlify/Vercel
```

### Backend Deployment
```bash
pip install -r requirements.txt
python run.py  # Development

# Production
uvicorn app.main:app --host 0.0.0.0 --port 8000 --workers 4
```

### Environment-Specific Configuration
- **Development**: `.env` points to `http://localhost:8000`
- **Production**: `.env` must point to production backend URL
- Both frontend and backend need matching configuration

---

## SUMMARY

### Architecture Highlights
1. **Clean Separation**: React frontend, FastAPI backend
2. **Type Safety**: TypeScript + Pydantic
3. **Real-time Updates**: WebSockets for parent alerts
4. **Safety First**: Multi-layer safety detection
5. **Error Handling**: Comprehensive error handling throughout

### Key Files for Understanding Architecture
1. **Frontend API Layer**: `/frontend/src/services/api.ts`
2. **Frontend State**: `/frontend/src/contexts/SessionContext.tsx`
3. **Backend LLM**: `/backend/app/services/llm_service.py` (line 90 for error)
4. **Backend Chat**: `/backend/app/api/chat.py`
5. **Frontend Chat UI**: `/frontend/src/components/child/VoiceChat.tsx`
6. **Parent Dashboard**: `/frontend/src/components/parent/Dashboard.tsx`

### Configuration
- **Frontend .env**: `REACT_APP_API_URL=http://localhost:8000`
- **Backend .env**: `NVIDIA_API_KEY`, `NVIDIA_BASE_URL`, `DATABASE_URL`
- Ensure both reference correct URLs for communication

