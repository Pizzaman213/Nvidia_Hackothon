# Parent Dashboard - Complete Feature Guide

## Overview
The Parent Dashboard provides comprehensive monitoring and interaction tools for parents to oversee their children's AI assistant sessions. All five main features are fully implemented and working.

## Quick Start

### 1. Access the Dashboard
- Navigate to `https://localhost:3000`
- You'll be redirected to the login page
- Enter a parent ID (e.g., `demo_parent`)
- Click "Login as Parent"

### 2. Demo Data Setup
Run the demo data script to populate the dashboard with sample data:
```bash
./create_demo_data.sh
```

This creates:
- A sample child session for "Emma" (age 8)
- Chat messages
- Activities (homework help)
- Safety alerts
- Auto-discovered child profile

## Five Main Features

### 1. Children 👥
**Purpose**: Manage child profiles and view their status

**Features**:
- View all registered children
- Add new child profiles manually
- Auto-discover children from existing sessions
- See active/inactive status
- View session/activity/alert counts
- Set profile pictures and emergency contacts
- Configure theme preferences (Rainbow/Blue/Pink)
- Teen mode for ages 10+

**How to Use**:
1. Click the "Children" tab
2. View all your children's profiles
3. Click "+ Add Child" to create a new profile
4. Click "Select" on a child to monitor their session
5. Click "⚙️ Settings" to configure child-specific settings

**API Endpoints**:
- `GET /api/children/parent/{parent_id}` - List all children
- `POST /api/children?parent_id={parent_id}` - Create child profile
- `POST /api/children/auto-discover?parent_id={parent_id}` - Auto-discover from sessions
- `GET /api/children/{child_id}/summary` - Get child statistics

### 2. Alerts 🚨
**Purpose**: Monitor safety concerns and notifications

**Features**:
- Real-time safety alerts
- Alert levels: emergency, warning, info
- Resolve/acknowledge alerts
- Emergency notifications with sound
- Browser notifications for critical alerts
- View alert history

**Alert Types**:
- **Emergency** (red): Critical safety concerns requiring immediate action
- **Warning** (yellow): Potential issues needing attention
- **Info** (blue): General notifications and updates

**How to Use**:
1. Select a child from the Children tab
2. Click the "Alerts" tab
3. View all alerts for the active session
4. Click "Resolve" to acknowledge and dismiss alerts
5. Enable browser notifications for real-time alerts

**API Endpoints**:
- `GET /api/alerts/{session_id}` - Get all alerts
- `GET /api/alerts/{session_id}/unresolved` - Get pending alerts
- `POST /api/alerts` - Create new alert
- `PUT /api/alerts/{alert_id}/resolve` - Mark alert as resolved

### 3. Activities 📋
**Purpose**: Track what your child is doing during sessions

**Activity Types**:
- **Free Chat**: General conversation with the AI
- **Homework**: Academic help and tutoring
- **Story Time**: Story generation and listening
- **Game**: I-Spy and other interactive games
- **Creative**: Drawing and creative activities

**Features**:
- Real-time activity tracking
- Activity duration tracking
- Expandable details with chat transcripts
- Activity history with pagination
- Image usage tracking
- Auto-refresh every 15 seconds

**How to Use**:
1. Select a child from the Children tab
2. Click the "Activities" tab
3. View all activities for the active session
4. Click on an activity to expand and see chat messages
5. Scroll down and click "Load More" for older activities

**API Endpoints**:
- `GET /api/sessions/{session_id}/activities` - Get all activities
- `GET /api/activities/{session_id}` - Alternative endpoint
- `POST /api/activities` - Create new activity
- `PUT /api/activities/{activity_id}/end` - End an activity

### 4. AI Assistant 💡
**Purpose**: Get AI-powered parenting advice and insights

**Features**:
- Conversational AI assistant for parents
- Context-aware advice based on child's session
- Key insights and suggested actions
- Conversation history
- Child information display

**Example Questions**:
- "How is my child doing today?"
- "What activities would you recommend for Emma?"
- "Are there any concerns I should know about?"
- "What learning topics is my child interested in?"
- "How can I better support my child's education?"

**How to Use**:
1. Select a child from the Children tab
2. Click the "AI Assistant" tab
3. Type your question in the input field
4. Press "Send" or hit Enter
5. View the AI's response with insights and suggestions
6. Continue the conversation for more detailed advice

