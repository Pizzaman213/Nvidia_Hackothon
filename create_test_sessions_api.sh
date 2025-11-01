#!/bin/bash
# Create test sessions via the API

PARENT_ID="test_parent_123"
BASE_URL="http://localhost:8000"

echo "Creating test sessions via API..."
echo "Parent ID: $PARENT_ID"
echo ""

# Create session for Emma
echo "Creating session for Emma (age 7, girl)..."
curl -s -X POST "$BASE_URL/api/sessions" \
  -H "Content-Type: application/json" \
  -d "{
    \"parent_id\": \"$PARENT_ID\",
    \"child_name\": \"Emma\",
    \"child_age\": 7,
    \"child_gender\": \"girl\"
  }" | python3 -m json.tool | head -20

echo ""

# Create session for Liam
echo "Creating session for Liam (age 5, boy)..."
curl -s -X POST "$BASE_URL/api/sessions" \
  -H "Content-Type: application/json" \
  -d "{
    \"parent_id\": \"$PARENT_ID\",
    \"child_name\": \"Liam\",
    \"child_age\": 5,
    \"child_gender\": \"boy\"
  }" | python3 -m json.tool | head -20

echo ""

# Create session for Sophia
echo "Creating session for Sophia (age 9, girl)..."
curl -s -X POST "$BASE_URL/api/sessions" \
  -H "Content-Type: application/json" \
  -d "{
    \"parent_id\": \"$PARENT_ID\",
    \"child_name\": \"Sophia\",
    \"child_age\": 9,
    \"child_gender\": \"girl\"
  }" | python3 -m json.tool | head -20

echo ""
echo "✓ Test sessions created!"
echo ""
echo "Now test auto-discovery:"
echo "  curl -X POST $BASE_URL/api/children/parent/$PARENT_ID/auto-discover | python3 -m json.tool"
echo ""
echo "Or log in as parent ID: $PARENT_ID"
