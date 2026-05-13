# Script khoi dong tat ca moi truong cho du an Chi Oi!

$projectRoot = "d:\chioi2"

# ----------------------------------------
# 0. DON DEP PORT CU (tranh EADDRINUSE)
# ----------------------------------------
Write-Host "Dang don dep cac process cu tren port 3000 va 8080..." -ForegroundColor DarkGray
$ports = @(3000, 8080)
foreach ($port in $ports) {
    $pids = (Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue).OwningProcess
    foreach ($pid in $pids) {
        if ($pid -and $pid -ne 0) {
            Stop-Process -Id $pid -Force -ErrorAction SilentlyContinue
            Write-Host "  Da kill process $pid dang chiem port $port." -ForegroundColor DarkYellow
        }
    }
}

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "1. KIEM TRA VA KHOI DONG DATABASE" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Dang duy tri WSL Ubuntu luon thuc (Keep-alive)..." -ForegroundColor Yellow
Start-Process "wsl.exe" -ArgumentList "-d Ubuntu", "-e", "tail", "-f", "/dev/null" -WindowStyle Hidden

Write-Host "Dang bat PostgreSQL trong WSL (Ubuntu)..." -ForegroundColor Yellow
wsl -d Ubuntu -e sudo service postgresql start
if ($LASTEXITCODE -eq 0) {
    Write-Host "Khoi dong PostgreSQL thanh cong!" -ForegroundColor Green
}
else {
    Write-Host "Co loi xay ra khi bat PostgreSQL trong WSL." -ForegroundColor Red
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "2. KHOI DONG CAC MOI TRUONG WEB VA APP" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

# Kiem tra node_modules backend
if (-not (Test-Path "$projectRoot\backend\node_modules")) {
    Write-Host "  [!] Chua co node_modules. Dang chay npm install cho backend..." -ForegroundColor DarkYellow
    Push-Location "$projectRoot\backend"
    npm install
    Pop-Location
}

# Generate Prisma Client neu chua co
$prismaClientPath = "$projectRoot\backend\node_modules\.prisma\client"
if (-not (Test-Path $prismaClientPath)) {
    Write-Host "  [!] Chua co Prisma Client. Dang chay prisma generate..." -ForegroundColor DarkYellow
    Push-Location "$projectRoot\backend"
    npx prisma generate --schema=prisma/schema.prisma
    Pop-Location
    Write-Host "  Prisma Client da duoc generate!" -ForegroundColor Green
}

Write-Host "Dang khoi dong Backend (NestJS)..." -ForegroundColor Green
Start-Process "powershell.exe" -ArgumentList "-NoExit", "-Command", "cd $projectRoot\backend; npm run start:dev" -WindowStyle Normal

Write-Host "Dang khoi dong Web Server Goc (chua Admin, Khach Hang, Giup Viec)..." -ForegroundColor Green
Start-Process "powershell.exe" -ArgumentList "-NoExit", "-Command", "cd $projectRoot\frontend; npx http-server -p 8080 -c-1" -WindowStyle Normal

# Write-Host "Dang khoi dong Mobile/Web Flutter (Customer)..." -ForegroundColor Green
# Start-Process "powershell.exe" -ArgumentList "-NoExit", "-Command", "cd $projectRoot\chioi_customer; flutter run -d chrome" -WindowStyle Normal

Write-Host ""
Write-Host "Hoan tat! Cac cua so terminal moi da duoc mo cho tung moi truong." -ForegroundColor Cyan
Write-Host "--- Huong dan truy cap Web ---" -ForegroundColor White
Write-Host "Khach hang: http://127.0.0.1:8080/khachhang/dangnhap.html" -ForegroundColor Yellow
Write-Host "Giup viec:  http://127.0.0.1:8080/giupviec/dangnhaptasker.html" -ForegroundColor Yellow
Write-Host "Admin:      http://127.0.0.1:8080/admin/bangdieukhien.html" -ForegroundColor Yellow
Write-Host "------------------------------" -ForegroundColor White
