#!/bin/bash
# Setup script for Chi Oi! VPS deployment

set -e

echo "=== Setting up PostgreSQL ==="
sudo -u postgres psql -c "CREATE USER chioi_user WITH PASSWORD 'ChiOi2026Secure';" 2>/dev/null || echo "User already exists"
sudo -u postgres psql -c "CREATE DATABASE chioi_db OWNER chioi_user;" 2>/dev/null || echo "Database already exists"
sudo -u postgres psql -d chioi_db -c "CREATE EXTENSION IF NOT EXISTS postgis;" 2>/dev/null || echo "PostGIS already enabled"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE chioi_db TO chioi_user;"

# Allow password auth for local connections
sudo sed -i 's/local\s\+all\s\+all\s\+peer/local   all             all                                     md5/' /etc/postgresql/16/main/pg_hba.conf
sudo systemctl restart postgresql

echo "=== Cloning repository ==="
cd /opt
rm -rf chioi 2>/dev/null || true
git clone https://github.com/vut08905/chioi1.git chioi
cd /opt/chioi

echo "=== Setting up Backend ==="
cd /opt/chioi/backend

# Create .env file
cat > .env << 'ENVFILE'
DATABASE_URL="postgresql://chioi_user:ChiOi2026Secure@localhost:5432/chioi_db?schema=public"
JWT_SECRET="chioi-jwt-secret-vuxuantoan-2026-production"
PORT=3000
NODE_ENV=production
ENVFILE

npm install
npx prisma generate
npx prisma db push --accept-data-loss
npm run build

echo "=== Seeding database ==="
# Create admin user with bcrypt hash
node -e "
const bcrypt = require('bcrypt');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function seed() {
  // Admin
  const adminHash = await bcrypt.hash('admin123456', 10);
  const admin = await prisma.users.upsert({
    where: { phone: '0666666666' },
    update: {},
    create: { phone: '0666666666', password_hash: adminHash, full_name: 'Admin Quan Tri', role: 'ADMIN', status: 'ACTIVE' }
  });
  await prisma.admins.upsert({
    where: { admin_id: admin.user_id },
    update: {},
    create: { admin_id: admin.user_id, department: 'Ban Giam Doc', access_level: 'SUPER_ADMIN' }
  });

  // Customer
  const custHash = await bcrypt.hash('123456', 10);
  const cust = await prisma.users.upsert({
    where: { phone: '0901234567' },
    update: {},
    create: { phone: '0901234567', password_hash: custHash, full_name: 'Khach Hang VIP', role: 'CUSTOMER', status: 'ACTIVE' }
  });
  await prisma.customers.upsert({
    where: { customer_id: cust.user_id },
    update: {},
    create: { customer_id: cust.user_id, default_address: 'Vinhomes Central Park, Binh Thanh', loyalty_points: 150 }
  });

  // Create wallet for customer
  await prisma.wallets.upsert({
    where: { user_id: cust.user_id },
    update: {},
    create: { user_id: cust.user_id, balance: 5000000 }
  });

  // Tasker
  const taskerHash = await bcrypt.hash('123456', 10);
  const tasker = await prisma.users.upsert({
    where: { phone: '0909876543' },
    update: {},
    create: { phone: '0909876543', password_hash: taskerHash, full_name: 'Chi Lan Don Nha', role: 'TASKER', status: 'ACTIVE' }
  });
  await prisma.taskers.upsert({
    where: { tasker_id: tasker.user_id },
    update: {},
    create: { tasker_id: tasker.user_id, bio: 'Kinh nghiem 5 nam', kyc_status: 'VERIFIED', average_rating: 4.9, total_jobs: 120, is_online: true }
  });

  // Create wallet for tasker
  await prisma.wallets.upsert({
    where: { user_id: tasker.user_id },
    update: {},
    create: { user_id: tasker.user_id, balance: 2000000 }
  });

  // Services
  const services = [
    { name: 'Don dep nha cua', description: 'Don dep tieu chuan 2 gio', base_price: 150000, icon_url: 'icon_cleaning.png' },
    { name: 'Trong tre', description: 'Giu tre so sinh va tre nho', base_price: 200000, icon_url: 'icon_babysitting.png' },
    { name: 'Nau an', description: 'Nau an gia dinh 3-4 nguoi', base_price: 180000, icon_url: 'icon_cooking.png' },
    { name: 'Di cho', description: 'Mua ho thuc pham theo yeu cau', base_price: 100000, icon_url: 'icon_shopping.png' },
    { name: 'Mua ho WinMart', description: 'Mua ho hang hoa tai WinMart', base_price: 120000, icon_url: 'icon_winmart.png' },
  ];
  for (const svc of services) {
    await prisma.services.upsert({
      where: { name: svc.name },
      update: {},
      create: svc
    });
  }

  console.log('Seed completed!');
  await prisma.\$disconnect();
}
seed().catch(console.error);
"

echo "=== Starting Backend with PM2 ==="
pm2 delete chioi-backend 2>/dev/null || true
pm2 start dist/src/main.js --name chioi-backend
pm2 save

echo "=== Setting up Nginx ==="
cat > /etc/nginx/sites-available/chioi << 'NGINX'
server {
    listen 80;
    server_name vuxuantoan.com www.vuxuantoan.com 188.166.210.73;

    # Frontend static files
    root /opt/chioi/frontend;
    index index.html;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;

    # API proxy to NestJS backend
    location /api/ {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Socket.IO WebSocket
    location /socket.io/ {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }

    # Frontend routes
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Cache static assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 7d;
        add_header Cache-Control "public, immutable";
    }
}
NGINX

ln -sf /etc/nginx/sites-available/chioi /etc/nginx/sites-enabled/chioi
rm -f /etc/nginx/sites-enabled/default
nginx -t && systemctl restart nginx

echo "=== Setting up PM2 startup ==="
pm2 startup systemd -u root --hp /root
pm2 save

echo ""
echo "============================================"
echo "  DEPLOY THANH CONG! Chi Oi! da len VPS"
echo "============================================"
echo "  Web: http://vuxuantoan.com"
echo "  IP:  http://188.166.210.73"
echo "  API: http://vuxuantoan.com/api"
echo "============================================"
