#!/bin/bash
# Test Emergency/SOS Button Functionality

echo "=========================================="
echo "Testing Emergency/SOS Button"
echo "=========================================="
echo ""

# Get an active session
echo "1. Getting active sessions..."
SESSIONS=$(curl -s "http://localhost:8000/api/sessions/parent/demo_parent")
SESSION_ID=$(echo "$SESSIONS" | python3 -c "import sys, json; data=json.load(sys.stdin); print(data[0]['session_id'] if len(data) > 0 else '')" 2>/dev/null)

if [ -z "$SESSION_ID" ]; then
  echo "No active session found. Creating one..."
  # Create a new session
  SESSION_RESPONSE=$(curl -s -X POST "http://localhost:8000/api/sessions" \
    -H "Content-Type: application/json" \
    -d '{
      "parent_id": "demo_parent",
      "child_name": "Test Child",
      "child_age": 8
    }')
  SESSION_ID=$(echo "$SESSION_RESPONSE" | python3 -c "import sys, json; print(json.load(sys.stdin)['session_id'])" 2>/dev/null)
fi

echo "✓ Using session: $SESSION_ID"
echo ""

# Test 1: Trigger emergency alert
echo "2. Triggering EMERGENCY alert (SOS button)..."
EMERGENCY_RESPONSE=$(python3 << PYEOF
import json
import urllib.request

url = "http://localhost:8000/api/emergency"
data = json.dumps({
    "session_id": "$SESSION_ID",
    "reason": "🚨 CHILD PRESSED SOS BUTTON - NEEDS IMMEDIATE HELP!"
}).encode('utf-8')

req = urllib.request.Request(url, data=data, headers={'Content-Type': 'application/json'})
try:
    with urllib.request.urlopen(req) as response:
        result = json.loads(response.read().decode('utf-8'))
        print(json.dumps(result, indent=2))
except Exception as e:
    print(f"Error: {e}")
PYEOF
)

echo "$EMERGENCY_RESPONSE"
echo ""

# Test 2: Check if alert was created
echo "3. Checking if emergency alert was created..."
ALERTS=$(curl -s "http://localhost:8000/api/alerts/$SESSION_ID")
echo "$ALERTS" | python3 -m json.tool | head -40
echo ""

# Test 3: Count emergency alerts
EMERGENCY_COUNT=$(echo "$ALERTS" | python3 -c "import sys, json; data=json.load(sys.stdin); print(sum(1 for a in data if a.get('alert_level') == 'emergency'))" 2>/dev/null)

echo "4. Emergency Alert Summary:"
echo "   Total alerts: $(echo "$ALERTS" | python3 -c "import sys, json; print(len(json.load(sys.stdin)))" 2>/dev/null)"
echo "   Emergency alerts: $EMERGENCY_COUNT"
echo ""

if [ "$EMERGENCY_COUNT" -gt "0" ]; then
  echo "✅ SUCCESS: Emergency alert created!"
else
  echo "❌ FAILED: No emergency alert found"
fi

echo ""
echo "=========================================="
echo "How to Test in the Browser"
echo "=========================================="
echo ""
echo "1. Open: https://localhost:3000"
echo "2. Login with parent ID: demo_parent"
echo "3. Select a child from the Children tab"
echo "4. Click the 'Alerts' tab"
echo "5. You should see the EMERGENCY alert!"
echo ""
echo "For child interface testing:"
echo "1. Open: https://localhost:3000 (in a different browser/incognito)"
echo "2. Select a child profile"
echo "3. Click the red 'SOS' button in the top-right"
echo "4. Check parent dashboard for the emergency alert"
echo ""
echo "Session ID for testing: $SESSION_ID"
echo ""
