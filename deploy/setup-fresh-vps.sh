#!/usr/bin/env bash
# =============================================================================
# CHỊ ƠI! — Fresh VPS Setup Script
# Chạy MỘT LẦN trên VPS Ubuntu 22.04 / 24.04 mới (root).
# Output: VPS hardened + Node 20 + PostgreSQL 16 + PostGIS + Nginx + PM2 sẵn sàng deploy.
# =============================================================================

set -euo pipefail

# --------- CẤU HÌNH (chỉnh trước khi chạy) ---------
DEPLOY_USER="${DEPLOY_USER:-chioi}"           # Non-root user sẽ quản lý app
DEPLOY_USER_PUBKEY="${DEPLOY_USER_PUBKEY:-}"  # Bắt buộc: SSH pubkey để login user mới
PG_DB_NAME="${PG_DB_NAME:-chioi_db}"
PG_DB_USER="${PG_DB_USER:-chioi_user}"
PG_DB_PASS="${PG_DB_PASS:-}"                  # Bắt buộc: password DB (16+ ký tự random)
TIMEZONE="${TIMEZONE:-Asia/Ho_Chi_Minh}"
SSH_PORT="${SSH_PORT:-22}"                    # Thay đổi nếu muốn port custom
DOMAIN_FRONTEND="${DOMAIN_FRONTEND:-chioi.vn}"
DOMAIN_API="${DOMAIN_API:-api.chioi.vn}"
ADMIN_EMAIL="${ADMIN_EMAIL:-admin@chioi.vn}"  # Cho Let's Encrypt + alerts
# ----------------------------------------------------

log()  { echo -e "\033[1;32m[+]\033[0m $*"; }
warn() { echo -e "\033[1;33m[!]\033[0m $*"; }
err()  { echo -e "\033[1;31m[x]\033[0m $*" >&2; exit 1; }

