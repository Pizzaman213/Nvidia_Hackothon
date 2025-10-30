# AI Babysitter Frontend - Complete Documentation

## Table of Contents

1. [Project Overview](#project-overview)
2. [Architecture](#architecture)
3. [Setup & Installation](#setup--installation)
4. [Core Features](#core-features)
5. [Component Documentation](#component-documentation)
6. [API Integration](#api-integration)
7. [Voice & Camera Features](#voice--camera-features)
8. [State Management](#state-management)
9. [Safety & Security](#safety--security)
10. [Development Guide](#development-guide)
11. [Testing](#testing)
12. [Deployment](#deployment)
13. [Troubleshooting](#troubleshooting)

---

## Project Overview

### What is AI Babysitter?

AI Babysitter is a **mobile-responsive web application** that allows children to interact with an AI assistant through **voice** and **text**, with optional **phone camera** use for activities like homework help or playing "I Spy." Parents can monitor conversations and receive safety alerts in real-time.

### Key Principles

1. **Child Safety First**: Camera NEVER auto-starts, panic button always visible
2. **Parent Control**: Complete oversight of activities and settings
3. **Privacy-Focused**: No persistent storage of sensitive data
4. **User-Friendly**: Intuitive interfaces for both children and parents
5. **Accessible**: Works on laptops and mobile devices

### Technology Stack

```
Frontend Framework:   React 18.3.1 + TypeScript 4.9.5
Styling:              Tailwind CSS 3.4.18
Routing:              React Router v6
State Management:     React Context API
API Client:           Axios
Voice:                Web Speech API
Camera:               MediaDevices API
Build Tool:           Create React App
```

---

## Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────┐
│                     User Interface                       │
├──────────────────┬──────────────────┬───────────────────┤
│  Child Interface │ Parent Dashboard │   Login Screen    │
│  - Voice Chat    │ - Alerts         │   - Role Select   │
│  - Camera        │ - Activity Log   │   - PIN Auth      │
│  - Activities    │ - Settings       │                   │
└──────────────────┴──────────────────┴───────────────────┘
                          ↕
┌─────────────────────────────────────────────────────────┐
│                    Context Providers                     │
│    SessionContext (User Sessions)                        │
│    VoiceContext (Speech Recognition & Synthesis)         │
└─────────────────────────────────────────────────────────┘
                          ↕
┌─────────────────────────────────────────────────────────┐
│                     Custom Hooks                         │
│  useVoiceRecognition | useVoiceSynthesis | useCamera    │
│  useBackendAPI                                           │
└─────────────────────────────────────────────────────────┘
                          ↕
┌─────────────────────────────────────────────────────────┐
│                    API Service Layer                     │
│  Axios HTTP Client → Backend REST API                   │
│  http://localhost:8000/api/                             │
└─────────────────────────────────────────────────────────┘
```

### Project Structure

```
ai-babysitter-frontend/
│
├── public/                      # Static assets
│   ├── index.html
│   └── favicon.ico
│
├── src/
│   │
│   ├── components/              # React Components
│   │   │
│   │   ├── child/               # Child Interface Components
│   │   │   ├── VoiceChat.tsx           # Main voice interaction
│   │   │   ├── CameraCapture.tsx       # On-demand photo capture
│   │   │   ├── ActivitySelector.tsx    # Activity type picker
│   │   │   ├── MessageDisplay.tsx      # Chat history
│   │   │   └── PanicButton.tsx         # SOS emergency button
│   │   │
│   │   ├── parent/              # Parent Dashboard Components
│   │   │   ├── Dashboard.tsx           # Main parent view
│   │   │   ├── AlertPanel.tsx          # Safety alerts
│   │   │   ├── ActivityLog.tsx         # Activity history
│   │   │   └── Settings.tsx            # Configuration panel
│   │   │
│   │   └── shared/              # Shared Components
│   │       ├── LoadingSpinner.tsx      # Loading indicator
│   │       └── AudioPlayer.tsx         # Audio playback
│   │
│   ├── contexts/                # React Context Providers
│   │   ├── SessionContext.tsx          # User session state
│   │   └── VoiceContext.tsx            # Voice API wrapper
│   │
│   ├── hooks/                   # Custom React Hooks
│   │   ├── useVoiceRecognition.ts      # Speech-to-text
│   │   ├── useVoiceSynthesis.ts        # Text-to-speech
│   │   ├── useCamera.ts                # Camera access
│   │   └── useBackendAPI.ts            # API call wrapper
│   │
│   ├── pages/                   # Main Page Components
│   │   ├── Login.tsx                   # Authentication page
│   │   ├── ChildInterface.tsx          # Child main page
│   │   └── ParentDashboard.tsx         # Parent main page
│   │
│   ├── services/                # Backend API Services
│   │   └── api.ts                      # Axios API client
│   │
│   ├── types/                   # TypeScript Definitions
│   │   └── index.ts                    # All type definitions
│   │
│   ├── App.tsx                  # Root component with routing
│   ├── index.tsx                # React entry point
│   └── index.css                # Global styles + Tailwind
│
├── .env                         # Environment variables
├── .env.example                 # Environment template
├── package.json                 # Dependencies
├── tsconfig.json                # TypeScript config
├── tailwind.config.js           # Tailwind CSS config
├── postcss.config.js            # PostCSS config
└── README_SETUP.md              # Setup instructions
```

---

## Setup & Installation

### Prerequisites

- **Node.js**: v14.0.0 or higher
- **npm**: v6.0.0 or higher
- **Modern Browser**: Chrome/Edge (recommended for voice features)
- **Microphone**: For voice interaction
- **Camera**: For photo-based activities (optional)

### Installation Steps

```bash
# 1. Navigate to project directory
cd ai-babysitter-frontend

# 2. Install all dependencies
npm install

# 3. Create environment file
cp .env.example .env

# 4. Edit .env with your backend URL
# REACT_APP_API_URL=http://localhost:8000

# 5. Start development server
npm start

# Application will open at http://localhost:3000
```

### Build for Production

```bash
# Create optimized production build
npm run build

# Output will be in ./build directory
# Serve with:
npx serve -s build
```

---

## Core Features

### 1. Child Interface

#### Voice Interaction
- **Speech Recognition**: Real-time voice-to-text
- **Voice Responses**: AI speaks responses aloud
- **Visual Feedback**: Animated waveform while listening
- **Transcript Display**: Shows what child is saying
- **Error Handling**: Friendly messages for mic issues

#### Activity Types
1. **📚 Story Time**: AI generates and narrates stories
2. **🔍 I Spy Game**: Play I Spy using camera photos
3. **✏️ Homework Helper**: Get help with schoolwork (can scan worksheets)
4. **💬 Free Chat**: Natural conversation with AI

#### Camera Features
- **User-Triggered Only**: Camera NEVER starts automatically
- **Preview Before Capture**: See what you're photographing
- **One-Shot Capture**: Takes single photo, then camera stops
- **Retake Option**: Don't like the photo? Take another
- **Context-Aware**: AI knows why you're taking the photo

#### Safety Features
- **🚨 SOS Button**: Large red panic button (top-right corner)
- **Always Visible**: Accessible from any screen
- **Immediate Alert**: Notifies parents instantly
- **Session Management**: Automatic timeout for safety

### 2. Parent Dashboard

#### Real-Time Alerts
- **Severity Levels**: Low, Medium, High, Critical
- **Color-Coded**: Easy visual identification
- **Auto-Refresh**: Updates every 10 seconds
- **Resolve Alerts**: Mark as handled
- **Alert Types**:
  - Safety concerns
  - Emotional distress
  - Inappropriate content
  - Request for parent

#### Activity Log
- **Timeline View**: Chronological activity history
- **Activity Details**: What, when, how long
- **In-Progress Indicator**: Current activities highlighted
- **Pagination**: Load more for extensive history
- **Icons & Colors**: Visual activity type identification

#### Settings & Controls
- **Child Profile**: Name, age
- **Allowed Activities**: Enable/disable specific activities
- **Safety Settings**:
  - Session timeout duration
  - Content filter level (strict/moderate/relaxed)
  - Camera enable/disable
  - Microphone enable/disable
- **Emergency Contact**: Phone number for alerts
- **Notification Preferences**: Email, push, alert thresholds

---

## Component Documentation

### Child Components

#### VoiceChat.tsx
**Purpose**: Main voice interaction component

**Features**:
- Continuous listening mode
- Real-time transcript display
- Message history
- AI response playback
- Camera request detection

**Props**:
```typescript
interface VoiceChatProps {
  activityType?: string;           // Current activity
  onCameraRequired?: () => void;   // Callback when camera needed
}
```

**Usage**:
```tsx
<VoiceChat
  activityType={ActivityType.FREE_CHAT}
  onCameraRequired={() => setShowCamera(true)}
/>
```

**State Flow**:
```
User Speaks → Speech Recognition → Transcript →
Backend API → AI Response → Text-to-Speech → Playback
```

---

#### CameraCapture.tsx
**Purpose**: Safe, user-triggered photo capture

**Features**:
- On-demand activation only
- Live preview
- Capture/retake functionality
- Immediate shutdown after capture
- Base64 image encoding

**Props**:
```typescript
interface CameraCaptureProps {
  onPhotoCapture: (imageData: string) => void;  // Callback with base64
  context?: string;                              // Why taking photo
}
```

**Safety Implementation**:
```typescript
// Camera starts ONLY when user clicks
const handleStartCamera = async () => {
  const stream = await navigator.mediaDevices.getUserMedia({
    video: true
  });
  // ... show preview ...
}

// Camera stops IMMEDIATELY after capture
const capturePhoto = async () => {
  // Capture frame
  const imageData = canvas.toDataURL('image/jpeg');

  // Stop camera RIGHT AWAY
  stream.getTracks().forEach(track => track.stop());

  return imageData;
}
```

---

#### ActivitySelector.tsx
**Purpose**: Choose activity type

**Features**:
- 4 predefined activities
- Visual cards with icons
- Camera requirement indicator
- Current activity highlighting

**Usage**:
```tsx
<ActivitySelector
  onSelectActivity={(type) => setActivity(type)}
  currentActivity={currentActivity}
/>
```

---

#### MessageDisplay.tsx
**Purpose**: Show chat history

**Features**:
- Auto-scroll to latest message
- Sender identification (child vs AI)
- Timestamps
- Camera requirement indicator
- Empty state

---

#### PanicButton.tsx
**Purpose**: Emergency parent alert

**Features**:
- Always visible (fixed position)
- Large, easy to press
- Red color (danger indicator)
- Success feedback
- API call to backend

**Usage**:
```tsx
<PanicButton size="large" position="fixed" />
```

---

### Parent Components

#### Dashboard.tsx
**Purpose**: Main parent interface with tabs

**Features**:
- Tab navigation (Alerts, Activities, Settings)
- Session information display
- Responsive layout

---

#### AlertPanel.tsx
**Purpose**: Display and manage safety alerts

**Features**:
- Real-time updates
- Severity color-coding
- Resolve functionality
- Auto-refresh (10s interval)
- Manual refresh button

**API Integration**:
```typescript
// Fetch unresolved alerts
const alerts = await api.alerts.getUnresolved(sessionId);

// Resolve an alert
await api.alerts.resolve(alertId);
```

---

#### ActivityLog.tsx
**Purpose**: Show activity history

**Features**:
- Activity timeline
- Duration calculation
- Pagination
- Activity type icons
- In-progress indicators

---

#### Settings.tsx
**Purpose**: Configure application settings

**Features**:
- Child information
- Activity permissions
- Safety settings
- Emergency contacts
- Save/persist functionality

---

### Shared Components

#### LoadingSpinner.tsx
Simple loading indicator with optional message

#### AudioPlayer.tsx
Plays audio URLs from backend (AI voice responses)

---

## API Integration

### API Service Layer

**File**: `src/services/api.ts`

All backend communication goes through centralized API service:

```typescript
import api from '../services/api';

// Start session
const session = await api.session.start(name, age, parentId);

// Send chat message
const response = await api.chat.sendMessage({
  message: "Tell me a story",
  session_id: sessionId,
  child_age: 8
});

// Analyze image
const analysis = await api.image.analyze({
  image: base64Data,
  context: "homework help",
  session_id: sessionId
});

// Get alerts
const alerts = await api.alerts.getUnresolved(sessionId);

// Trigger panic
await api.emergency.trigger(sessionId, "Child pressed SOS");
```

### Expected Backend Endpoints

#### Session Management
```
POST   /api/session/start
Body:  { child_name, child_age, parent_id }
Response: { session_id, child_name, child_age, ... }

POST   /api/session/:id/end
Response: { success: true }
```

#### Chat & Voice
```
POST   /api/chat
Body:  { message, session_id, child_age }
Response: {
  response: string,
  audio_url?: string,
  requires_camera?: boolean,
  safety_flag?: boolean
}
```

#### Image Analysis
```
POST   /api/analyze-image
Body:  { image: base64, context: string, session_id }
Response: {
  analysis: string,
  safety_alert?: string
}
```

#### Alerts
```
GET    /api/alerts/:sessionId
Response: { alerts: Alert[] }

GET    /api/alerts/:sessionId/unresolved
Response: { alerts: Alert[] }

PUT    /api/alerts/:alertId/resolve
Response: { success: true }
```

#### Activities
```
GET    /api/activities/:sessionId?page=1&page_size=20
Response: {
  data: Activity[],
  page, page_size, total_count, has_more
}

POST   /api/activities
Body:  { session_id, activity_type, description }
Response: { activity: Activity }
```

#### Settings
```
GET    /api/settings/:parentId
Response: { settings: ParentSettings }

PUT    /api/settings/:parentId
Body:  { ... partial settings ... }
Response: { settings: ParentSettings }
```

#### Emergency
```
POST   /api/emergency
Body:  { session_id, reason? }
Response: { success: true }
```

---

## Voice & Camera Features

### Voice Recognition (Speech-to-Text)

**Hook**: `useVoiceRecognition.ts`

**Browser Support**:
- ✅ Chrome/Edge (Best)
- ⚠️ Safari (Limited)
- ❌ Firefox (Poor support)

**Implementation**:
```typescript
const {
  isListening,      // Currently recording?
  transcript,       // Final text
  interimTranscript, // Real-time text
  startListening,   // Begin recording
  stopListening,    // Stop recording
  isSupported,      // Browser support?
  error             // Error message
} = useVoiceRecognition();
```

**Features**:
- Continuous listening
- Interim results (real-time)
- Automatic language detection
- Permission handling
- Error recovery

**Usage Example**:
```typescript
<button onClick={startListening}>
  🎤 Start Talking
</button>

{isListening && (
  <p>You're saying: {interimTranscript}</p>
)}

{transcript && (
  <p>Final: {transcript}</p>
)}
```

---

### Voice Synthesis (Text-to-Speech)

**Hook**: `useVoiceSynthesis.ts`

**Browser Support**:
- ✅ All modern browsers

**Implementation**:
```typescript
const {
  speak,          // Speak text
  stop,           // Stop speaking
  pause,          // Pause
  resume,         // Resume
  isSpeaking,     // Currently speaking?
  isPaused,       // Paused?
  voices,         // Available voices
  selectedVoice,  // Current voice
  setVoice       // Change voice
} = useVoiceSynthesis();
```

**Features**:
- Multiple voice options
- Rate, pitch, volume control
- Pause/resume
- Event callbacks

**Usage Example**:
```typescript
// Speak AI response
speak("Hello! How can I help you today?");

// Stop if child interrupts
<button onClick={stop}>
  🔇 Stop Talking
</button>

// Choose voice
<select onChange={(e) => setVoice(voices[e.target.value])}>
  {voices.map((voice, i) => (
    <option key={i} value={i}>{voice.name}</option>
  ))}
</select>
```

---

### Camera Access

**Hook**: `useCamera.ts`

**Critical Safety Rules**:
1. Camera NEVER starts automatically
2. User must explicitly click button
3. Camera stops immediately after capture
4. Clear visual indicators when active
5. Permission errors handled gracefully

**Implementation**:
```typescript
const {
  isActive,        // Camera on?
  hasPermission,   // Permission granted?
  error,           // Error message
  videoRef,        // Video element ref
  startCamera,     // Turn on camera
  stopCamera,      // Turn off camera
  capturePhoto,    // Take photo (returns base64)
  isSupported      // Browser support?
} = useCamera();
```

**Usage Example**:
```tsx
// Video preview
<video ref={videoRef} autoPlay playsInline muted />

// Start camera (ONLY when user clicks)
<button onClick={startCamera}>
  📸 Take Picture
</button>

// Capture and stop
<button onClick={async () => {
  const photo = await capturePhoto();
  // Camera is now OFF
  onPhotoCapture(photo);
}}>
  ✓ Capture
</button>
```

**Safety Check**:
```typescript
// ✅ CORRECT - User-triggered
<button onClick={startCamera}>Take Picture</button>

// ❌ WRONG - Auto-starts
useEffect(() => {
  startCamera();  // NO! Never do this!
}, []);
```

---

## State Management

### SessionContext

**Purpose**: Manage user session state across app

**Provides**:
```typescript
interface SessionContextType {
  session: Session | null;              // Current session
  startSession: (name, age, parentId) => Promise<void>;
  endSession: () => void;
  loading: boolean;
  error: string | null;
}
```

**Usage**:
```typescript
import { useSession } from '../contexts/SessionContext';

const { session, startSession, endSession } = useSession();

// Start session
await startSession("Alice", 8, "parent-123");

// Access session
if (session) {
  console.log(`Session ID: ${session.session_id}`);
}

// End session
endSession();
```

**Features**:
- Automatic localStorage persistence
- Session restoration on refresh
- Loading and error states

---

### VoiceContext

**Purpose**: Centralize voice API access

**Provides**:
```typescript
interface VoiceContextType {
  isListening: boolean;
  isSpeaking: boolean;
  currentTranscript: string;
  startListening: () => void;
  stopListening: () => void;
  speak: (text: string) => void;
  stopSpeaking: () => void;
  error: string | null;
}
```

**Usage**:
```typescript
import { useVoice } from '../contexts/VoiceContext';

const {
  isListening,
  startListening,
  speak
} = useVoice();

// Start voice recognition
startListening();

// Speak response
speak("Here's your answer!");
```

---

## Safety & Security

### Camera Safety (Critical)

**Requirements**:
1. ✅ Camera never auto-starts
2. ✅ User must click "Take Picture"
3. ✅ Camera stops after capture
4. ✅ Visual indicator when active
5. ✅ Permission errors handled

**Implementation Verification**:
```typescript
// ✅ SAFE: User clicks button
<button onClick={startCamera}>📸 Take Picture</button>

// ✅ SAFE: Camera stops after capture
const capturePhoto = async () => {
  const image = canvas.toDataURL();
  stopCamera();  // Immediate shutdown
  return image;
};

// ❌ UNSAFE: Auto-start (WE DON'T DO THIS)
// useEffect(() => startCamera(), []);  // NEVER!
```

---

### Child Safety

1. **Panic/SOS Button**
   - Always visible (fixed position, top-right)
   - Large red button
   - Instant parent notification

2. **Content Filtering**
   - Backend integration points ready
   - Safety flags from AI responses
   - Inappropriate content blocking

3. **Session Management**
   - Timeout settings
   - Parent controls
   - Activity restrictions

4. **Monitoring**
   - All interactions logged
   - Parent alert system
   - Real-time oversight

---

### Data Privacy

1. **No Image Persistence**
   - Photos sent to backend immediately
   - No localStorage storage
   - Cleared after analysis

2. **Session Data**
   - Stored only during active session
   - Cleared on logout
   - No sensitive data in localStorage

3. **API Communication**
   - HTTPS required in production
   - No sensitive data in URLs
   - Proper CORS configuration

---

## Development Guide

### Running Development Server

```bash
# Start dev server (hot reload enabled)
npm start

# Runs on http://localhost:3000
# Backend should be on http://localhost:8000
```

### Code Style

**TypeScript**:
```typescript
// ✅ Use TypeScript types
interface Props {
  name: string;
  age: number;
}

const Component: React.FC<Props> = ({ name, age }) => {
  return <div>{name}, {age}</div>;
};

// ✅ Use proper async/await
const fetchData = async () => {
  try {
    const result = await api.getData();
    setData(result);
  } catch (error) {
    console.error(error);
  }
};
```

**React Hooks**:
```typescript
// ✅ Use useCallback for functions
const handleClick = useCallback(() => {
  doSomething();
}, [dependency]);

// ✅ Use useMemo for expensive calculations
const expensiveValue = useMemo(() => {
  return calculateSomething(data);
}, [data]);

// ✅ Cleanup in useEffect
useEffect(() => {
  const subscription = subscribe();
  return () => subscription.unsubscribe();
}, []);
```

---

### Adding New Features

#### 1. Adding a New Activity Type

**Step 1**: Add to types
```typescript
// src/types/index.ts
export enum ActivityType {
  STORY_TIME = 'story_time',
  I_SPY = 'i_spy',
  HOMEWORK_HELPER = 'homework_helper',
  FREE_CHAT = 'free_chat',
  NEW_ACTIVITY = 'new_activity',  // ← Add here
}
```

**Step 2**: Add card to selector
```typescript
// src/components/child/ActivitySelector.tsx
const activityCards: ActivityCard[] = [
  // ... existing activities ...
  {
    type: ActivityType.NEW_ACTIVITY,
    title: 'New Activity',
    description: 'Description here',
    icon: '🎮',
    color: 'bg-indigo-400',
    requiresCamera: false,
  },
];
```

**Step 3**: Handle in interface
```typescript
// src/pages/ChildInterface.tsx
const handleActivityChange = (activity: ActivityType) => {
  setCurrentActivity(activity);
  // Add any special logic for new activity
};
```

---

#### 2. Adding a New API Endpoint

**Step 1**: Add to API service
```typescript
// src/services/api.ts
export const api = {
  // ... existing endpoints ...

  newFeature: {
    getData: async (id: string) => {
      const response = await apiClient.get(`/api/new-feature/${id}`);
      return response.data;
    },
  },
};
```

**Step 2**: Add types
```typescript
// src/types/index.ts
export interface NewFeatureData {
  id: string;
  name: string;
  // ... other fields ...
}
```

**Step 3**: Use in component
```typescript
const { data, loading, error, execute } = useBackendAPI(api.newFeature.getData);

useEffect(() => {
  execute(featureId);
}, [featureId]);
```

---

#### 3. Adding a Parent Dashboard Section

**Step 1**: Create component
```typescript
// src/components/parent/NewSection.tsx
export const NewSection: React.FC = () => {
  return (
    <div>
      <h2>New Section</h2>
      {/* Content */}
    </div>
  );
};
```

**Step 2**: Add to Dashboard
```typescript
// src/components/parent/Dashboard.tsx
import { NewSection } from './NewSection';

const [activeTab, setActiveTab] = useState<'alerts' | 'activities' | 'settings' | 'newsection'>('alerts');

// Add tab button
<button onClick={() => setActiveTab('newsection')}>
  📊 New Section
</button>

// Add tab content
{activeTab === 'newsection' && <NewSection />}
```

---

### Debugging

#### Voice Issues
```typescript
// Check if supported
const recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
if (!recognition) {
  console.error('Speech recognition not supported');
}

// Check permissions
navigator.permissions.query({ name: 'microphone' })
  .then(result => console.log('Mic permission:', result.state));
```

#### Camera Issues
```typescript
// Check if supported
if (!navigator.mediaDevices?.getUserMedia) {
  console.error('Camera not supported');
}

// Test camera access
navigator.mediaDevices.getUserMedia({ video: true })
  .then(stream => {
    console.log('Camera access granted');
    stream.getTracks().forEach(track => track.stop());
  })
  .catch(err => console.error('Camera error:', err));
```

#### API Issues
```typescript
// Check backend connection
fetch('http://localhost:8000/api/health')
  .then(res => res.json())
  .then(data => console.log('Backend:', data))
  .catch(err => console.error('Backend unreachable:', err));
```

---

## Testing

### Manual Testing Checklist

#### Child Interface
- [ ] Login as child
- [ ] Enter name and age
- [ ] Select each activity type
- [ ] Click microphone button
- [ ] Speak and see transcript
- [ ] Hear AI response
- [ ] Click "Take Picture" button
- [ ] Camera preview appears
- [ ] Capture photo
- [ ] Camera stops after capture
- [ ] Retake photo
- [ ] Send photo
- [ ] Press SOS button
- [ ] Verify SOS alert sent

#### Parent Dashboard
- [ ] Login as parent (PIN: 1234)
- [ ] View alerts tab
- [ ] Resolve an alert
- [ ] Refresh alerts
- [ ] View activities tab
- [ ] Scroll through activities
- [ ] Load more activities
- [ ] View settings tab
- [ ] Change child name/age
- [ ] Toggle allowed activities
- [ ] Adjust timeout setting
- [ ] Save settings
- [ ] Verify settings persist

#### Voice Features
- [ ] Voice recognition works
- [ ] Transcript appears in real-time
- [ ] Final transcript correct
- [ ] AI speaks response
- [ ] Stop speaking button works
- [ ] Handle microphone permission denial
- [ ] Handle browser without support

#### Camera Features
- [ ] Camera NEVER auto-starts
- [ ] Camera starts on button click
- [ ] Preview shows correctly
- [ ] Capture button works
- [ ] Photo preview shows
- [ ] Retake button works
- [ ] Send button works
- [ ] Camera stops after capture
- [ ] Handle camera permission denial
- [ ] Handle device without camera

---

### Browser Testing

#### Chrome/Edge (Recommended)
- ✅ Full voice support
- ✅ Camera support
- ✅ All features work

#### Safari
- ⚠️ Limited voice selection
- ✅ Camera works
- ⚠️ Some CSS differences

#### Firefox
- ❌ Poor voice support
- ✅ Camera works
- ⚠️ Use fallback text input

---

## Deployment

### Production Build

```bash
# Create optimized build
npm run build

# Output: build/ directory
# Size: ~100KB (gzipped)
```

### Environment Configuration

```bash
# Production .env
REACT_APP_API_URL=https://api.yourdomain.com
```

### Deployment Options

#### Option 1: Static Hosting (Netlify, Vercel)
```bash
# Deploy to Netlify
npm install -g netlify-cli
netlify deploy --prod --dir=build

# Deploy to Vercel
npm install -g vercel
vercel --prod
```

#### Option 2: Docker
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build
RUN npm install -g serve
CMD ["serve", "-s", "build", "-l", "3000"]
```

#### Option 3: AWS S3 + CloudFront
```bash
# Build
npm run build

# Upload to S3
aws s3 sync build/ s3://your-bucket-name

# Invalidate CloudFront
aws cloudfront create-invalidation \
  --distribution-id YOUR_DIST_ID \
  --paths "/*"
```

---

### Production Checklist

- [ ] Set `REACT_APP_API_URL` to production backend
- [ ] Enable HTTPS (required for camera/microphone)
- [ ] Configure CORS on backend
- [ ] Set up proper authentication (replace demo PIN)
- [ ] Add error tracking (Sentry, LogRocket)
- [ ] Add analytics (Google Analytics, Mixpanel)
- [ ] Optimize images and assets
- [ ] Enable gzip compression
- [ ] Set cache headers
- [ ] Test on mobile devices
- [ ] Test on different browsers
- [ ] Load testing
- [ ] Security audit

---

## Troubleshooting

### Issue: Voice Recognition Not Working

**Symptoms**:
- No transcript appears
- Microphone icon stays gray
- Error: "Speech recognition not supported"

**Solutions**:
1. Use Chrome or Edge browser
2. Allow microphone permission
3. Check microphone not muted
4. Try HTTPS (required in some browsers)
5. Check browser console for errors

---

### Issue: Camera Won't Start

**Symptoms**:
- "Take Picture" button does nothing
- Permission denied error
- Camera in use by another app

**Solutions**:
1. Allow camera permission in browser settings
2. Close other apps using camera (Zoom, Skype, etc.)
3. Try different browser
4. Check camera not physically covered
5. Restart browser
6. Check browser console for specific error

---

### Issue: Backend Connection Failed

**Symptoms**:
- "Failed to send message"
- Network errors in console
- No response from AI

**Solutions**:
1. Check backend is running (`http://localhost:8000`)
2. Verify `.env` has correct API URL
3. Check CORS settings on backend
4. Verify network connection
5. Check browser console network tab
6. Try: `curl http://localhost:8000/api/health`

---

### Issue: Build Fails

**Symptoms**:
- TypeScript errors
- "Module not found"
- Build process crashes

**Solutions**:
```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install

# Clear React Scripts cache
rm -rf node_modules/.cache

# Rebuild
npm run build
```

---

### Issue: Page Blank After Deploy

**Symptoms**:
- Deployed site shows blank page
- Console: "Failed to load resource"
- 404 errors for JS/CSS files

**Solutions**:
1. Check `package.json` `homepage` field
2. Verify build output in correct directory
3. Check server routing for SPA
4. Verify HTTPS if using camera/mic
5. Check browser console for errors

---

## Additional Resources

### Documentation
- [React Documentation](https://react.dev)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Tailwind CSS Docs](https://tailwindcss.com/docs)
- [Web Speech API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Speech_API)
- [MediaDevices API](https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices)

### Browser Support
- [Can I Use - Speech Recognition](https://caniuse.com/speech-recognition)
- [Can I Use - getUserMedia](https://caniuse.com/stream)

### Tools
- [React DevTools](https://react.dev/learn/react-developer-tools)
- [Redux DevTools](https://github.com/reduxjs/redux-devtools)
- [Chrome DevTools](https://developer.chrome.com/docs/devtools/)

---

## Contributing

### Code Standards
- Use TypeScript for all new code
- Follow React Hooks best practices
- Write meaningful commit messages
- Add comments for complex logic
- Test on multiple browsers

### Pull Request Process
1. Fork the repository
2. Create feature branch
3. Make changes
4. Test thoroughly
5. Submit PR with description

---

## License

MIT License - See LICENSE file for details

---

## Support

For issues or questions:
- Check browser console for errors
- Review this documentation
- Check backend API status
- Verify permissions (camera/microphone)
- Test on different browser

---

**Version**: 1.0.0
**Last Updated**: 2024
**Status**: Production Ready (requires backend)

**Built with ❤️ for child safety and parent peace of mind**



# AI Babysitter Backend - Complete Documentation

## Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Core Components](#core-components)
4. [API Reference](#api-reference)
5. [Database Schema](#database-schema)
6. [Safety System](#safety-system)
7. [LLM Integration](#llm-integration)
8. [Vision Processing](#vision-processing)
9. [Voice Processing](#voice-processing)
10. [WebSocket Notifications](#websocket-notifications)
11. [Configuration](#configuration)
12. [Deployment](#deployment)
13. [Development Guide](#development-guide)
14. [Testing](#testing)
15. [Troubleshooting](#troubleshooting)

---

## Overview

### Purpose

The AI Babysitter Backend is a FastAPI-based server that provides conversational AI assistance for children using **NVIDIA Nemotron llama-3.3-nemotron-super-49b-v1.5**. It handles:

- Age-appropriate conversations
- On-demand image analysis (homework help, games)
- Voice interactions (speech-to-text and text-to-speech)
- Real-time safety monitoring with parent alerts
- Session and activity tracking

### Key Principles

1. **Safety First**: Multi-layer safety checks on all interactions
2. **No Surveillance**: Images only processed when explicitly uploaded
3. **Age-Appropriate**: Content tailored to child's age
4. **Transparent**: Parents receive real-time alerts and full activity logs
5. **Privacy**: All data stays in your control (self-hostable)

### Technology Stack

- **Framework**: FastAPI (Python 3.10+)
- **LLM**: NVIDIA Nemotron llama-3.3-nemotron-super-49b-v1.5
- **Vision**: GPT-4 Vision / Claude 3 Opus (on-demand)
- **Speech**: OpenAI Whisper (STT), ElevenLabs/OpenAI (TTS)
- **Database**: SQLite (dev), PostgreSQL (production)
- **Real-time**: WebSockets for parent notifications

---

## Architecture

### System Design

```
┌─────────────────────────────────────────────────────────────┐
│                         Frontend                             │
│            (Web/Mobile App - Not Included)                   │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       │ HTTP/WebSocket
                       │
┌──────────────────────▼──────────────────────────────────────┐
│                    FastAPI Server                            │
│                                                              │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐           │
│  │   Chat     │  │   Images   │  │  Sessions  │           │
│  │ Endpoints  │  │ Endpoints  │  │ Endpoints  │           │
│  └──────┬─────┘  └──────┬─────┘  └──────┬─────┘           │
│         │                │                │                  │
│  ┌──────▼────────────────▼────────────────▼─────┐          │
│  │              Service Layer                     │          │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐   │          │
│  │  │   LLM    │  │  Vision  │  │  Safety  │   │          │
│  │  │ Service  │  │ Service  │  │ Service  │   │          │
│  │  └──────────┘  └──────────┘  └──────────┘   │          │
│  │  ┌──────────┐  ┌──────────────────────┐     │          │
│  │  │  Voice   │  │    Notification      │     │          │
│  │  │ Service  │  │      Service         │     │          │
│  │  └──────────┘  └──────────────────────┘     │          │
│  └───────────────────────────────────────────────┘          │
│                                                              │
│  ┌────────────────────────────────────────────────┐        │
│  │              Database Layer                     │        │
│  │        (SQLAlchemy + SQLite/PostgreSQL)        │        │
│  └────────────────────────────────────────────────┘        │
└──────────────────────────────────────────────────────────────┘
                       │
                       │ External APIs
                       │
┌──────────────────────▼──────────────────────────────────────┐
│                  External Services                           │
│                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │   NVIDIA     │  │    OpenAI    │  │  ElevenLabs  │     │
│  │   Nemotron   │  │ Whisper/GPT4V│  │     TTS      │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
└──────────────────────────────────────────────────────────────┘
```

### Directory Structure

```
ai-babysitter-backend/
├── app/
│   ├── __init__.py
│   ├── main.py                     # FastAPI application entry point
│   ├── config.py                   # Configuration management
│   │
│   ├── api/                        # API endpoints (routers)
│   │   ├── __init__.py
│   │   ├── chat.py                # Chat & story endpoints
│   │   ├── images.py              # Image analysis endpoints
│   │   ├── sessions.py            # Session management endpoints
│   │   └── voice.py               # Voice processing endpoints
│   │
│   ├── services/                   # Business logic layer
│   │   ├── __init__.py
│   │   ├── llm_service.py         # NVIDIA Nemotron integration
│   │   ├── vision_service.py      # Image analysis (GPT4V/Claude)
│   │   ├── voice_service.py       # STT/TTS processing
│   │   ├── safety_service.py      # Safety detection & alerts
│   │   └── notification_service.py # WebSocket notifications
│   │
│   ├── models/                     # Data models (Pydantic + SQLAlchemy)
│   │   ├── __init__.py
│   │   ├── session.py             # Session models
│   │   ├── message.py             # Message/conversation models
│   │   ├── activity.py            # Activity tracking models
│   │   └── alert.py               # Safety alert models
│   │
│   ├── database/                   # Database configuration
│   │   ├── __init__.py
│   │   └── db.py                  # SQLAlchemy setup
│   │
│   └── utils/                      # Utility functions
│       ├── __init__.py
│       └── prompts.py             # LLM prompt templates
│
├── tests/                          # Unit and integration tests
│   ├── __init__.py
│   └── test_api.py                # API endpoint tests
│
├── requirements.txt                # Python dependencies
├── Dockerfile                      # Docker container definition
├── docker-compose.yml             # Multi-container setup
├── .env.example                   # Environment variables template
├── .gitignore                     # Git ignore rules
├── run.py                         # Development server runner
├── README.md                      # User-facing documentation
├── QUICKSTART.md                  # Quick setup guide
└── CLAUDE.md                      # This file (comprehensive docs)
```

---

## Core Components

### 1. FastAPI Application (`app/main.py`)

**Purpose**: Main application entry point, router registration, WebSocket handling

**Key Features**:
- CORS middleware for cross-origin requests
- Static file serving for audio files
- Database initialization on startup
- WebSocket endpoint for parent notifications
- Health check endpoints

**Startup Flow**:
1. Load configuration from environment
2. Initialize database tables
3. Register API routers
4. Start WebSocket service
5. Begin accepting requests

### 2. Configuration (`app/config.py`)

**Purpose**: Centralized configuration management using Pydantic Settings

**Configuration Variables**:

```python
# NVIDIA Nemotron
nvidia_api_key: str              # Required for LLM
nvidia_base_url: str             # API endpoint
nvidia_model: str                # Model name

# OpenAI (Optional)
openai_api_key: str              # For Whisper STT, GPT-4V

# Anthropic (Optional)
anthropic_api_key: str           # For Claude Vision

# ElevenLabs (Optional)
elevenlabs_api_key: str          # For premium TTS

# Database
database_url: str                # SQLite or PostgreSQL

# Security
secret_key: str                  # For session signing
algorithm: str                   # JWT algorithm

# Server
host: str                        # Bind address
port: int                        # Bind port
debug: bool                      # Debug mode

# Safety
max_session_duration_hours: int  # Auto-end sessions
```

**Usage**:
```python
from app.config import settings

api_key = settings.nvidia_api_key
```

### 3. Database Layer (`app/database/db.py`)

**Purpose**: SQLAlchemy database connection and session management

**Database Tables**:
- `sessions` - Child sessions
- `messages` - Conversation history
- `activities` - Activity tracking
- `safety_alerts` - Safety alerts

**Key Functions**:

```python
def get_db():
    """Dependency injection for database sessions"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def init_db():
    """Create all database tables"""
    Base.metadata.create_all(bind=engine)
```

---

## API Reference

### Base URL

```
http://localhost:8000
```

### Authentication

Currently no authentication (development). In production, implement:
- JWT tokens for API access
- Parent ID verification
- Rate limiting

---

### Session Management Endpoints

#### Create Session

**POST** `/api/sessions`

Create a new child session.

**Request Body**:
```json
{
  "child_name": "Emma",
  "child_age": 8,
  "parent_id": "parent123"
}
```

**Response** (200):
```json
{
  "id": 1,
  "session_id": "550e8400-e29b-41d4-a716-446655440000",
  "child_name": "Emma",
  "child_age": 8,
  "parent_id": "parent123",
  "start_time": "2025-10-29T10:30:00Z",
  "end_time": null,
  "is_active": true
}
```

---

#### Get Session

**GET** `/api/sessions/{session_id}`

Retrieve session details.

**Response** (200):
```json
{
  "id": 1,
  "session_id": "550e8400-e29b-41d4-a716-446655440000",
  "child_name": "Emma",
  "child_age": 8,
  "parent_id": "parent123",
  "start_time": "2025-10-29T10:30:00Z",
  "end_time": null,
  "is_active": true
}
```

---

#### Get Session Summary

**GET** `/api/sessions/{session_id}/summary`

Get session statistics and summary.

**Response** (200):
```json
{
  "session": { /* session object */ },
  "total_messages": 42,
  "total_activities": 5,
  "total_alerts": 1,
  "duration_minutes": 45
}
```

---

#### Get Session Activities

**GET** `/api/sessions/{session_id}/activities`

List all activities in a session.

**Response** (200):
```json
[
  {
    "id": 1,
    "session_id": "550e8400-e29b-41d4-a716-446655440000",
    "activity_type": "chat",
    "start_time": "2025-10-29T10:30:00Z",
    "end_time": "2025-10-29T10:45:00Z",
    "details": {"messages": 15},
    "images_used": 0
  }
]
```

---

#### Get Conversation History

**GET** `/api/sessions/{session_id}/messages?limit=50`

Retrieve conversation messages.

**Query Parameters**:
- `limit` (optional, default=50): Maximum messages to return

**Response** (200):
```json
[
  {
    "id": 1,
    "session_id": "550e8400-e29b-41d4-a716-446655440000",
    "timestamp": "2025-10-29T10:30:00Z",
    "role": "child",
    "content": "Can you tell me a story?",
    "audio_url": null,
    "has_image": false,
    "emotion": "happy"
  },
  {
    "id": 2,
    "session_id": "550e8400-e29b-41d4-a716-446655440000",
    "timestamp": "2025-10-29T10:30:05Z",
    "role": "assistant",
    "content": "Of course! Let me tell you about...",
    "audio_url": "/audio/story.mp3",
    "has_image": false,
    "emotion": null
  }
]
```

---

#### Get Session Alerts

**GET** `/api/sessions/{session_id}/alerts`

Retrieve all safety alerts for a session.

**Response** (200):
```json
[
  {
    "id": 1,
    "session_id": "550e8400-e29b-41d4-a716-446655440000",
    "alert_level": "warning",
    "timestamp": "2025-10-29T10:35:00Z",
    "message": "Child expressing sad emotion",
    "context": "Message: 'I miss my friend'",
    "ai_assessment": "Child seems sad. May need attention.",
    "requires_action": false,
    "parent_notified": true,
    "resolved": false
  }
]
```

---

#### End Session

**POST** `/api/sessions/{session_id}/end`

End an active session.

**Response** (200):
```json
{
  "message": "Session ended successfully"
}
```

---

#### Get Parent Sessions

**GET** `/api/sessions/parent/{parent_id}?active_only=false`

Get all sessions for a parent.

**Query Parameters**:
- `active_only` (optional, default=false): Only return active sessions

**Response** (200):
```json
[
  { /* session object */ }
]
```

---

### Chat Endpoints

#### Chat

**POST** `/api/chat`

Main conversation endpoint for child interactions.

**Request Body**:
```json
{
  "session_id": "550e8400-e29b-41d4-a716-446655440000",
  "message": "Can you help me with my math homework?",
  "child_age": 8,
  "voice_output": false
}
```

**Response** (200):
```json
{
  "response": "I'd be happy to help! What math problem are you working on? If you have your worksheet, you can show it to me by taking a picture!",
  "audio_url": null,
  "requires_camera": true,
  "safety_status": "none",
  "emotion": "neutral"
}
```

**Safety Features**:
- Message analyzed for safety concerns
- Emotion detected from child's message
- Parent notified if safety alert triggered
- All messages logged to database

---

#### Generate Story

**POST** `/api/chat/story`

Generate an age-appropriate story.

**Request Body**:
```json
{
  "session_id": "550e8400-e29b-41d4-a716-446655440000",
  "theme": "brave puppy",
  "child_age": 8,
  "length": "medium",
  "voice_output": true
}
```

**Parameters**:
- `length`: "short" (2-3 paragraphs), "medium" (4-6), "long" (7-10)

**Response** (200):
```json
{
  "response": "Once upon a time, there was a small golden puppy named Max...",
  "audio_url": "/audio/abc123.mp3",
  "requires_camera": false,
  "safety_status": "none",
  "emotion": "happy"
}
```

---

### Image Analysis Endpoints

#### Analyze Image

**POST** `/api/images/analyze`

Analyze an uploaded image based on context.

**Form Data**:
- `session_id` (string): Session ID
- `context` (string): Analysis context - "homework", "game", "safety_check", "show_tell"
- `child_age` (int): Child's age
- `prompt` (string, optional): Additional instructions
- `image` (file): Image file (max 10MB)

**Request Example**:
```bash
curl -X POST "http://localhost:8000/api/images/analyze" \
  -F "session_id=550e8400-e29b-41d4-a716-446655440000" \
  -F "context=homework" \
  -F "child_age=8" \
  -F "prompt=Help me solve this problem" \
  -F "image=@homework.jpg"
```

**Response** (200):
```json
{
  "analysis": "This is a multiplication worksheet. I can see the problem 7 × 8 = ?",
  "detected_objects": null,
  "safety_alert": null,
  "ai_response": "Great! I can see you're working on multiplication. Let's think about 7 × 8 together. Do you know what multiplication means?"
}
```

**Context Types**:

1. **homework**: Analyzes worksheets, provides educational guidance
2. **game**: Identifies objects for "I Spy" or similar games
3. **safety_check**: Checks image for safety concerns
4. **show_tell**: Engages with items child wants to show

**Safety Features**:
- All images checked for inappropriate content
- Urgent alert sent if unsafe content detected
- Image analysis count tracked per session

---

#### Homework Help with Image

**POST** `/api/images/homework-help`

Specialized endpoint for homework assistance.

**Form Data**:
- `session_id` (string)
- `child_age` (int)
- `question` (string, optional)
- `image` (file)

**Response** (200):
```json
{
  "analysis": "Math worksheet with addition problems",
  "ai_response": "I can help you understand addition! Let's look at the first problem together..."
}
```

---

### Voice Processing Endpoints

#### Transcribe Audio

**POST** `/api/voice/transcribe`

Convert speech to text using OpenAI Whisper.

**Form Data**:
- `audio` (file): Audio file (MP3, WAV, max 5MB)

**Request Example**:
```bash
curl -X POST "http://localhost:8000/api/voice/transcribe" \
  -F "audio=@child_message.mp3"
```

**Response** (200):
```json
{
  "success": true,
  "transcript": "Can you tell me a story about dinosaurs?",
  "language": "en",
  "error": null
}
```

**Error Response** (200):
```json
{
  "success": false,
  "transcript": "",
  "language": "en",
  "error": "OpenAI API key not configured"
}
```

---

#### Synthesize Speech

**POST** `/api/voice/synthesize`

Convert text to speech.

**Request Body**:
```json
{
  "text": "Once upon a time, there was a brave puppy...",
  "voice_style": "friendly"
}
```

**Voice Styles**:
- `friendly`: Warm, engaging (default)
- `calm`: Soothing, relaxed
- `excited`: Energetic, enthusiastic

**Response** (200):
```json
{
  "success": true,
  "audio_url": "/audio/abc123-xyz.mp3",
  "provider": "elevenlabs",
  "error": null
}
```

**TTS Priority**:
1. ElevenLabs (highest quality, requires API key)
2. OpenAI TTS (good quality, requires API key)
3. gTTS (basic quality, free)

---

### WebSocket Endpoint

#### Parent Notification Stream

**WS** `/ws/parent/{parent_id}`

Real-time notification stream for parents.

**Connection**:
```javascript
const ws = new WebSocket('ws://localhost:8000/ws/parent/parent123');

ws.onopen = () => {
  console.log('Connected to parent notification stream');
};

ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  console.log('Received:', data);
};

// Keep-alive heartbeat
setInterval(() => {
  if (ws.readyState === WebSocket.OPEN) {
    ws.send('ping');
  }
}, 30000);
```

**Message Types**:

1. **Alert Notification**:
```json
{
  "type": "alert",
  "level": "urgent",
  "message": "Child reported fall and knee pain",
  "context": "Safety check triggered",
  "timestamp": "2025-10-29T10:35:00Z",
  "requires_action": true
}
```

2. **Activity Update**:
```json
{
  "type": "activity_update",
  "session_id": "550e8400-e29b-41d4-a716-446655440000",
  "activity": "chat",
  "last_message": "Can you help me with my homework?"
}
```

3. **Session Update**:
```json
{
  "type": "session_update",
  "session_id": "550e8400-e29b-41d4-a716-446655440000",
  "status": "active",
  "duration_minutes": 30
}
```

**Heartbeat**:
- Client sends `"ping"` every 30 seconds
- Server responds with `"pong"`
- Maintains connection alive

---

## Database Schema

### Sessions Table

```sql
CREATE TABLE sessions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id VARCHAR UNIQUE NOT NULL,
    child_name VARCHAR NOT NULL,
    child_age INTEGER NOT NULL,
    parent_id VARCHAR NOT NULL,
    start_time DATETIME NOT NULL,
    end_time DATETIME,
    is_active BOOLEAN DEFAULT TRUE
);

CREATE INDEX idx_session_id ON sessions(session_id);
CREATE INDEX idx_parent_id ON sessions(parent_id);
```

**Fields**:
- `session_id`: UUID for session identification
- `child_name`: Child's first name
- `child_age`: Age in years (affects content appropriateness)
- `parent_id`: Parent identifier for notifications
- `start_time`: Session start timestamp
- `end_time`: Session end timestamp (NULL if active)
- `is_active`: Boolean indicating active status

---

### Messages Table

```sql
CREATE TABLE messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id VARCHAR NOT NULL,
    timestamp DATETIME NOT NULL,
    role VARCHAR NOT NULL,  -- 'child' or 'assistant'
    content TEXT NOT NULL,
    audio_url VARCHAR,
    has_image BOOLEAN DEFAULT FALSE,
    emotion VARCHAR
);

CREATE INDEX idx_message_session ON messages(session_id);
CREATE INDEX idx_message_timestamp ON messages(timestamp);
```

**Fields**:
- `role`: "child" or "assistant"
- `content`: Message text
- `audio_url`: Path to audio file (if voice output)
- `has_image`: Whether message included an image
- `emotion`: Detected emotion from child messages

---

### Activities Table

```sql
CREATE TABLE activities (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id VARCHAR NOT NULL,
    activity_type VARCHAR NOT NULL,
    start_time DATETIME NOT NULL,
    end_time DATETIME,
    details JSON,
    images_used INTEGER DEFAULT 0
);

CREATE INDEX idx_activity_session ON activities(session_id);
```

**Activity Types**:
- `chat`: General conversation
- `story`: Story generation
- `homework`: Homework help
- `game`: Playing games
- `voice_chat`: Voice conversation
- `image_analysis`: Image-based interaction

**Details Field** (JSON):
```json
{
  "messages": 15,
  "theme": "dinosaurs",
  "length": "medium"
}
```

---

### Safety Alerts Table

```sql
CREATE TABLE safety_alerts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id VARCHAR NOT NULL,
    alert_level VARCHAR NOT NULL,  -- 'info', 'warning', 'urgent', 'emergency'
    timestamp DATETIME NOT NULL,
    message VARCHAR NOT NULL,
    context TEXT,
    ai_assessment TEXT,
    requires_action BOOLEAN DEFAULT FALSE,
    parent_notified BOOLEAN DEFAULT FALSE,
    resolved BOOLEAN DEFAULT FALSE
);

CREATE INDEX idx_alert_session ON safety_alerts(session_id);
CREATE INDEX idx_alert_level ON safety_alerts(alert_level);
```

**Alert Levels**:
- `info`: Normal activity log
- `warning`: Minor concern, check later
- `urgent`: Parent should check soon
- `emergency`: Immediate parent notification required

---

## Safety System

### Overview

Multi-layered safety detection system with real-time parent notifications.

### Safety Layers

#### 1. Keyword Detection

Fast keyword matching for immediate concerns:

**Urgent Keywords** (Emergency-level):
- "emergency", "911", "can't breathe", "chest pain"
- "bleeding badly", "unconscious", "fire", "smoke"
- "poison", "overdose"

**Concern Keywords** (Warning-level):
- "hurt", "pain", "bleeding", "fell", "sick"
- "scared", "afraid", "stranger", "alone"
- "help", "broken", "crying", "dizzy"

#### 2. LLM Analysis

NVIDIA Nemotron analyzes each message for:
- Safety concerns (injury, illness, distress)
- Emotional state (fear, sadness, anger)
- Dangerous situations or requests
- Inappropriate topics

**Analysis Prompt**:
```python
"""
Analyze this message from a {age}-year-old child for safety concerns:
"{message}"

Flag if mentions:
- Injury, pain, or physical discomfort
- Illness or not feeling well
- Fear, sadness, or emotional distress
- Being alone or unsupervised
- Strangers or unusual situations
- Unsafe activities

Return JSON:
{
    "is_safe": bool,
    "concern_level": "none/low/medium/high/critical",
    "reason": "explanation",
    "parent_alert": bool,
    "recommended_response": "how to respond"
}
"""
```

#### 3. Emotion Detection

Analyzes emotional tone:
- happy, excited → Normal
- neutral → Normal
- frustrated, angry → Monitor
- sad, scared, concerned → Alert parent

#### 4. Image Safety

All uploaded images checked:
- Content moderation (inappropriate content)
- Injury detection
- Hazard identification

### Alert Flow

```
Child Message
     ↓
Keyword Check → [Urgent?] → EMERGENCY Alert
     ↓
LLM Analysis → [High Concern?] → URGENT Alert
     ↓
Emotion Check → [Distressed?] → WARNING Alert
     ↓
Normal Response
```

### Parent Notification

When alert created:
1. Alert saved to database
2. WebSocket notification sent immediately
3. Alert logged with full context
4. Activity tracking updated

**Example Alert**:
```python
SafetyAlert(
    level=AlertLevel.URGENT,
    timestamp=datetime.now(timezone.utc),
    message="Child reported fall and knee pain",
    context="Child said: 'I fell down and my knee hurts'",
    ai_assessment="Child mentions injury. Recommend checking on child.",
    requires_action=True
)
```

---

## LLM Integration

### NVIDIA Nemotron Service

**File**: `app/services/llm_service.py`

#### Configuration

```python
class NemotronLLM:
    def __init__(self):
        self.api_key = settings.nvidia_api_key
        self.base_url = settings.nvidia_base_url  # NVIDIA NIM API
        self.model = "llama-3.3-nemotron-super-49b-v1.5"
        self.default_temperature = 0.7
        self.max_tokens = 2048
```

#### System Prompts

Age-appropriate system prompts:

**Ages 1-5**:
```python
"""You are a friendly AI babysitter for a {age}-year-old.
- Use very simple words and short sentences
- Incorporate playful sounds and repetition
- Focus on basic concepts and imagination
- Make learning feel like play"""
```

**Ages 6-8**:
```python
"""You are a helpful AI babysitter for a {age}-year-old.
- Use clear explanations with examples
- Encourage curiosity and questions
- Help with basic reading, math, and science
- Support creative play and storytelling"""
```

**Ages 9-12**:
```python
"""You are a supportive AI babysitter for a {age}-year-old.
- Provide more detailed explanations
- Support critical thinking
- Help with more complex homework
- Discuss age-appropriate social topics"""
```

**Ages 13+**:
```python
"""You are a mentoring AI assistant for a {age}-year-old.
- Engage in more mature discussions (appropriately)
- Support complex problem-solving
- Encourage independent thinking
- Be a positive mentor figure"""
```

#### Core Methods

**generate()**: Main conversation generation
```python
async def generate(
    message: str,
    context: str = "",
    child_age: int = 8,
    temperature: float = None,
    system_prompt: str = None
) -> str:
    """Generate response using NVIDIA Nemotron"""
```

**analyze_safety()**: Safety analysis
```python
async def analyze_safety(
    message: str,
    child_age: int
) -> Dict[str, Any]:
    """Analyze message for safety concerns"""
    # Returns: is_safe, concern_level, reason, parent_alert
```

**generate_story()**: Story creation
```python
async def generate_story(
    theme: str,
    child_age: int,
    length: str = "medium"
) -> str:
    """Generate age-appropriate story"""
```

**help_with_homework()**: Educational assistance
```python
async def help_with_homework(
    problem_description: str,
    child_age: int,
    image_context: str = None
) -> str:
    """Provide homework guidance (not answers)"""
```

**detect_emotion()**: Emotion detection
```python
async def detect_emotion(message: str) -> str:
    """Detect emotional tone"""
    # Returns: happy, sad, angry, scared, frustrated, excited, neutral
```

#### Usage Example

```python
from app.services.llm_service import llm_service

# Generate response
response = await llm_service.generate(
    message="Can you tell me about dinosaurs?",
    child_age=8
)

# Analyze safety
safety = await llm_service.analyze_safety(
    message="I fell down and hurt my knee",
    child_age=7
)

# Generate story
story = await llm_service.generate_story(
    theme="brave puppy",
    child_age=6,
    length="medium"
)
```

---

## Vision Processing

### Vision Service

**File**: `app/services/vision_service.py`

#### Supported Providers

**Provider Priority Order** (tries in sequence until success):

1. **NVIDIA Cosmos Reason1 7B** (Primary - Recommended)
   - Advanced vision-language model optimized for reasoning
   - Built on NVIDIA's Cosmos platform
   - Excellent for homework analysis, object detection, and safety checks
   - Uses same `NVIDIA_API_KEY` as Nemotron LLM
   - Fast inference with high accuracy
   - Can be enabled/disabled via `NVIDIA_COSMOS_ENABLED` config

2. **OpenAI GPT-4 Vision** (Secondary)
   - High quality image understanding
   - Good for homework, object detection
   - Requires `OPENAI_API_KEY`

3. **Anthropic Claude 3 Opus** (Fallback)
   - Excellent vision capabilities
   - Alternative to GPT-4V and NVIDIA Cosmos
   - Requires `ANTHROPIC_API_KEY`

#### Analysis Contexts

**1. Homework**
```python
# Analyzes educational content
await vision_service.analyze_homework(image_bytes, child_age=8)

# Returns:
{
    "subject": "math",  # math, reading, science, writing
    "analysis": "This is a multiplication worksheet...",
    "can_help": True
}
```

**2. Game (I Spy)**
```python
# Identifies objects for games
await vision_service.identify_objects(image_bytes)

# Returns:
{
    "objects": ["red ball", "blue toy car", "teddy bear"],
    "description": "I can see several fun toys..."
}
```

**3. Safety Check**
```python
# Checks for hazards or concerns
await vision_service.safety_check_image(image_bytes)

# Returns:
{
    "is_safe": True,
    "analysis": "The image shows a clean, safe play area",
    "concerns": []
}
```

**4. Show and Tell**
```python
# Engages with items child shows
await vision_service.analyze_image(
    image_bytes,
    context="show_tell",
    child_age=7,
    additional_prompt="This is my toy robot"
)

# Returns enthusiastic, engaging response
```

#### Implementation Examples

**NVIDIA Cosmos Vision**:
```python
async def _analyze_with_nvidia_cosmos(
    self,
    image_bytes: bytes,
    prompt: str
) -> str:
    """Analyze using NVIDIA Cosmos Reason1 7B Vision Model"""
    import openai

    # NVIDIA uses OpenAI-compatible API
    client = openai.OpenAI(
        base_url=self.nvidia_cosmos_base_url,
        api_key=self.nvidia_api_key
    )

    # Encode image
    image_base64 = base64.b64encode(image_bytes).decode('utf-8')

    response = client.chat.completions.create(
        model=self.nvidia_cosmos_model,  # nvidia/cosmos-reason1-7b
        messages=[{
            "role": "user",
            "content": [
                {"type": "text", "text": prompt},
                {
                    "type": "image_url",
                    "image_url": {
                        "url": f"data:image/jpeg;base64,{image_base64}"
                    }
                }
            ]
        }],
        max_tokens=512,
        temperature=0.7,
        top_p=0.9,
        stream=False
    )

    return response.choices[0].message.content
```

**OpenAI GPT-4 Vision**:
```python
async def _analyze_with_openai(
    self,
    image_bytes: bytes,
    prompt: str
) -> str:
    """Analyze using GPT-4 Vision"""
    client = openai.OpenAI(api_key=self.openai_key)

    # Encode image
    image_base64 = base64.b64encode(image_bytes).decode('utf-8')

    response = client.chat.completions.create(
        model="gpt-4-vision-preview",
        messages=[{
            "role": "user",
            "content": [
                {"type": "text", "text": prompt},
                {
                    "type": "image_url",
                    "image_url": {
                        "url": f"data:image/jpeg;base64,{image_base64}"
                    }
                }
            ]
        }],
        max_tokens=500
    )

    return response.choices[0].message.content
```

---

## Voice Processing

### Voice Service

**File**: `app/services/voice_service.py`

#### Speech-to-Text (STT)

Uses **OpenAI Whisper** for transcription:

```python
async def transcribe_audio(
    audio_data: bytes,
    filename: str = "audio.mp3"
) -> Dict[str, Any]:
    """
    Transcribe audio to text

    Returns:
    {
        "success": True,
        "transcript": "Can you help me with math?",
        "language": "en"
    }
    """
```

**Supported Formats**:
- MP3, WAV, M4A, OGG
- Max size: 5MB
- Any language (auto-detected)

**Usage**:
```python
from app.services.voice_service import voice_service

audio_bytes = await uploaded_file.read()
result = await voice_service.transcribe_audio(audio_bytes)

if result["success"]:
    transcript = result["transcript"]
    # Send transcript to chat endpoint
```

#### Text-to-Speech (TTS)

Multiple providers with automatic fallback:

**1. ElevenLabs** (Highest Quality)
```python
# Natural, expressive voices
# Requires ELEVENLABS_API_KEY
voice_styles = {
    "friendly": "Bella",
    "calm": "Rachel",
    "excited": "Elli"
}
```

**2. OpenAI TTS** (Good Quality)
```python
# Clear, natural voices
# Requires OPENAI_API_KEY
voice_styles = {
    "friendly": "nova",
    "calm": "shimmer",
    "excited": "alloy"
}
```

**3. gTTS** (Basic, Free)
```python
# Basic quality, no API key needed
# Fallback option
```

**Usage**:
```python
result = await voice_service.text_to_speech(
    text="Once upon a time...",
    voice_style="friendly",
    save_path="./audio_temp/story.mp3"
)

if result["success"]:
    audio_url = result["audio_path"]
    # Return URL to frontend
```

---

## WebSocket Notifications

### Notification Service

**File**: `app/services/notification_service.py`

#### Connection Management

```python
class NotificationService:
    def __init__(self):
        # parent_id -> Set[WebSocket]
        self.active_connections: Dict[str, Set[WebSocket]] = {}

    async def connect(self, parent_id: str, websocket: WebSocket):
        """Register new WebSocket connection"""
        await websocket.accept()
        if parent_id not in self.active_connections:
            self.active_connections[parent_id] = set()
        self.active_connections[parent_id].add(websocket)

    def disconnect(self, parent_id: str, websocket: WebSocket):
        """Remove WebSocket connection"""
        if parent_id in self.active_connections:
            self.active_connections[parent_id].discard(websocket)
```

#### Sending Notifications

**Safety Alerts**:
```python
async def notify_parent(
    parent_id: str,
    alert: SafetyAlert
):
    """Send immediate safety alert"""
    message = {
        "type": "alert",
        "level": alert.level.value,
        "message": alert.message,
        "context": alert.context,
        "timestamp": alert.timestamp.isoformat(),
        "requires_action": alert.requires_action
    }
    # Send to all connections for this parent
```

**Activity Updates**:
```python
async def send_activity_update(
    parent_id: str,
    activity_data: Dict
):
    """Notify about activity changes"""
    message = {
        "type": "activity_update",
        **activity_data
    }
```

#### Frontend Integration

**JavaScript Example**:
```javascript
class ParentMonitor {
    constructor(parentId) {
        this.parentId = parentId;
        this.ws = null;
        this.reconnectInterval = 5000;
    }

    connect() {
        this.ws = new WebSocket(
            `ws://localhost:8000/ws/parent/${this.parentId}`
        );

        this.ws.onopen = () => {
            console.log('Connected to monitoring');
            this.startHeartbeat();
        };

        this.ws.onmessage = (event) => {
            const data = JSON.parse(event.data);
            this.handleMessage(data);
        };

        this.ws.onclose = () => {
            console.log('Connection closed, reconnecting...');
            setTimeout(() => this.connect(), this.reconnectInterval);
        };
    }

    handleMessage(data) {
        switch(data.type) {
            case 'alert':
                this.showAlert(data);
                break;
            case 'activity_update':
                this.updateActivity(data);
                break;
            case 'session_update':
                this.updateSession(data);
                break;
        }
    }

    showAlert(alert) {
        // Show notification based on alert.level
        if (alert.level === 'emergency' || alert.level === 'urgent') {
            // Show high-priority notification
            new Notification('Child Safety Alert', {
                body: alert.message,
                requireInteraction: true
            });
        }
    }

    startHeartbeat() {
        setInterval(() => {
            if (this.ws.readyState === WebSocket.OPEN) {
                this.ws.send('ping');
            }
        }, 30000);
    }
}

// Usage
const monitor = new ParentMonitor('parent123');
monitor.connect();
```

---

## Configuration

### Environment Variables

Create `.env` file from `.env.example`:

```bash
cp .env.example .env
```

#### Required Variables

```env
# NVIDIA Nemotron (Required)
NVIDIA_API_KEY=nvapi-xxxxxxxxxxxxxxxxxxxx
NVIDIA_BASE_URL=https://integrate.api.nvidia.com/v1
NVIDIA_MODEL=llama-3.3-nemotron-super-49b-v1.5

# Security (Required for production)
SECRET_KEY=your-secret-key-min-32-characters
```

#### Optional Variables

```env
# NVIDIA Cosmos Vision (recommended - uses same NVIDIA_API_KEY)
NVIDIA_COSMOS_ENABLED=True
NVIDIA_COSMOS_MODEL=nvidia/cosmos-reason1-7b
NVIDIA_COSMOS_BASE_URL=https://integrate.api.nvidia.com/v1

# OpenAI (for Whisper STT and GPT-4 Vision)
OPENAI_API_KEY=sk-xxxxxxxxxxxxxxxxxxxx

# Anthropic (for Claude Vision)
ANTHROPIC_API_KEY=sk-ant-xxxxxxxxxxxxxxxxxxxx

# ElevenLabs (for premium TTS)
ELEVENLABS_API_KEY=xxxxxxxxxxxxxxxxxxxx

# Database
DATABASE_URL=sqlite:///./babysitter.db
# For production: postgresql://user:pass@host:5432/dbname

# Redis (for Celery task queue)
REDIS_URL=redis://localhost:6379/0

# Server
HOST=0.0.0.0
PORT=8000
DEBUG=True

# Safety
MAX_SESSION_DURATION_HOURS=8
ALERT_WEBHOOK_URL=https://your-webhook.com/alerts
```

### Getting API Keys

#### NVIDIA NGC Catalog

**For both Nemotron LLM and Cosmos Vision**:

1. Visit [NVIDIA Build](https://build.nvidia.com/)
2. Sign in/create NVIDIA account
3. Navigate to AI Foundation Models
4. Find **Nemotron** for LLM or **Cosmos Reason1 7B** for vision
5. Click "Get API Key" or "Try Now"
6. Generate/copy API key
7. Use the same key for both `NVIDIA_API_KEY`

**Note**: The same NVIDIA API key works for both:
- Nemotron LLM (text generation)
- Cosmos Reason1 7B (vision analysis)

#### OpenAI

1. Visit [OpenAI Platform](https://platform.openai.com/)
2. Sign in/create account
3. Go to API Keys section
4. Create new secret key
5. Copy to `OPENAI_API_KEY`

#### Anthropic

1. Visit [Anthropic Console](https://console.anthropic.com/)
2. Sign in/create account
3. Go to API Keys
4. Create new key
5. Copy to `ANTHROPIC_API_KEY`

#### ElevenLabs

1. Visit [ElevenLabs](https://elevenlabs.io/)
2. Sign in/create account
3. Go to Profile → API Keys
4. Copy your API key
5. Add to `ELEVENLABS_API_KEY`

---

## Deployment

### Local Development

```bash
# Install dependencies
pip install -r requirements.txt

# Configure environment
cp .env.example .env
# Edit .env with your API keys

# Run server
python run.py

# Or with auto-reload
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### Docker Deployment

#### Build and Run

```bash
# Build image
docker build -t ai-babysitter-backend .

# Run container
docker run -d \
  --name babysitter-api \
  -p 8000:8000 \
  --env-file .env \
  -v $(pwd)/audio_temp:/app/audio_temp \
  -v $(pwd)/babysitter.db:/app/babysitter.db \
  ai-babysitter-backend
```

#### Docker Compose

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f backend

# Stop services
docker-compose down

# Rebuild after changes
docker-compose up -d --build
```

### Production Deployment

#### 1. Use PostgreSQL

Update `DATABASE_URL`:
```env
DATABASE_URL=postgresql://user:password@localhost:5432/babysitter
```

#### 2. Generate Secure Secret Key

```bash
python -c "import secrets; print(secrets.token_hex(32))"
```

Add to `.env`:
```env
SECRET_KEY=your-generated-key-here
```

#### 3. Disable Debug Mode

```env
DEBUG=False
```

#### 4. Configure CORS

Edit `app/main.py`:
```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://yourdomain.com"],  # Specific origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

#### 5. Use Reverse Proxy (nginx)

**nginx.conf**:
```nginx
server {
    listen 80;
    server_name api.yourdomain.com;

    location / {
        proxy_pass http://localhost:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /ws/ {
        proxy_pass http://localhost:8000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
    }
}
```

#### 6. SSL/TLS (Let's Encrypt)

```bash
sudo certbot --nginx -d api.yourdomain.com
```

#### 7. Process Manager (systemd)

**/etc/systemd/system/babysitter-api.service**:
```ini
[Unit]
Description=AI Babysitter Backend
After=network.target

[Service]
User=www-data
WorkingDirectory=/var/www/ai-babysitter-backend
Environment="PATH=/var/www/ai-babysitter-backend/venv/bin"
EnvironmentFile=/var/www/ai-babysitter-backend/.env
ExecStart=/var/www/ai-babysitter-backend/venv/bin/uvicorn app.main:app --host 0.0.0.0 --port 8000 --workers 4
Restart=always

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl enable babysitter-api
sudo systemctl start babysitter-api
sudo systemctl status babysitter-api
```

---

## Development Guide

### Adding New Endpoints

1. **Create router file** in `app/api/`:
```python
# app/api/games.py
from fastapi import APIRouter

router = APIRouter(prefix="/api/games", tags=["games"])

@router.get("/list")
async def list_games():
    return {"games": ["I Spy", "Story Builder"]}
```

2. **Register router** in `app/main.py`:
```python
from app.api import games

app.include_router(games.router)
```

### Adding New Services

1. **Create service file** in `app/services/`:
```python
# app/services/game_service.py
class GameService:
    async def start_game(self, game_type: str):
        # Game logic
        pass

game_service = GameService()
```

2. **Use in endpoints**:
```python
from app.services.game_service import game_service

@router.post("/start")
async def start_game(game_type: str):
    result = await game_service.start_game(game_type)
    return result
```

### Customizing Prompts

Edit `app/utils/prompts.py`:

```python
def get_custom_prompt(context: str) -> str:
    """Add your custom prompt logic"""
    prompts = {
        "new_context": "Your custom prompt here..."
    }
    return prompts.get(context, "Default prompt")
```

### Database Migrations

For schema changes:

1. **Add new column**:
```python
# In model file
from sqlalchemy import Column, String

class SessionDB(Base):
    # ... existing columns ...
    new_field = Column(String, nullable=True)
```

2. **Update database**:
```python
from app.database.db import engine, Base
Base.metadata.create_all(bind=engine)
```

For production, use **Alembic** for proper migrations.

---

## Testing

### Running Tests

```bash
# All tests
pytest tests/ -v

# Specific test file
pytest tests/test_api.py -v

# With coverage
pytest tests/ --cov=app --cov-report=html
```

### Writing Tests

**Example test**:
```python
# tests/test_chat.py
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_chat_endpoint():
    # Create session first
    session_response = client.post("/api/sessions", json={
        "child_name": "Test",
        "child_age": 8,
        "parent_id": "test_parent"
    })
    session_id = session_response.json()["session_id"]

    # Test chat
    response = client.post("/api/chat", json={
        "session_id": session_id,
        "message": "Hello!",
        "child_age": 8
    })

    assert response.status_code == 200
    assert "response" in response.json()
```

### Testing Safety System

```python
def test_safety_detection():
    response = client.post("/api/chat", json={
        "session_id": session_id,
        "message": "I fell down and hurt my knee",
        "child_age": 7
    })

    data = response.json()
    assert data["safety_status"] in ["warning", "urgent", "emergency"]
```

---

## Troubleshooting

### Common Issues

#### 1. "NVIDIA API key not configured"

**Problem**: Missing or invalid NVIDIA API key

**Solution**:
```bash
# Check .env file
cat .env | grep NVIDIA_API_KEY

# Verify key is valid
curl https://integrate.api.nvidia.com/v1/models \
  -H "Authorization: Bearer YOUR_API_KEY"
```

#### 2. "Image analysis unavailable"

**Problem**: No vision API configured

**Solution**:
- Add `OPENAI_API_KEY` or `ANTHROPIC_API_KEY` to `.env`
- Restart server

#### 3. "Database locked" (SQLite)

**Problem**: Concurrent access to SQLite

**Solution**:
- Use PostgreSQL for production
- Or add to `DATABASE_URL`:
```env
DATABASE_URL=sqlite:///./babysitter.db?check_same_thread=false
```

#### 4. WebSocket connection fails

**Problem**: CORS or proxy configuration

**Solution**:
```python
# In app/main.py, ensure CORS allows WebSocket
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

For nginx:
```nginx
location /ws/ {
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
}
```

#### 5. "Audio transcription failed"

**Problem**: Whisper API issues

**Solution**:
- Verify `OPENAI_API_KEY`
- Check audio file size (< 5MB)
- Ensure audio format is supported

#### 6. High memory usage

**Problem**: Large model or many concurrent requests

**Solution**:
- Limit concurrent requests
- Use worker processes:
```bash
uvicorn app.main:app --workers 4
```
- Monitor with:
```bash
docker stats
```

### Debug Mode

Enable detailed logging:

```env
DEBUG=True
LOG_LEVEL=DEBUG
```

Check logs:
```bash
# Docker
docker-compose logs -f backend

# Systemd
sudo journalctl -u babysitter-api -f
```

### Health Check

```bash
curl http://localhost:8000/health
```

Expected response:
```json
{
  "status": "healthy",
  "nvidia_api_configured": true,
  "openai_api_configured": true,
  "anthropic_api_configured": false,
  "elevenlabs_api_configured": false
}
```

---

## Best Practices

### 1. Safety

- **Always** analyze messages before responding
- **Never** skip safety checks for performance
- **Log** all alerts and concerning interactions
- **Test** safety detection regularly

### 2. Privacy

- **Don't** log sensitive information
- **Encrypt** data at rest and in transit
- **Anonymize** data for analytics
- **Comply** with COPPA and GDPR

### 3. Performance

- **Cache** frequently used prompts
- **Batch** similar requests
- **Monitor** API rate limits
- **Use** CDN for audio files

### 4. Monitoring

- **Track** API response times
- **Monitor** error rates
- **Alert** on safety system failures
- **Log** all parent notifications

---

## API Rate Limits

### NVIDIA Nemotron

- Check your NGC quota
- Implement exponential backoff
- Cache responses when appropriate

### OpenAI

- Whisper: 50 requests/min
- GPT-4 Vision: Varies by tier
- TTS: 50 requests/min

### Best Practices

```python
import time
from functools import wraps

def retry_with_backoff(max_retries=3):
    def decorator(func):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            for attempt in range(max_retries):
                try:
                    return await func(*args, **kwargs)
                except Exception as e:
                    if attempt == max_retries - 1:
                        raise
                    wait_time = 2 ** attempt
                    await asyncio.sleep(wait_time)
        return wrapper
    return decorator
```

---

## Security Considerations

### 1. API Key Security

- **Never** commit `.env` to git
- **Rotate** keys regularly
- **Use** environment-specific keys
- **Monitor** API usage for anomalies

### 2. Input Validation

```python
from pydantic import validator

class ChatRequest(BaseModel):
    message: str

    @validator('message')
    def validate_message(cls, v):
        if len(v) > 1000:
            raise ValueError('Message too long')
        return v
```

### 3. Rate Limiting

```python
from slowapi import Limiter
from slowapi.util import get_remote_address

limiter = Limiter(key_func=get_remote_address)

@app.post("/api/chat")
@limiter.limit("10/minute")
async def chat(request: ChatRequest):
    # ...
```

### 4. Authentication (Production)

```python
from fastapi import Depends, HTTPException
from fastapi.security import HTTPBearer

security = HTTPBearer()

async def verify_token(credentials = Depends(security)):
    token = credentials.credentials
    # Verify JWT token
    if not valid_token(token):
        raise HTTPException(status_code=401)
    return token

@app.post("/api/chat")
async def chat(
    request: ChatRequest,
    token = Depends(verify_token)
):
    # ...
```

---

## License

MIT License - See LICENSE file

---

## Support & Contributing

### Getting Help

1. Check [README.md](README.md) and [QUICKSTART.md](QUICKSTART.md)
2. Review this documentation
3. Check existing issues
4. Open new issue with:
   - Environment details
   - Error messages
   - Steps to reproduce

### Contributing

1. Fork repository
2. Create feature branch
3. Make changes
4. Add tests
5. Submit pull request

---

## Changelog

### Version 1.0.0 (2025-10-29)

**Initial Release**

Features:
- NVIDIA Nemotron LLM integration
- Multi-layer safety system
- On-demand image analysis
- Voice processing (STT/TTS)
- WebSocket notifications
- Session management
- Activity tracking
- SQLite/PostgreSQL support
- Docker deployment

---

## Appendix

### Glossary

- **Session**: A period of interaction between child and AI
- **Activity**: A specific task within a session (chat, story, homework)
- **Alert**: Safety notification sent to parent
- **Context**: Type of interaction (homework, game, etc.)
- **Emotion**: Detected emotional state from message
- **STT**: Speech-to-Text
- **TTS**: Text-to-Speech

### Useful Commands

```bash
# Development
python run.py
uvicorn app.main:app --reload

# Testing
pytest tests/ -v
pytest --cov=app

# Docker
docker-compose up -d
docker-compose logs -f
docker-compose down

# Database
sqlite3 babysitter.db ".schema"
sqlite3 babysitter.db "SELECT * FROM sessions;"

# Logs
tail -f logs/app.log
journalctl -u babysitter-api -f
```

### Resources

- [NVIDIA NGC Catalog](https://catalog.ngc.nvidia.com/)
- [FastAPI Documentation](https://fastapi.tiangolo.com/)
- [OpenAI API Reference](https://platform.openai.com/docs/api-reference)
- [Anthropic Documentation](https://docs.anthropic.com/)
- [SQLAlchemy Documentation](https://docs.sqlalchemy.org/)

---

**Last Updated**: 2025-10-29
**Version**: 1.0.0
**Author**: AI Babysitter Development Team

