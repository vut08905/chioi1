#!/bin/bash
curl -s -X POST http://localhost:3000/api/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"phone":"0901234567","password":"123456"}'
echo ""
echo "---"
curl -s -X POST http://localhost/api/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"phone":"0901234567","password":"123456"}'
echo ""
