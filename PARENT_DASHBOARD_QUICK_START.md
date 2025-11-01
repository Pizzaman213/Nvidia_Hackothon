# Parent Dashboard - Quick Start Guide

## ✅ All Features Are Working!

All five parent dashboard features are fully implemented and operational:

### 1. **Children** 👥
Manage child profiles, view active status, and select which child to monitor.

### 2. **Alerts** 🚨
Real-time safety notifications and warnings about your child's interactions.

### 3. **Activities** 📋
Track what your child is doing (homework, stories, games, etc.).

### 4. **AI Assistant** 💡
Chat with an AI to get parenting advice and insights about your child's session.

### 5. **Sources** 📚
View trusted sources and citations used by the AI (CDC, NIH, CPSC, etc.).

---

## Quick Setup (3 Steps)

### Step 1: Start the Application
```bash
# Both frontend and backend should already be running
docker ps  # Verify containers are up
```

### Step 2: Create Demo Data
```bash
cd /Users/connorsecrist/Nvidia_hackathon
./create_demo_data.sh
```

This creates a demo session with:
- Child named "Emma" (age 8)
- Sample chat messages
- An activity (homework help)
- A safety alert

### Step 3: Login and Explore
1. Open browser to `https://localhost:3000`
2. Enter parent ID: `demo_parent`
3. Click "Login as Parent"
4. Explore all five tabs!

---

## How to Use Each Feature

### Children Tab
- **View all children**: See profiles auto-discovered from sessions
- **Add manually**: Click "+ Add Child" to create profiles
- **Select child**: Click "Select" to monitor a specific child
- **Edit settings**: Click "⚙️ Settings" for child-specific configuration

### Alerts Tab
- **View alerts**: See all safety notifications for selected child
- **Resolve alerts**: Click "Resolve" to acknowledge
- **Alert levels**: Emergency (red), Warning (yellow), Info (blue)

### Activities Tab
- **Track activities**: See what child is currently doing
- **View history**: Scroll through past activities
- **Expand details**: Click activity to see chat transcript
- **Load more**: Button at bottom for pagination

### AI Assistant Tab
- **Ask questions**: "How is my child doing today?"
- **Get insights**: AI provides key observations and suggestions
- **View history**: See previous conversations
- **Context-aware**: AI knows about your child's current session

### Sources Tab
- **Summary view**: See usage statistics by source
- **Detailed view**: Full citations with excerpts
- **Trust indicators**: Confidence scores and license info
- **Source types**: CDC, NIH, CPSC, and more

---

## Accessing the Dashboard

### From Login Page
1. Go to `https://localhost:3000`
2. Enter your parent ID
3. Click "Login as Parent"

### Direct URL
- Dashboard: `https://localhost:3000/parent/dashboard`
- Login: `https://localhost:3000/parent/login`

### Test Parent IDs
- `demo_parent` - From demo script
- `parent_001` - Default test ID
- Any string - Create your own!

---

## Monitoring an Active Session

When a child starts using the AI assistant:

1. **Auto-discovery**: Child profile is automatically created
2. **Select child**: Click the "Children" tab and select your child
3. **View tabs**: All monitoring features become available
   - Alerts: Real-time safety notifications
   - Activities: Current and past activities
   - AI Assistant: Ask questions about the session
   - Sources: View citations and trusted sources

4. **Real-time updates**:
   - Alerts refresh every 10 seconds
   - Activities refresh every 15 seconds
   - Active session checks every 10 seconds

---

## Common Tasks

### Create a Child Profile Manually
1. Go to Children tab
2. Click "+ Add Child"
3. Enter name, age, and theme preference
4. (Optional) Upload profile picture
5. (Optional) Set emergency contact number
6. Click "Add Child"

### View Safety Alerts
1. Select a child
2. Click "Alerts" tab
3. View all alerts sorted by most recent
4. Click "Resolve" on any alert to mark it as handled

### Track Child's Activities
1. Select a child
2. Click "Activities" tab
3. Click on any activity to expand details
4. View chat messages during that activity
5. See duration and type of activity

### Get Parenting Advice
1. Select a child
2. Click "AI Assistant" tab
3. Type your question
4. View AI response with insights and suggestions
5. Continue conversation for more details

### Check Information Sources
1. Select a child
2. Click "Sources" tab
3. Toggle between "Summary" and "Detailed" views
4. Click on URLs to visit original sources
5. Review confidence scores and excerpts

---

## Troubleshooting

### "No Active Session" Message
**Cause**: Child is not currently online

**Solutions**:
- Have the child start a new session from the child interface
- Historical data is still available
- Child profiles can still be managed

### Features Not Loading
**Check**:
1. Backend running: `docker ps | grep backend`
2. Frontend running: `docker ps | grep frontend`
3. Browser console for errors (F12)

**Fix**:
```bash
# Restart containers
docker restart babysitter-backend
docker restart babysitter-frontend
```

### No Children Showing
**Cause**: No profiles created yet

**Solutions**:
1. Run `./create_demo_data.sh` for test data
2. Manually add child via "+ Add Child" button
3. Start a child session (auto-discovery will create profile)

### API Errors
**Check backend logs**:
```bash
docker logs babysitter-backend --tail 50
```

**Common fixes**:
- Ensure NVIDIA API key is configured
- Restart backend: `docker restart babysitter-backend`
- Check database is running: `docker ps | grep postgres`

---

## API Endpoints Reference

All endpoints are documented at: `http://localhost:8000/docs`

### Quick Tests
```bash
# Health check
curl http://localhost:8000/health

# Get children
curl "http://localhost:8000/api/children/parent/demo_parent"

# Get sessions
curl "http://localhost:8000/api/sessions/parent/demo_parent"

# Get alerts (replace {session_id})
curl "http://localhost:8000/api/alerts/{session_id}"

# Get activities (replace {session_id})
curl "http://localhost:8000/api/sessions/{session_id}/activities"
```

---

## Next Steps

1. ✅ **Login**: Access the parent dashboard
2. ✅ **Create Data**: Run demo data script
3. ✅ **Explore**: Navigate all five tabs
4. ✅ **Test**: Try each feature
5. 🚀 **Go Live**: Have a real child session and monitor!

---

## Support

- Full guide: `PARENT_DASHBOARD_GUIDE.md`
- Technical docs: `docs/TECHNICAL_ARCHITECTURE.md`
- Setup guide: `docs/SETUP_AND_DEPLOYMENT.md`
- API docs: `http://localhost:8000/docs`

---

**Status**: ✅ All features working and tested
**Last Updated**: November 1, 2025
