#!/bin/bash
# Login as tasker and test all-services endpoint
TOKEN=$(curl -s -X POST http://localhost:3000/api/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"phone":"0909876543","password":"123456"}' | python3 -c "import sys,json; print(json.load(sys.stdin)['access_token'])")

echo "Token: $TOKEN"
echo "---"

# Test all-services
echo "=== /api/taskers/all-services ==="
curl -s http://localhost:3000/api/taskers/all-services \
  -H "Authorization: Bearer $TOKEN" | python3 -m json.tool 2>/dev/null || curl -s http://localhost:3000/api/taskers/all-services -H "Authorization: Bearer $TOKEN"

echo ""
echo "=== /api/services ==="
curl -s http://localhost:3000/api/services \
  -H "Authorization: Bearer $TOKEN" | python3 -m json.tool 2>/dev/null || curl -s http://localhost:3000/api/services -H "Authorization: Bearer $TOKEN"
