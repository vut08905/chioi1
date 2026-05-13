# Script khoi dong tat ca moi truong cho du an Chi Oi!
# Project root: d:\Download\Chi_Oi

$projectRoot = "d:\Chi_oi-main"
$backendDir = "$projectRoot\backend"
$frontendDir = "$projectRoot\frontend"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  CHI OI! - KHOI DONG HE THONG" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

# -------------------------------------------------------
# 1. DATABASE (PostgreSQL qua WSL)
# -------------------------------------------------------
Write-Host ""
Write-Host "[1/3] Khoi dong PostgreSQL trong WSL (Ubuntu)..." -ForegroundColor Yellow
Start-Process "wsl.exe" -ArgumentList "-d Ubuntu", "-e", "tail", "-f", "/dev/null" -WindowStyle Hidden
wsl -d Ubuntu -e sudo service postgresql start
if ($LASTEXITCODE -eq 0) {
    Write-Host "     PostgreSQL OK!" -ForegroundColor Green
}
else {
    Write-Host "     [CANH BAO] Khoi dong PostgreSQL that bai. Kiem tra WSL." -ForegroundColor Red
}

# -------------------------------------------------------
# 2. BACKEND (NestJS - port 3000)
# -------------------------------------------------------
Write-Host ""
Write-Host "[2/3] Khoi dong Backend NestJS (port 3000)..." -ForegroundColor Yellow
Start-Process "powershell.exe" `
    -ArgumentList "-NoExit", "-Command", "cd '$backendDir'; npm run start:dev" `
    -WindowStyle Normal

# -------------------------------------------------------
# 3. FRONTEND (http-server - port 8080)
# -------------------------------------------------------
Write-Host ""
Write-Host "[3/3] Khoi dong Frontend Web Server (port 8080)..." -ForegroundColor Yellow
Start-Process "powershell.exe" `
    -ArgumentList "-NoExit", "-Command", "cd '$frontendDir'; npx http-server -p 8080 -c-1 --cors" `
    -WindowStyle Normal

# -------------------------------------------------------
# THONG TIN TRUY CAP
# -------------------------------------------------------
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  HOAN TAT! Cac server dang khoi dong  " -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "--- URL TRUY CAP ---" -ForegroundColor White
Write-Host "Khach hang : http://localhost:8080/khachhang/dangnhap.html" -ForegroundColor Yellow
Write-Host "Giup viec  : http://localhost:8080/giupviec/dangnhaptasker.html" -ForegroundColor Yellow
Write-Host "Admin      : http://localhost:8080/admin/bangdieukhien.html" -ForegroundColor Yellow
Write-Host "Backend API: http://localhost:3000/api" -ForegroundColor Magenta
Write-Host ""
Write-Host "--- TAI KHOAN DEMO (mat khau: 123456) ---" -ForegroundColor White
Write-Host "  [KHACH HANG] SDT: 0901234567  | Ho ten: Khach Hang VIP"   -ForegroundColor Green
Write-Host "  [TASKER    ] SDT: 0909876543  | Ho ten: Chi Lan Don Nha"  -ForegroundColor Green
Write-Host "  [TASKER 2  ] SDT: 0901112222  | Ho ten: Nguyen Lan"       -ForegroundColor Green
Write-Host "  [ADMIN     ] SDT: 0901111111  | Ho ten: Admin Quan Tri"   -ForegroundColor Red
Write-Host ""
Write-Host "  So du vi mau: Khach hang = 5,000,000 VND" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
