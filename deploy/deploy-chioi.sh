#!/usr/bin/env bash
# =============================================================================
# CHỊ ƠI! — Deploy Application Script
# Chạy SAU khi setup-fresh-vps.sh thành công.
# Thực hiện: clone repo, install deps, prisma migrate, build, PM2, nginx, SSL.
# =============================================================================

set -euo pipefail

# --------- CẤU HÌNH ---------
DEPLOY_USER="${DEPLOY_USER:-chioi}"
APP_DIR="${APP_DIR:-/opt/chioi}"
REPO_URL="${REPO_URL:-https://github.com/nathanha2808-hub/Ch-i-App.git}"
REPO_BRANCH="${REPO_BRANCH:-main}"
PG_DB_NAME="${PG_DB_NAME:-chioi_db}"
PG_DB_USER="${PG_DB_USER:-chioi_user}"
PG_DB_PASS="${PG_DB_PASS:-}"
JWT_SECRET="${JWT_SECRET:-}"
DOMAIN_FRONTEND="${DOMAIN_FRONTEND:-chioi.vn}"
DOMAIN_API="${DOMAIN_API:-api.chioi.vn}"
ADMIN_EMAIL="${ADMIN_EMAIL:-admin@chioi.vn}"
NESTJS_PORT="${NESTJS_PORT:-3000}"
# ----------------------------

log()  { echo -e "\033[1;32m[+]\033[0m $*"; }
warn() { echo -e "\033[1;33m[!]\033[0m $*"; }
err()  { echo -e "\033[1;31m[x]\033[0m $*" >&2; exit 1; }

