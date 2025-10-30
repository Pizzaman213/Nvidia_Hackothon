# AI Babysitter Frontend

A React-based frontend application for the AI Babysitter Assistant system. This application allows children to interact with an AI assistant through voice and text, with optional camera use for activities like homework help or playing "I Spy." Parents can monitor and receive safety alerts.

## Features

### Child Interface
- **Voice Chat**: Speech-to-text and text-to-speech interaction
- **Activity Types**: Story Time, I Spy Game, Homework Helper, Free Chat
- **On-Demand Camera**: Camera ONLY activates when user explicitly clicks "Take Picture"
- **Panic Button**: Emergency SOS button to alert parents
- **Child-Friendly UI**: Colorful, intuitive interface designed for children

### Parent Dashboard
- **Real-Time Alerts**: Safety concerns flagged by AI
- **Activity Log**: Timeline of child's interactions
- **Settings & Controls**: Configure allowed activities, quiet hours, safety settings
- **Monitoring**: View child's conversation history and activities

## Technology Stack

- **Framework**: React 18+ with TypeScript
- **Styling**: Tailwind CSS
- **Voice**: Web Speech API (SpeechRecognition and SpeechSynthesis)
- **Camera**: MediaDevices API (user-triggered only)
- **State Management**: React Context
- **Routing**: React Router
- **API Communication**: Axios

## Prerequisites

- Node.js 14+ and npm
- Modern web browser with Web Speech API support (Chrome, Edge recommended)
- Microphone access for voice features
- Camera access for photo-based activities (optional)

## Installation

1. **Install dependencies**:
```bash
npm install
```

2. **Configure environment variables**:
```bash
# Copy the example environment file
cp .env.example .env

# Edit .env and set your backend URL (default: http://localhost:8000)
```

3. **Start the development server**:
```bash
npm start
```

The app will open at [http://localhost:3000](http://localhost:3000)

## Backend Setup

This frontend requires a backend API running at `http://localhost:8000` (or the URL specified in your `.env` file).

Expected API endpoints:
- `POST /api/session/start` - Start a new session
- `POST /api/chat` - Send chat messages
- `POST /api/analyze-image` - Analyze photos
- `GET /api/alerts/:sessionId` - Get safety alerts
- `GET /api/activities/:sessionId` - Get activity log
- `POST /api/emergency` - Trigger panic button

## Usage

### For Children

1. Open the app and click "I'm a Kid!"
2. Enter your name and age
3. Choose an activity (Story Time, I Spy, Homework Help, or Free Chat)
4. Press the microphone button and start talking
5. If the AI asks to see something, click "Take Picture" to use the camera
6. Press the SOS button in the top-right if you need your parent

### For Parents

1. Open the app and click "I'm a Parent"
2. Enter PIN (demo: 1234 or leave empty)
3. View alerts, activity log, and configure settings
4. Monitor your child's interactions in real-time

## Camera Safety

**CRITICAL**: The camera NEVER activates automatically. It only turns on when:
1. User explicitly clicks "Take Picture" button
2. Camera permission is granted
3. User captures a photo
4. Camera immediately stops after photo is taken

## Browser Compatibility

### Voice Features
- ✅ Chrome/Edge (Recommended)
- ✅ Safari (Limited voice selection)
- ❌ Firefox (Limited support)

### Camera Features
- ✅ All modern browsers with MediaDevices API

## Project Structure

```
src/
├── components/
│   ├── child/              # Child interface components
│   │   ├── VoiceChat.tsx
│   │   ├── CameraCapture.tsx
│   │   ├── ActivitySelector.tsx
│   │   ├── MessageDisplay.tsx
│   │   └── PanicButton.tsx
│   ├── parent/             # Parent dashboard components
│   │   ├── Dashboard.tsx
│   │   ├── AlertPanel.tsx
│   │   ├── ActivityLog.tsx
│   │   └── Settings.tsx
│   └── shared/             # Shared components
│       ├── LoadingSpinner.tsx
│       └── AudioPlayer.tsx
├── contexts/               # React Context providers
│   ├── SessionContext.tsx
│   └── VoiceContext.tsx
├── hooks/                  # Custom React hooks
│   ├── useVoiceRecognition.ts
│   ├── useVoiceSynthesis.ts
│   ├── useCamera.ts
│   └── useBackendAPI.ts
├── pages/                  # Main page components
│   ├── Login.tsx
│   ├── ChildInterface.tsx
│   └── ParentDashboard.tsx
├── services/               # API services
│   └── api.ts
├── types/                  # TypeScript types
│   └── index.ts
└── App.tsx                 # Main app component
```

## Development

### Available Scripts

- `npm start` - Start development server
- `npm run build` - Build for production
- `npm test` - Run tests
- `npm run eject` - Eject from Create React App (irreversible)

### Adding New Features

1. **New Activity Type**:
   - Add to `ActivityType` enum in `types/index.ts`
   - Add card to `ActivitySelector.tsx`
   - Handle in `ChildInterface.tsx`

2. **New API Endpoint**:
   - Add function to `services/api.ts`
   - Create types in `types/index.ts`
   - Use in components with `useBackendAPI` hook

3. **New Parent Feature**:
   - Add component to `components/parent/`
   - Add tab to `Dashboard.tsx`

## Testing Checklist

- [ ] Voice recognition works on laptop microphone
- [ ] Voice synthesis speaks AI responses clearly
- [ ] Camera only activates when "Take Picture" clicked
- [ ] Camera immediately stops after photo taken
- [ ] Photo upload to backend works
- [ ] All activity types function correctly
- [ ] Panic button triggers parent alert
- [ ] Parent dashboard shows real-time alerts
- [ ] Activity log displays correctly
- [ ] Settings save and persist
- [ ] Responsive design works on mobile sizes
- [ ] Error handling for missing permissions
- [ ] Session timeout works correctly

## Troubleshooting

### Voice Recognition Not Working
- Ensure you're using Chrome or Edge
- Check microphone permissions in browser settings
- Allow microphone access when prompted
- Check that microphone is not muted

### Camera Not Working
- Check camera permissions in browser settings
- Ensure camera is not in use by another application
- Try refreshing the page
- Check browser console for errors

### Backend Connection Failed
- Ensure backend is running at the configured URL
- Check CORS settings on backend
- Verify `.env` file has correct API URL
- Check browser console for network errors

## Production Build

```bash
# Build optimized production bundle
npm run build

# Serve the build folder
npx serve -s build
```

## Environment Variables

- `REACT_APP_API_URL` - Backend API URL (default: http://localhost:8000)

## Security Considerations

- Parent PIN authentication (demo uses simple PIN)
- Session timeout for inactive users
- Content filtering for AI responses
- Camera only activates on user action
- No persistent storage of sensitive images
- Emergency panic button always visible

## Contributing

This is a demo application for the AI Babysitter Assistant system. For production use:
- Implement proper authentication
- Add data encryption
- Implement proper session management
- Add comprehensive error handling
- Add analytics and monitoring
- Implement push notifications
- Add offline support

## License

MIT

## Support

For issues or questions, please check:
- Browser console for error messages
- Network tab for API failures
- Microphone/camera permissions
- Backend API status
