#!/bin/bash
# Test script to verify all parent dashboard features

API_URL="http://localhost:8000"

echo "=========================================="
echo "Testing Parent Dashboard Features"
echo "=========================================="
echo ""

# Test 1: Check Children API
echo "1. Testing Children API..."
curl -s -X GET "$API_URL/api/children?parent_id=test_parent" | python3 -m json.tool | head -20
echo ""

# Test 2: Check Alerts API
echo "2. Testing Alerts API..."
curl -s -X GET "$API_URL/api/alerts?session_id=test_session" | python3 -m json.tool | head -20
echo ""

# Test 3: Check Activities API
echo "3. Testing Activities API..."
curl -s -X GET "$API_URL/api/activities?session_id=test_session" | python3 -m json.tool | head -20
echo ""

# Test 4: Check Parent Assistant API
echo "4. Testing Parent Assistant API..."
curl -s -X POST "$API_URL/api/parent-assistant" \
  -H "Content-Type: application/json" \
  -d '{
    "session_id": "test_session",
    "parent_question": "How is my child doing?"
  }' | python3 -m json.tool | head -30
echo ""

# Test 5: Check Citations API
echo "5. Testing Citations API..."
curl -s -X GET "$API_URL/api/citations/session/test_session/summary" | python3 -m json.tool | head -20
echo ""

# Test 6: Check Sessions API
echo "6. Testing Sessions API..."
curl -s -X GET "$API_URL/api/sessions?parent_id=test_parent" | python3 -m json.tool | head -20
echo ""

echo "=========================================="
echo "All tests completed!"
echo "=========================================="