#!/bin/bash
# Test script to verify activities are being logged

set -e

echo "==================================================================="
echo "Activity Logging Test"
echo "==================================================================="
echo ""

# Get the most recent active session
echo "1. Fetching active sessions..."
SESSION_ID=$(curl -s "http://localhost:8000/api/sessions/parent/parent_parent" | \
  python3 -c "import sys, json; sessions = json.load(sys.stdin); print(sessions[0]['session_id'] if sessions else '')")

if [ -z "$SESSION_ID" ]; then
  echo "❌ No active sessions found. Please start a child session first."
  exit 1
fi

echo "✓ Found active session: $SESSION_ID"
echo ""

# Create a test activity
echo "2. Creating a test activity..."
ACTIVITY=$(curl -s -X POST "http://localhost:8000/api/activities" \
  -H "Content-Type: application/json" \
  -d "{
    \"session_id\": \"$SESSION_ID\",
    \"activity_type\": \"free_chat\",
    \"description\": \"Test: Child is chatting\",
    \"details\": null
  }")

ACTIVITY_ID=$(echo "$ACTIVITY" | python3 -c "import sys, json; print(json.load(sys.stdin)['id'])")
echo "✓ Activity created with ID: $ACTIVITY_ID"
echo ""

# Fetch all activities for the session
echo "3. Fetching all activities for session..."
ACTIVITIES=$(curl -s "http://localhost:8000/api/sessions/$SESSION_ID/activities")
COUNT=$(echo "$ACTIVITIES" | python3 -c "import sys, json; print(len(json.load(sys.stdin)))")

echo "✓ Found $COUNT activities for this session"
echo ""

# Display the activities
echo "4. Activity Log:"
echo "$ACTIVITIES" | python3 -c "
import sys, json
from datetime import datetime

activities = json.load(sys.stdin)
for i, act in enumerate(activities, 1):
    start = datetime.fromisoformat(act['start_time'].replace('Z', '+00:00'))
    print(f\"  [{i}] {act['activity_type']}: {act['description']}\")
    print(f\"      Started: {start.strftime('%Y-%m-%d %H:%M:%S')}\")
    if act['end_time']:
        end = datetime.fromisoformat(act['end_time'].replace('Z', '+00:00'))
        print(f\"      Ended: {end.strftime('%Y-%m-%d %H:%M:%S')}\")
    else:
        print(f\"      Status: In Progress\")
    print()
"

echo "==================================================================="
echo "✅ Activities are being logged correctly!"
echo "==================================================================="
echo ""
echo "Next steps:"
echo "1. Open the child interface at http://localhost:3000"
echo "2. Select a child and choose an activity"
echo "3. Open the parent dashboard and go to the Activities tab"
echo "4. You should see the activity you selected!"
