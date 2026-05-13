# Deploy Chị Ơi! lên VPS mới

> ⚠️ **Bối cảnh:** VPS cũ `45.119.83.233` đã bị nhiễm malware xmrig (Monero crypto miner) + đang bị brute force SSH liên tục. Tài liệu này hướng dẫn deploy sạch lên VPS mới.

---

## 📋 Yêu cầu VPS mới

| Item | Tối thiểu | Khuyến nghị |
|------|-----------|------------|
| OS | Ubuntu 22.04 | Ubuntu 24.04 LTS |
| RAM | 2 GB | 4 GB |
| Disk | 20 GB | 40 GB |
| CPU | 2 cores | 4 cores |
| Provider | bất kỳ | Vultr / DigitalOcean / Linode (tránh provider có nhiều abuse) |

---

## 🚀 Quy trình 3 bước

### Bước 1: Provision VPS mới + chuẩn bị credentials

```bash
# Trên máy local — sinh SSH key (nếu chưa có)
ssh-keygen -t ed25519 -C "deploy@chioi.vn" -f ~/.ssh/chioi_deploy

# In pubkey để paste vào setup script
cat ~/.ssh/chioi_deploy.pub

# Sinh DB password (32 chars random)
openssl rand -base64 24

# Sinh JWT secret (64 chars hex)
openssl rand -hex 32
```

Lưu 3 thứ trên vào password manager.

---

### Bước 2: Setup VPS (chạy 1 lần với root)

SSH lần đầu vào VPS mới với root password mà provider cấp:

```bash
ssh root@<NEW_VPS_IP>
```

Trên VPS mới, tải script setup + chạy với env vars:

```bash
# Tải script (option 1: clone repo)
git clone https://github.com/nathanha2808-hub/Ch-i-App.git /tmp/chioi-setup
cd /tmp/chioi-setup/deploy

# Hoặc option 2: download trực tiếp
# wget https://raw.githubusercontent.com/nathanha2808-hub/Ch-i-App/main/deploy/setup-fresh-vps.sh

# Set env vars (thay bằng giá trị thật)
export DEPLOY_USER="chioi"
export DEPLOY_USER_PUBKEY="ssh-ed25519 AAAA... deploy@chioi.vn"   # Pubkey từ Bước 1
export PG_DB_PASS="generated_db_password_here"                     # Từ Bước 1
export DOMAIN_FRONTEND="chioi.vn"
export DOMAIN_API="api.chioi.vn"
export ADMIN_EMAIL="your-email@example.com"
export TIMEZONE="Asia/Ho_Chi_Minh"

# Chạy setup
sudo -E bash setup-fresh-vps.sh
```

Script sẽ làm:
1. Update OS + cài deps cơ bản
2. Tạo non-root user `chioi` với SSH key
3. **Disable root SSH + password auth** (chỉ key auth)
4. UFW firewall (chỉ 22/80/443)
5. fail2ban (ban IP brute force)
6. Auto security updates
7. Cài Node.js 20 + PM2
8. Cài PostgreSQL 16 + PostGIS, tạo DB `chioi_db` + user `chioi_user`
9. Cài Nginx + Certbot

⚠️ **Sau khi setup xong, root SSH bị disable**. SSH lần sau:
```bash
ssh -i ~/.ssh/chioi_deploy chioi@<NEW_VPS_IP>
```

---

### Bước 3: Trỏ DNS + Deploy app

#### 3a. Trỏ DNS

Trong DNS provider của `chioi.vn`, tạo A records:
```
chioi.vn          → <NEW_VPS_IP>     (TTL 300)
www.chioi.vn      → <NEW_VPS_IP>     (TTL 300)
api.chioi.vn      → <NEW_VPS_IP>     (TTL 300)
```

Đợi propagated (5-30 phút). Verify:
```bash
dig +short chioi.vn @8.8.8.8
dig +short api.chioi.vn @8.8.8.8
```

#### 3b. Deploy code

SSH bằng user `chioi`:
```bash
ssh -i ~/.ssh/chioi_deploy chioi@<NEW_VPS_IP>
```