**API Endpoints**:
- `POST /api/parent-assistant` - Ask the AI assistant
- `GET /api/parent-assistant/conversation/{session_id}` - Get conversation history
- `GET /api/parent-assistant/summary/{session_id}` - Get conversation summary

### 5. Sources 📚
**Purpose**: View trusted sources and citations used by the AI

**Features**:
- Citation tracking for all AI responses
- Source type indicators (CDC, CPSC, NIH, etc.)
- Confidence scores
- Public domain and license information
- Relevant excerpts from sources
- Usage statistics
- Two view modes: Summary and Detailed

**Source Types**:
- 🏥 **CDC**: Centers for Disease Control and Prevention
- 🛡️ **CPSC**: Consumer Product Safety Commission
- 🔬 **NIH**: National Institutes of Health
- 📚 **Other**: General educational resources

**How to Use**:
1. Select a child from the Children tab
2. Click the "Sources" tab
3. Toggle between "Summary" and "Detailed" views
4. View source usage statistics
5. Click "View Citation" to see full details
6. Click on source URLs to visit original content

**API Endpoints**:
- `GET /api/citations/session/{session_id}/summary` - Get source summary
- `GET /api/citations/session/{session_id}` - Get all citations
- `POST /api/citations` - Record new citation

## Navigation and Layout

### Header
- **Logo**: Click to return to home
- **Child Info**: Shows selected child's name, age, and profile picture
- **Logout**: Clears session and returns to login

### Tab Navigation
All five tabs are displayed when a child is selected:
1. Children 👥
2. Alerts 🚨
3. Activities 📋
4. AI Assistant 💡
5. Sources 📚

### Theme Support
The dashboard supports both Light and Dark themes:
- Light theme: Clean, professional appearance
- Dark theme: Modern glassmorphism with neon accents

Configure theme in Settings tab.

## Real-time Features

### Auto-refresh
- **Children list**: Refreshes every 30 seconds
- **Active session**: Checks every 10 seconds
- **Alerts**: Refreshes every 10 seconds
- **Activities**: Refreshes every 15 seconds

### Notifications
- Browser notifications for emergency alerts
- Sound alerts for critical safety concerns
- Visual indicators for unresolved alerts

## Session Management

### Active Sessions
When a child starts using the AI assistant:
1. A new session is automatically created
2. The child appears as "Active Now" in the Children tab
3. All monitoring features become available
4. Parents can view real-time activity and alerts

### Inactive Sessions
When no active session exists:
- Friendly placeholder messages appear
- Historical data remains available
- Parents can still manage child profiles and settings

## API Testing

### Test Endpoints Manually
```bash
# Get children
curl "http://localhost:8000/api/children/parent/demo_parent"

# Get sessions
curl "http://localhost:8000/api/sessions/parent/demo_parent"

# Get alerts
curl "http://localhost:8000/api/alerts/{session_id}"

# Get activities
curl "http://localhost:8000/api/sessions/{session_id}/activities"

# Ask AI Assistant
curl -X POST "http://localhost:8000/api/parent-assistant" \
  -H "Content-Type: application/json" \
  -d '{
    "session_id": "{session_id}",
    "parent_question": "How is my child doing?"
  }'

# Get citations
curl "http://localhost:8000/api/citations/session/{session_id}/summary"
```

## Troubleshooting

### Feature Not Loading
1. Check that backend is running: `docker ps`
2. Verify session exists: `curl "http://localhost:8000/api/sessions/parent/{parent_id}"`
3. Check browser console for errors
4. Ensure child is selected in Children tab

### No Data Showing
1. Run `./create_demo_data.sh` to generate test data
2. Make sure you're logged in with the correct parent_id
3. Select a child from the Children tab
4. Verify the child has an active session

### API Errors
1. Check backend logs: `docker logs babysitter-backend`
2. Verify NVIDIA API key is configured (required for AI Assistant)
3. Check database connectivity
4. Restart backend: `docker restart babysitter-backend`

## Implementation Status

✅ **Children Management**: Fully implemented
✅ **Alerts Panel**: Fully implemented
✅ **Activities Log**: Fully implemented
✅ **AI Assistant**: Fully implemented
✅ **Sources/Citations**: Fully implemented

All features are working and integrated with the backend APIs.

## Next Steps

1. **Login**: Use the parent login page to access the dashboard
2. **Create Demo Data**: Run `./create_demo_data.sh`
3. **Explore Features**: Navigate through all five tabs
4. **Test Real Usage**: Have a child start a session and monitor in real-time

---

**Last Updated**: November 1, 2025
**Version**: 1.0.0
