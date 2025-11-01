#!/bin/bash
# Test I Spy Game functionality

API_URL="http://localhost:8000"

echo "=== Testing I Spy Game ==="
echo ""

# First, create a test session
echo "1. Creating test session..."
SESSION_RESPONSE=$(curl -s -X POST "${API_URL}/api/sessions" \
  -H "Content-Type: application/json" \
  -d '{
    "child_name": "Test Child",
    "child_age": 7,
    "parent_id": "test-parent-ispy"
  }')

SESSION_ID=$(echo $SESSION_RESPONSE | grep -o '"session_id":"[^"]*"' | cut -d'"' -f4)

if [ -z "$SESSION_ID" ]; then
  echo "❌ Failed to create session"
  echo "Response: $SESSION_RESPONSE"
  exit 1
fi

echo "✅ Session created: $SESSION_ID"
echo ""

# Create a simple test image (a 1x1 pixel red PNG in base64)
# For a real test, you'd use an actual image with objects
TEST_IMAGE_BASE64="iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8DwHwAFBQIAX8jx0gAAAABJRU5ErkJggg=="

echo "2. Testing image analysis with game context..."
echo "Note: This is a test with a minimal image. The vision service will try to identify objects."
echo ""

# For testing, let's just verify the endpoint works
# In production, you'd use a real image with objects
TEMP_IMAGE_FILE="/tmp/test_image.png"
echo -n "$TEST_IMAGE_BASE64" | base64 -D > "$TEMP_IMAGE_FILE" 2>/dev/null || echo -n "$TEST_IMAGE_BASE64" | base64 -d > "$TEMP_IMAGE_FILE"

# Test the image analyze endpoint
ANALYSIS_RESPONSE=$(curl -s -X POST "${API_URL}/api/images/analyze" \
  -F "image=@${TEMP_IMAGE_FILE}" \
  -F "session_id=${SESSION_ID}" \
  -F "context=game" \
  -F "child_age=7" \
  -F "prompt=Identify objects for I Spy game")

echo "Response:"
echo "$ANALYSIS_RESPONSE" | python3 -m json.tool 2>/dev/null || echo "$ANALYSIS_RESPONSE"
echo ""

# Check if detected_objects field exists
if echo "$ANALYSIS_RESPONSE" | grep -q "detected_objects"; then
  echo "✅ detected_objects field is present in response"

  # Extract and display detected objects
  OBJECTS=$(echo "$ANALYSIS_RESPONSE" | python3 -c "import sys, json; data=json.load(sys.stdin); print(', '.join(data.get('detected_objects', [])))" 2>/dev/null || echo "")

  if [ -n "$OBJECTS" ]; then
    echo "✅ Objects detected: $OBJECTS"
  else
    echo "⚠️  No objects were detected (this is expected for a blank test image)"
  fi
else
  echo "❌ detected_objects field is missing from response"
fi

echo ""
echo "=== Test Complete ==="
echo ""
echo "To test with a real image:"
echo "1. Take a photo of a room with objects"
echo "2. Save it as /tmp/room.jpg"
echo "3. Run: curl -X POST ${API_URL}/api/images/analyze \\"
echo "     -F 'image=@/tmp/room.jpg' \\"
echo "     -F 'session_id=${SESSION_ID}' \\"
echo "     -F 'context=game' \\"
echo "     -F 'child_age=7' \\"
echo "     -F 'prompt=Identify objects for I Spy game'"

# Cleanup
rm -f "$TEMP_IMAGE_FILE"