Chạy deploy script:
```bash
# Set env vars (DB password + JWT secret từ Bước 1)
export PG_DB_PASS="same_db_password_as_step2"
export JWT_SECRET="64_char_hex_secret"
export DOMAIN_FRONTEND="chioi.vn"
export DOMAIN_API="api.chioi.vn"
export ADMIN_EMAIL="your-email@example.com"
export REPO_BRANCH="main"   # hoặc fix/restore-hardening-and-bugs nếu chưa merge

# Chạy deploy
bash /tmp/chioi-setup/deploy/deploy-chioi.sh
```

Script sẽ làm:
1. Clone repo về `/opt/chioi`
2. Backend: `npm ci` + `prisma migrate deploy` + `npm run build`
3. PM2 start `chioi-backend` (auto-restart, max-mem 500M)
4. Frontend: copy `frontend/` → `/var/www/chioi.vn/`
5. Nginx config 2 site (chioi.vn + api.chioi.vn)
6. In hướng dẫn chạy Certbot SSL

#### 3c. SSL (sau khi DNS đã propagated)

```bash
sudo certbot --nginx \
  -d chioi.vn -d www.chioi.vn -d api.chioi.vn \
  --non-interactive --agree-tos --email your-email@example.com --redirect
```

#### 3d. Verify

```bash
# Backend health
pm2 list
pm2 logs chioi-backend --lines 50

# API test (sau SSL)
curl -i https://api.chioi.vn/api/docs
curl -X POST https://api.chioi.vn/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"phone":"0901234567","password":"test"}'

# Frontend
curl -I https://chioi.vn

# DB
psql "postgresql://chioi_user:$PG_DB_PASS@localhost:5432/chioi_db" \
  -c "SELECT PostGIS_Version();"
```

---

## 🔄 Update sau này

```bash
# SSH bằng user chioi
ssh chioi@chioi.vn

# Pull + rebuild + restart
cd /opt/chioi
git pull origin main
cd backend
npm ci
npm run build
pm2 restart chioi-backend

# Frontend (static):
sudo cp -r /opt/chioi/frontend/* /var/www/chioi.vn/
```

Hoặc dùng GitHub Actions để auto-deploy (xem `.github/workflows/deploy.yml` — chưa có, có thể thêm sau).

---

## 🔐 Bảo mật — checklist sau deploy

- [ ] SSH key authentication only (đã làm trong setup script)
- [ ] Root SSH disabled (đã làm)
- [ ] UFW firewall enabled (đã làm)
- [ ] fail2ban active (đã làm)
- [ ] Auto security updates enabled (đã làm)
- [ ] PostgreSQL chỉ listen `127.0.0.1` (default, đã đảm bảo)
- [ ] `.env` permissions = 600, owner = chioi (đã set trong script)
- [ ] Backup DB cron (CHƯA — set thủ công):
  ```bash
  # crontab -e (user chioi)
  0 3 * * * pg_dump -h localhost -U chioi_user chioi_db | gzip > /opt/chioi/backups/chioi_$(date +\%F).sql.gz
  ```
- [ ] Monitor uptime (gắn thêm UptimeRobot / Hetrix)
- [ ] Khi swap SMS/KYC/Payment provider → đổi `.env` + `pm2 restart`

---

## 🆘 Troubleshooting

### Backend không start
```bash
pm2 logs chioi-backend --err --lines 100
# Check .env values
sudo cat /opt/chioi/backend/.env
# Check DB connection
psql "$(grep DATABASE_URL /opt/chioi/backend/.env | cut -d'=' -f2- | tr -d '"')" -c '\dt'
```

### Nginx 502 Bad Gateway
```bash
# Backend đang chạy?
pm2 list
curl http://127.0.0.1:3000/api/docs

# Nginx upstream đúng port?
sudo grep proxy_pass /etc/nginx/sites-enabled/chioi
sudo nginx -t
```

### SSL cert fail
```bash
# DNS đã propagated chưa?
dig +short chioi.vn @8.8.8.8

# Certbot dry-run trước
sudo certbot certonly --nginx -d chioi.vn --dry-run
```

### Bị lock SSH (mất key, fail2ban ban IP)
- Vào VPS console qua web UI provider (out-of-band)
- Sửa `/etc/ssh/sshd_config` (tạm bật PasswordAuthentication=yes)
- Hoặc unban IP: `sudo fail2ban-client unban <IP>`

---

## 📞 Support

- Repo: https://github.com/nathanha2808-hub/Ch-i-App
- Issue tracker: GitHub Issues
- Docs khác: `docs/ARCHITECTURE.md`, `docs/SECURITY.md`, `docs/DATABASE.md`
