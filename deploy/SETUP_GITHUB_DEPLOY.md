# Setup GitHub Actions auto-deploy

> Sau khi setup, mỗi `git push` lên `main` hoặc `fix/*` branch sẽ TỰ ĐỘNG deploy lên VPS — không cần SSH manual.

## Quy trình 1 lần (5 phút)

### Bước 1: Generate SSH key dành riêng cho GitHub Actions

Trên máy local hoặc VPS console:

```bash
ssh-keygen -t ed25519 -C "github-actions@chioi.vn" -f ~/.ssh/chioi_gh_actions -N ""
# Output:
#   ~/.ssh/chioi_gh_actions       (private key — sẽ paste vào GitHub Secrets)
#   ~/.ssh/chioi_gh_actions.pub   (public key — sẽ paste vào VPS authorized_keys)
```

### Bước 2: Add public key vào VPS

SSH vào VPS (qua mobile/console nếu IP local bị fail2ban):

```bash
# Trên VPS — add public key
cat >> /root/.ssh/authorized_keys <<'PUBKEY'
<paste nội dung file ~/.ssh/chioi_gh_actions.pub vào đây>
PUBKEY

# Verify
tail -1 /root/.ssh/authorized_keys
```

### Bước 3: Add secrets vào GitHub repo

1. Mở https://github.com/nathanha2808-hub/Ch-i-App/settings/secrets/actions
2. Click **New repository secret** cho mỗi cái:

| Secret name | Value | Ví dụ |
|-------------|-------|-------|
| `VPS_HOST` | IP hoặc domain VPS | `45.119.83.233` |
| `VPS_USER` | User SSH | `root` |
| `VPS_SSH_PORT` | Port SSH (optional, default 22) | `22` |
| `VPS_SSH_PRIVATE_KEY` | **Toàn bộ nội dung** file `~/.ssh/chioi_gh_actions` (private key) | `-----BEGIN OPENSSH PRIVATE KEY-----\n...\n-----END OPENSSH PRIVATE KEY-----` |
| `VPS_DEPLOY_PATH` | (optional, default `/opt/chioi`) | `/opt/chioi` |

⚠️ **`VPS_SSH_PRIVATE_KEY`** phải là **TOÀN BỘ FILE** kể cả dòng `-----BEGIN ...-----` và `-----END ...-----`.

### Bước 4: Trigger lần đầu

```bash
# Local — tạo commit nhỏ để trigger workflow
git commit --allow-empty -m "ci: trigger deploy workflow"
git push origin fix/restore-hardening-and-bugs
```

Mở https://github.com/nathanha2808-hub/Ch-i-App/actions → xem workflow chạy.

### Bước 5: Verify

Workflow xong → check VPS:
```bash
ssh root@chioi.vn 'pm2 list | grep chioi-backend'
curl -i https://chioi.vn/api/docs
```

---

## Cách dùng từ giờ

Mỗi lần push code:
```bash
git push origin fix/restore-hardening-and-bugs
```

→ GitHub Actions runner (Microsoft Azure IP, KHÔNG bị fail2ban):
1. SSH vào VPS bằng key đã setup
2. Pull code mới
3. `npm ci` + `prisma generate` + build
4. Copy frontend → /var/www
5. `pm2 restart chioi-backend`
6. Health check

Toàn bộ ~3-5 phút. Status hiển thị trong Actions tab + email nếu fail.

---

## Manual trigger

Cần re-deploy mà không có push mới:
1. Mở https://github.com/nathanha2808-hub/Ch-i-App/actions/workflows/deploy.yml
2. Click **Run workflow** → chọn branch → Run

---

## Troubleshooting

### Deploy fail "Permission denied (publickey)"
- Public key chưa add đúng vào `/root/.ssh/authorized_keys`
- Hoặc SSH server reject vì `PermitRootLogin no` — verify `/etc/ssh/sshd_config`
- Test local: `ssh -i ~/.ssh/chioi_gh_actions root@45.119.83.233 'echo OK'`

### Deploy fail "Host key verification failed"
- ssh-keyscan trong workflow có thể fail nếu SSH port custom — set `VPS_SSH_PORT` secret
- Verify: `ssh-keyscan -p 22 45.119.83.233`

### Workflow timeout
- Build NestJS chậm → tăng `timeout-minutes: 30` trong `.github/workflows/deploy.yml`
- Hoặc thêm cache `node_modules` qua `actions/cache@v4`

### `pm2 restart` báo "process not found"
- `pm2 startup` chưa setup permanent — chạy 1 lần trên VPS:
  ```bash
  pm2 startup systemd -u root --hp /root
  pm2 save
  ```

### Cần rollback nhanh
```bash
ssh root@chioi.vn
cd /opt/chioi
git log --oneline -5  # tìm commit muốn rollback
git reset --hard <commit-hash>
cd backend && npm run build && pm2 restart chioi-backend
```

---

## Bảo mật

- Private key chỉ có quyền: `chmod 600 ~/.ssh/chioi_gh_actions`
- KHÔNG commit private key vào repo (đã có .gitignore cho `*.pem`, `*.key`)
- KHÔNG share secrets qua chat / email (chỉ paste trực tiếp vào GitHub Secrets UI)
- Defense-in-depth: add `from="0.0.0.0/0,!banned-ips"` trong authorized_keys nếu muốn restrict IP

---

## Đẩy thêm features

Workflow hiện tại deploy backend + frontend. Có thể mở rộng:

- **Run tests trước deploy**: thêm step `npm test` trước build
- **Notify Slack/Discord/Telegram**: thêm step gửi webhook khi deploy success/fail
- **Auto-rollback** nếu health check fail: thêm `git reset --hard HEAD~1` trong failure step
- **Database migration check**: thêm `npx prisma migrate status` trước deploy
- **Build APK release** khi tag `v*`: thêm job `build-apk` chạy bubblewrap + upload artifact
