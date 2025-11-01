#!/bin/bash
# Create comprehensive demo data for all parent dashboard features

API_URL="http://localhost:8000"

echo "=========================================="
echo "Creating Demo Data for Parent Dashboard"
echo "=========================================="
echo ""

# Step 1: Create a parent session with a child
echo "1. Creating a child session..."
SESSION_RESPONSE=$(curl -s -X POST "$API_URL/api/sessions" \
  -H "Content-Type: application/json" \
  -d '{
    "parent_id": "demo_parent",
    "child_name": "Emma",
    "child_age": 8
  }')

SESSION_ID=$(echo "$SESSION_RESPONSE" | python3 -c "import sys, json; print(json.load(sys.stdin)['session_id'])" 2>/dev/null)

if [ -z "$SESSION_ID" ]; then
  echo "Failed to create session"
  echo "$SESSION_RESPONSE" | python3 -m json.tool
  exit 1
fi

echo "✓ Session created: $SESSION_ID"
echo ""

# Step 2: Create some chat messages
echo "2. Creating chat messages..."
curl -s -X POST "$API_URL/api/chat" \
  -H "Content-Type: application/json" \
  -d "{
    \"session_id\": \"$SESSION_ID\",
    \"user_message\": \"Hi! Can you help me with my homework?\"
  }" > /dev/null

echo "✓ Chat messages created"
echo ""

# Step 3: Create an activity
echo "3. Creating an activity..."
curl -s -X POST "$API_URL/api/activities" \
  -H "Content-Type: application/json" \
  -d "{
    \"session_id\": \"$SESSION_ID\",
    \"activity_type\": \"homework\",
    \"description\": \"Helping with math homework\"
  }" > /dev/null

echo "✓ Activity created"
echo ""

# Step 4: Create an alert
echo "4. Creating a safety alert..."
curl -s -X POST "$API_URL/api/alerts" \
  -H "Content-Type: application/json" \
  -d "{
    \"session_id\": \"$SESSION_ID\",
    \"alert_level\": \"info\",
    \"message\": \"Child requested homework help\",
    \"requires_action\": false
  }" > /dev/null

echo "✓ Alert created"
echo ""

# Step 5: Auto-discover children from sessions
echo "5. Auto-discovering children from sessions..."
DISCOVER_RESPONSE=$(curl -s -X POST "$API_URL/api/children/auto-discover?parent_id=demo_parent")
echo "$DISCOVER_RESPONSE" | python3 -m json.tool
echo ""

echo "=========================================="
echo "Demo Data Created Successfully!"
echo "=========================================="
echo ""
echo "Session ID: $SESSION_ID"
echo ""
echo "You can now:"
echo "  1. View children: curl \"$API_URL/api/children/parent/demo_parent\""
echo "  2. View alerts: curl \"$API_URL/api/alerts/$SESSION_ID\""
echo "  3. View activities: curl \"$API_URL/api/activities/$SESSION_ID\""
echo "  4. View sessions: curl \"$API_URL/api/sessions/parent/demo_parent\""
echo ""
echo "Login to the parent dashboard with parent_id: demo_parent"
echo ""
