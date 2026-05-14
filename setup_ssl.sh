#!/bin/bash
# Generate self-signed SSL for IP-based HTTPS
echo "=== Tạo SSL self-signed certificate ==="

# Tạo thư mục chứa cert
mkdir -p /etc/nginx/ssl

# Tạo certificate (valid 365 ngày)
openssl req -x509 -nodes -days 365 \
  -newkey rsa:2048 \
  -keyout /etc/nginx/ssl/chioi.key \
  -out /etc/nginx/ssl/chioi.crt \
  -subj "/C=VN/ST=HCMC/L=HCMC/O=ChiOi/CN=188.166.210.73" \
  -addext "subjectAltName=IP:188.166.210.73"

echo "=== Certificate đã tạo ==="
ls -la /etc/nginx/ssl/
