#!/bin/bash
# Add cache buster to all api.js references
find /opt/chioi/frontend -name '*.html' -exec sed -i 's|shared/api.js"|shared/api.js?v=20260514"|g' {} +
find /opt/chioi/frontend -name '*.html' -exec sed -i "s|shared/api.js'>|shared/api.js?v=20260514'>|g" {} +
echo "Cache busted! Checking result:"
grep -c 'api.js?v=20260514' /opt/chioi/frontend/khachhang/dangnhap.html
