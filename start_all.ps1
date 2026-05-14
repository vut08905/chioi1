# Script khoi dong tat ca moi truong cho du an Chi Oi!
# Project root: d:\Chi_oi-main

$projectRoot = "d:\Chi_oi-main"
$backendDir = "$projectRoot\backend"
$frontendDir = "$projectRoot\frontend"

# Lay IP LAN (WiFi) de truy cap tu dien thoai
$lanIP = (Get-NetIPAddress -AddressFamily IPv4 | Where-Object { $_.IPAddress -like '192.168.*' -or $_.IPAddress -like '10.*' } | Select-Object -First 1).IPAddress
if (-not $lanIP) { $lanIP = "localhost" }

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  CHI OI! - KHOI DONG HE THONG" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

# -------------------------------------------------------
# 1. DATABASE (PostgreSQL qua WSL)
# -------------------------------------------------------
Write-Host ""
Write-Host "[1/4] Khoi dong PostgreSQL trong WSL (Ubuntu)..." -ForegroundColor Yellow
Start-Process "wsl.exe" -ArgumentList "-d Ubuntu", "-e", "tail", "-f", "/dev/null" -WindowStyle Hidden
wsl -d Ubuntu -e sudo service postgresql start
if ($LASTEXITCODE -eq 0) {
    Write-Host "     PostgreSQL OK!" -ForegroundColor Green
}
else {
    Write-Host "     [CANH BAO] Khoi dong PostgreSQL that bai. Kiem tra WSL." -ForegroundColor Red
}

# -------------------------------------------------------
# 2. MO FIREWALL (cho phep truy cap tu LAN/WiFi)
# -------------------------------------------------------
Write-Host ""
Write-Host "[2/4] Mo firewall cho port 3000 va 8080 (LAN access)..." -ForegroundColor Yellow
try {
    # Xoa rule cu neu co
    Remove-NetFirewallRule -DisplayName "ChiOi Backend 3000" -ErrorAction SilentlyContinue
    Remove-NetFirewallRule -DisplayName "ChiOi Frontend 8080" -ErrorAction SilentlyContinue
    # Tao rule moi
    New-NetFirewallRule -DisplayName "ChiOi Backend 3000" -Direction Inbound -Protocol TCP -LocalPort 3000 -Action Allow -Profile Any | Out-Null
    New-NetFirewallRule -DisplayName "ChiOi Frontend 8080" -Direction Inbound -Protocol TCP -LocalPort 8080 -Action Allow -Profile Any | Out-Null
    Write-Host "     Firewall OK! Port 3000 + 8080 da mo." -ForegroundColor Green
} catch {
    Write-Host "     [CANH BAO] Khong the mo firewall. Hay chay script voi quyen Admin (Run as Administrator)." -ForegroundColor Red
    Write-Host "     Neu khong mo duoc, chay thu cong:" -ForegroundColor Red
    Write-Host "       netsh advfirewall firewall add rule name='ChiOi Backend' dir=in action=allow protocol=TCP localport=3000" -ForegroundColor DarkYellow
    Write-Host "       netsh advfirewall firewall add rule name='ChiOi Frontend' dir=in action=allow protocol=TCP localport=8080" -ForegroundColor DarkYellow
}

# -------------------------------------------------------
# 3. BACKEND (NestJS - port 3000, bind 0.0.0.0)
# -------------------------------------------------------
Write-Host ""
Write-Host "[3/4] Khoi dong Backend NestJS (port 3000, bind 0.0.0.0)..." -ForegroundColor Yellow
Start-Process "powershell.exe" `
    -ArgumentList "-NoExit", "-Command", "cd '$backendDir'; npm run start:dev" `
    -WindowStyle Normal

# -------------------------------------------------------
# 4. FRONTEND (http-server - port 8080, bind 0.0.0.0)
# -------------------------------------------------------
Write-Host ""
Write-Host "[4/4] Khoi dong Frontend Web Server (port 8080, bind 0.0.0.0)..." -ForegroundColor Yellow
Start-Process "powershell.exe" `
    -ArgumentList "-NoExit", "-Command", "cd '$frontendDir'; npx http-server -a 0.0.0.0 -p 8080 -c-1 --cors" `
    -WindowStyle Normal

# -------------------------------------------------------
# THONG TIN TRUY CAP
# -------------------------------------------------------
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  HOAN TAT! Cac server dang khoi dong  " -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "--- TRUY CAP TU MAY TINH (localhost) ---" -ForegroundColor White
Write-Host "Khach hang : http://localhost:8080/khachhang/dangnhap.html" -ForegroundColor Yellow
Write-Host "Giup viec  : http://localhost:8080/giupviec/dangnhaptasker.html" -ForegroundColor Yellow
Write-Host "Admin      : http://localhost:8080/admin/bangdieukhien.html" -ForegroundColor Yellow
Write-Host "Backend API: http://localhost:3000/api" -ForegroundColor Magenta
Write-Host ""
Write-Host "--- TRUY CAP TU DIEN THOAI (cung WiFi) ---" -ForegroundColor White
Write-Host "  IP LAN cua ban: $lanIP" -ForegroundColor Cyan
Write-Host "Khach hang : http://${lanIP}:8080/khachhang/dangnhap.html" -ForegroundColor Yellow
Write-Host "Giup viec  : http://${lanIP}:8080/giupviec/dangnhaptasker.html" -ForegroundColor Yellow
Write-Host "Admin      : http://${lanIP}:8080/admin/bangdieukhien.html" -ForegroundColor Yellow
Write-Host ""
Write-Host "--- TAI KHOAN DEMO ---" -ForegroundColor White
Write-Host "  [KHACH HANG] SDT: 0901234567  | Mat khau: 123456"   -ForegroundColor Green
Write-Host "  [TASKER    ] SDT: 0909876543  | Mat khau: 123456"  -ForegroundColor Green
Write-Host "  [ADMIN     ] SDT: 0666666666  | Mat khau: admin123456"   -ForegroundColor Red
Write-Host ""
Write-Host "  Luu y: Hay dam bao dien thoai va may tinh cung mang WiFi!" -ForegroundColor DarkYellow
Write-Host "========================================" -ForegroundColor Cyan
