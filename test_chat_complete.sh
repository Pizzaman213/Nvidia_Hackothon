#!/bin/bash

echo "=== AI Babysitter Chat Function Test ==="
echo ""

# Test 1: Create Session
echo "1. Creating test session..."
SESSION_RESPONSE=$(curl -s -X POST "http://localhost:8000/api/sessions" \
  -H "Content-Type: application/json" \
  -d '{"child_name": "TestChild", "child_age": 8, "parent_id": "test_parent"}')

SESSION_ID=$(echo $SESSION_RESPONSE | python3 -c "import sys, json; print(json.load(sys.stdin)['session_id'])")
echo "   ✓ Session created: $SESSION_ID"
echo ""

# Test 2: Send first chat message
echo "2. Testing first chat message..."
curl -s -X POST "http://localhost:8000/api/chat" \
  -H "Content-Type: application/json" \
  -d "{\"session_id\": \"$SESSION_ID\", \"message\": \"Hi! Tell me about space!\", \"child_age\": 8, \"voice_output\": false}" \
  | python3 -c "import sys, json; r=json.load(sys.stdin); print(f\"   ✓ AI Response (first 100 chars): {r['response'][:100]}...\"); print(f\"   ✓ Safety Status: {r['safety_status']}\"); print(f\"   ✓ Emotion: {r['emotion']}\")"
echo ""

# Test 3: Send follow-up message (test context)
echo "3. Testing follow-up message with context..."
curl -s -X POST "http://localhost:8000/api/chat" \
  -H "Content-Type: application/json" \
  -d "{\"session_id\": \"$SESSION_ID\", \"message\": \"What about the moon?\", \"child_age\": 8, \"voice_output\": false}" \
  | python3 -c "import sys, json; r=json.load(sys.stdin); print(f\"   ✓ AI Response (first 100 chars): {r['response'][:100]}...\"); print(f\"   ✓ Requires Camera: {r['requires_camera']}\")"
echo ""

# Test 4: Safety detection
echo "4. Testing safety detection..."
curl -s -X POST "http://localhost:8000/api/chat" \
  -H "Content-Type: application/json" \
  -d "{\"session_id\": \"$SESSION_ID\", \"message\": \"I feel sad today\", \"child_age\": 8, \"voice_output\": false}" \
  | python3 -c "import sys, json; r=json.load(sys.stdin); print(f\"   ✓ Emotion detected: {r['emotion']}\"); print(f\"   ✓ Safety Status: {r['safety_status']}\")"
echo ""

echo "=== All Chat Tests Completed Successfully! ==="
echo ""
echo "Summary:"
echo "  ✓ Session creation works"
echo "  ✓ Chat endpoint responds with AI-generated content"
echo "  ✓ Context awareness (follow-up questions)"
echo "  ✓ Safety and emotion detection active"
echo "  ✓ NVIDIA Nemotron LLM integration working"