[[ "$(whoami)" == "$DEPLOY_USER" ]] || err "Chạy bằng user $DEPLOY_USER, KHÔNG chạy bằng root: sudo -u $DEPLOY_USER bash $0"
[[ -n "$PG_DB_PASS" ]] || err "Set PG_DB_PASS"
[[ -n "$JWT_SECRET" ]] || err "Set JWT_SECRET (random 64 ký tự — gen: openssl rand -hex 32)"
[[ ${#JWT_SECRET} -ge 32 ]] || err "JWT_SECRET phải >= 32 ký tự"

# =============================================================================
# 1. CLONE / PULL REPO
# =============================================================================
log "1/6 — Clone/pull repo"
sudo mkdir -p "$APP_DIR"
sudo chown -R "$DEPLOY_USER:$DEPLOY_USER" "$APP_DIR"

if [[ -d "$APP_DIR/.git" ]]; then
  cd "$APP_DIR"
  git fetch origin
  git checkout "$REPO_BRANCH"
  git pull origin "$REPO_BRANCH"
else
  git clone --branch "$REPO_BRANCH" "$REPO_URL" "$APP_DIR"
  cd "$APP_DIR"
fi

# =============================================================================
# 2. BACKEND — install + .env + prisma + build
# =============================================================================
log "2/6 — Backend install"
cd "$APP_DIR/backend"

# Tạo .env
cat > .env <<EOF
DATABASE_URL="postgresql://$PG_DB_USER:$PG_DB_PASS@localhost:5432/$PG_DB_NAME"
JWT_SECRET="$JWT_SECRET"
PORT=$NESTJS_PORT

# Mock providers — thay khi có credentials thật (xem .env.example)
SMS_PROVIDER=mock
KYC_PROVIDER=mock
PAYMENT_PROVIDER=mock
EOF
chmod 600 .env

npm ci --omit=dev
npm install -D prisma  # Cần cho migrate (build-time, không phải runtime)

log "  → Prisma generate + migrate"
npx prisma generate --schema=prisma/schema.prisma
# Đối với fresh DB: dùng migrate deploy (đã có migration files) hoặc db push (introspect)
if [[ -d "prisma/migrations" ]] && ls prisma/migrations/*/migration.sql >/dev/null 2>&1; then
  npx prisma migrate deploy --schema=prisma/schema.prisma
else
  warn "Không có migration files chuẩn — dùng db push (KHÔNG dùng cho production thật)"
  npx prisma db push --schema=prisma/schema.prisma --accept-data-loss
fi

# Áp dụng manual migration tasker.address (nếu có)
if [[ -f prisma/migrations/manual_20260513_add_tasker_address.sql ]]; then
  log "  → Apply manual migration tasker.address"
  PGPASSWORD="$PG_DB_PASS" psql -h localhost -U "$PG_DB_USER" -d "$PG_DB_NAME" \
    -f prisma/migrations/manual_20260513_add_tasker_address.sql || true
fi

log "  → Build NestJS"
npm install --include=dev  # Cần devDeps để build
npm run build
npm prune --production       # Xóa devDeps sau build để tiết kiệm

# =============================================================================
# 3. PM2 — start backend
# =============================================================================
log "3/6 — PM2 start backend"
cd "$APP_DIR/backend"

# Stop old instance nếu có
pm2 delete chioi-backend 2>/dev/null || true

pm2 start dist/src/main.js --name chioi-backend \
  --env production \
  --max-memory-restart 500M \
  --time \
  --log-date-format "YYYY-MM-DD HH:mm:ss"

pm2 save

# =============================================================================
# 4. FRONTEND — copy static files
# =============================================================================
log "4/6 — Frontend (static files) — copy sang /var/www"
sudo mkdir -p "/var/www/$DOMAIN_FRONTEND"
sudo cp -r "$APP_DIR/frontend/"* "/var/www/$DOMAIN_FRONTEND/"
sudo chown -R www-data:www-data "/var/www/$DOMAIN_FRONTEND"

# =============================================================================
# 5. NGINX — config 2 sites: frontend + api
# =============================================================================
log "5/6 — Nginx config"
sudo cp "$APP_DIR/deploy/nginx-chioi.conf" "/etc/nginx/sites-available/chioi"

# Replace placeholders trong config
sudo sed -i "s|__DOMAIN_FRONTEND__|$DOMAIN_FRONTEND|g" "/etc/nginx/sites-available/chioi"
sudo sed -i "s|__DOMAIN_API__|$DOMAIN_API|g" "/etc/nginx/sites-available/chioi"
sudo sed -i "s|__NESTJS_PORT__|$NESTJS_PORT|g" "/etc/nginx/sites-available/chioi"
sudo sed -i "s|__APP_DIR__|/var/www/$DOMAIN_FRONTEND|g" "/etc/nginx/sites-available/chioi"

sudo ln -sf "/etc/nginx/sites-available/chioi" "/etc/nginx/sites-enabled/chioi"
sudo nginx -t && sudo systemctl reload nginx

# =============================================================================
# 6. SSL (Let's Encrypt)
# =============================================================================
log "6/6 — SSL Let's Encrypt"
warn "DNS phải đã trỏ $DOMAIN_FRONTEND + $DOMAIN_API về IP VPS này TRƯỚC khi chạy bước này"
echo "Chạy lệnh sau (1 lần):"
echo "  sudo certbot --nginx -d $DOMAIN_FRONTEND -d $DOMAIN_API \\"
echo "    --non-interactive --agree-tos --email $ADMIN_EMAIL --redirect"
echo ""

# =============================================================================
# DONE
# =============================================================================
log "=========================================="
log "✅ Deploy hoàn tất!"
log "=========================================="
echo ""
echo "Verify:"
echo "  pm2 list"
echo "  pm2 logs chioi-backend --lines 50"
echo "  curl http://localhost:$NESTJS_PORT/api/docs (sau khi nginx proxy ok)"
echo "  curl https://$DOMAIN_API/api/docs (sau SSL setup)"
echo ""
echo "Khi cần update code:"
echo "  cd $APP_DIR && git pull && cd backend && npm ci && npm run build && pm2 restart chioi-backend"