[[ $EUID -eq 0 ]] || err "Phải chạy bằng root: sudo bash $0"
[[ -n "$DEPLOY_USER_PUBKEY" ]] || err "Set DEPLOY_USER_PUBKEY (SSH pubkey) trước khi chạy"
[[ -n "$PG_DB_PASS" ]] || err "Set PG_DB_PASS (DB password) trước khi chạy"
[[ ${#PG_DB_PASS} -ge 16 ]] || err "PG_DB_PASS phải >= 16 ký tự"

. /etc/os-release
[[ "$ID" == "ubuntu" ]] || warn "Script test trên Ubuntu, OS hiện tại: $ID — proceed at your own risk"

log "Starting fresh VPS setup for Chị Ơi! — $(date)"

# =============================================================================
# 1. SYSTEM UPDATE + TIMEZONE
# =============================================================================
log "1/9 — System update + timezone"
export DEBIAN_FRONTEND=noninteractive
apt-get update -qq
apt-get upgrade -y -qq
apt-get install -y -qq curl wget git ufw fail2ban unattended-upgrades \
  ca-certificates gnupg lsb-release software-properties-common \
  htop ncdu net-tools dnsutils jq

timedatectl set-timezone "$TIMEZONE"
hostnamectl set-hostname "${HOSTNAME_OVERRIDE:-chioi-prod}"

# =============================================================================
# 2. NON-ROOT USER + SSH KEY
# =============================================================================
log "2/9 — Tạo user $DEPLOY_USER + SSH key"
if ! id "$DEPLOY_USER" &>/dev/null; then
  useradd -m -s /bin/bash -G sudo "$DEPLOY_USER"
  passwd -d "$DEPLOY_USER"  # Khoá password login, chỉ dùng key
fi

mkdir -p "/home/$DEPLOY_USER/.ssh"
echo "$DEPLOY_USER_PUBKEY" > "/home/$DEPLOY_USER/.ssh/authorized_keys"
chmod 700 "/home/$DEPLOY_USER/.ssh"
chmod 600 "/home/$DEPLOY_USER/.ssh/authorized_keys"
chown -R "$DEPLOY_USER:$DEPLOY_USER" "/home/$DEPLOY_USER/.ssh"

# Cho phép sudo không cần password (cho deploy script)
echo "$DEPLOY_USER ALL=(ALL) NOPASSWD:ALL" > "/etc/sudoers.d/$DEPLOY_USER"
chmod 440 "/etc/sudoers.d/$DEPLOY_USER"

# =============================================================================
# 3. SSH HARDENING — disable root + password auth
# =============================================================================
log "3/9 — SSH hardening (disable root + password)"
SSHD_CONFIG="/etc/ssh/sshd_config"
cp "$SSHD_CONFIG" "$SSHD_CONFIG.bak.$(date +%s)"

# Áp dụng các setting an toàn
sed -i 's/^#\?PermitRootLogin.*/PermitRootLogin no/' "$SSHD_CONFIG"
sed -i 's/^#\?PasswordAuthentication.*/PasswordAuthentication no/' "$SSHD_CONFIG"
sed -i 's/^#\?PubkeyAuthentication.*/PubkeyAuthentication yes/' "$SSHD_CONFIG"
sed -i 's/^#\?ChallengeResponseAuthentication.*/ChallengeResponseAuthentication no/' "$SSHD_CONFIG"
sed -i 's/^#\?UsePAM.*/UsePAM yes/' "$SSHD_CONFIG"
sed -i 's/^#\?X11Forwarding.*/X11Forwarding no/' "$SSHD_CONFIG"
sed -i "s/^#\?Port .*/Port $SSH_PORT/" "$SSHD_CONFIG"

# Verify trước khi restart
sshd -t || err "sshd_config invalid sau khi sửa — KHÔNG restart, check $SSHD_CONFIG"
systemctl restart ssh

# =============================================================================
# 4. UFW FIREWALL
# =============================================================================
log "4/9 — UFW firewall (chỉ mở $SSH_PORT, 80, 443)"
ufw --force reset
ufw default deny incoming
ufw default allow outgoing
ufw allow "$SSH_PORT/tcp" comment "SSH"
ufw allow 80/tcp comment "HTTP"
ufw allow 443/tcp comment "HTTPS"
ufw --force enable

# =============================================================================
# 5. FAIL2BAN
# =============================================================================
log "5/9 — fail2ban (chống brute force SSH)"
cat > /etc/fail2ban/jail.local <<EOF
[DEFAULT]
bantime  = 24h
findtime = 10m
maxretry = 5
banaction = ufw

[sshd]
enabled = true
port    = $SSH_PORT
logpath = /var/log/auth.log
EOF
systemctl enable --now fail2ban

# =============================================================================
# 6. UNATTENDED SECURITY UPDATES
# =============================================================================
log "6/9 — Auto security updates"
dpkg-reconfigure -f noninteractive unattended-upgrades

# =============================================================================
# 7. NODE.JS 20 (LTS)
# =============================================================================
log "7/9 — Node.js 20 + PM2"
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt-get install -y -qq nodejs
npm install -g pm2@latest

# PM2 startup cho user deploy
sudo -u "$DEPLOY_USER" bash -c 'pm2 startup systemd -u '"$DEPLOY_USER"' --hp /home/'"$DEPLOY_USER" || true
env PATH=$PATH:/usr/bin pm2 startup systemd -u "$DEPLOY_USER" --hp "/home/$DEPLOY_USER"

# =============================================================================
# 8. POSTGRESQL 16 + POSTGIS
# =============================================================================
log "8/9 — PostgreSQL 16 + PostGIS"

# PostgreSQL official repo
install -d /usr/share/postgresql-common/pgdg
curl -o /usr/share/postgresql-common/pgdg/apt.postgresql.org.asc \
  --fail https://www.postgresql.org/media/keys/ACCC4CF8.asc
echo "deb [signed-by=/usr/share/postgresql-common/pgdg/apt.postgresql.org.asc] \
  https://apt.postgresql.org/pub/repos/apt $VERSION_CODENAME-pgdg main" \
  > /etc/apt/sources.list.d/pgdg.list

apt-get update -qq
apt-get install -y -qq postgresql-16 postgresql-16-postgis-3 postgresql-contrib-16

systemctl enable --now postgresql

# Tạo DB + user (không idempotent-safe — chạy lại sẽ lỗi, đổi password thì DROP trước)
sudo -u postgres psql <<SQL
DO \$\$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = '$PG_DB_USER') THEN
    CREATE ROLE $PG_DB_USER WITH LOGIN PASSWORD '$PG_DB_PASS';
  END IF;
END
\$\$;
SQL

sudo -u postgres psql <<SQL
SELECT 'CREATE DATABASE $PG_DB_NAME OWNER $PG_DB_USER'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = '$PG_DB_NAME')\gexec
SQL

sudo -u postgres psql -d "$PG_DB_NAME" <<SQL
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS postgis_topology;
GRANT ALL ON SCHEMA public TO $PG_DB_USER;
SQL

log "  → DB: $PG_DB_NAME, User: $PG_DB_USER, PostGIS enabled"

# =============================================================================
# 9. NGINX + CERTBOT
# =============================================================================
log "9/9 — Nginx + Certbot (Let's Encrypt)"
apt-get install -y -qq nginx certbot python3-certbot-nginx
systemctl enable --now nginx

# Tắt default site
rm -f /etc/nginx/sites-enabled/default

# =============================================================================
# DONE
# =============================================================================
log "=========================================="
log "✅ VPS setup hoàn tất!"
log "=========================================="
echo ""
echo "Các bước tiếp theo:"
echo ""
echo "1. SSH bằng user mới (root đã bị disable):"
echo "   ssh -p $SSH_PORT $DEPLOY_USER@<VPS_IP>"
echo ""
echo "2. Test PostgreSQL:"
echo "   psql 'postgresql://$PG_DB_USER:$PG_DB_PASS@localhost:5432/$PG_DB_NAME' -c 'SELECT PostGIS_Version();'"
echo ""
echo "3. DNS — trỏ A record:"
echo "   $DOMAIN_FRONTEND → $(curl -s ifconfig.me)"
echo "   $DOMAIN_API      → $(curl -s ifconfig.me)"
echo ""
echo "4. Sau khi DNS propagated, chạy deploy:"
echo "   sudo -u $DEPLOY_USER bash deploy-chioi.sh"
echo ""
echo "5. SSL cert (chạy sau khi nginx config có):"
echo "   sudo certbot --nginx -d $DOMAIN_FRONTEND -d $DOMAIN_API \\"
echo "     --non-interactive --agree-tos --email $ADMIN_EMAIL"
echo ""
echo "Connection string DB (LƯU AN TOÀN):"
echo "  postgresql://$PG_DB_USER:$PG_DB_PASS@localhost:5432/$PG_DB_NAME"
