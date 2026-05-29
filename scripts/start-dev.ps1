# HRMS Dev Stack Startup Script
# Usage: .\scripts\start-dev.ps1
# Starts: PostgreSQL, Next.js (port 3000), NestJS API (port 3001)

$root = Split-Path -Parent $PSScriptRoot
$pgBin  = "$PSScriptRoot\node_modules\@embedded-postgres\windows-x64\native\bin"
$pgData = "$PSScriptRoot\pgdata"
$pgLog  = "$PSScriptRoot\postgres.log"

# --- PostgreSQL ---
$pgRunning = Test-NetConnection -ComputerName localhost -Port 5432 -WarningAction SilentlyContinue
if ($pgRunning.TcpTestSucceeded) {
    Write-Host "[pg] Already running on port 5432" -ForegroundColor Green
} else {
    Write-Host "[pg] Starting PostgreSQL 16..." -ForegroundColor Cyan
    & "$pgBin\pg_ctl.exe" -D $pgData -l $pgLog -o "-p 5432" start
    Start-Sleep -Seconds 3
    Write-Host "[pg] Started" -ForegroundColor Green
}

# --- Environment ---
$env:DATABASE_URL  = "postgresql://hrms:hrms_secret@localhost:5432/hrms?schema=public"
$env:REDIS_URL     = "redis://localhost:6379"
$env:JWT_ACCESS_SECRET  = "hrms_dev_access_secret_minimum_32_chars_ok"
$env:JWT_REFRESH_SECRET = "hrms_dev_refresh_secret_minimum_32_chars_ok"
$env:ENCRYPTION_KEY     = "hrms_dev_enc_key_32chars_12345678!"
$env:NODE_ENV           = "development"

# --- API (background) ---
Write-Host "[api] Starting NestJS API on port 3001..." -ForegroundColor Cyan
$apiJob = Start-Process -FilePath "powershell.exe" -ArgumentList "-NoProfile -Command `"cd '$root'; pnpm --filter @hrms/api dev`"" -PassThru -WindowStyle Minimized

# --- Web (foreground in new window) ---
Write-Host "[web] Starting Next.js on port 3000..." -ForegroundColor Cyan
Start-Process -FilePath "powershell.exe" -ArgumentList "-NoProfile -Command `"cd '$root'; pnpm --filter @hrms/web dev`"" -WindowStyle Normal

Write-Host ""
Write-Host "Services starting. Access points:" -ForegroundColor Yellow
Write-Host "  Web UI:  http://localhost:3000" -ForegroundColor White
Write-Host "  API:     http://localhost:3001/api/docs" -ForegroundColor White
Write-Host "  Health:  http://localhost:3001/api/health" -ForegroundColor White
Write-Host ""
Write-Host "Demo credentials: admin@hrms.local / Admin@123!" -ForegroundColor Yellow
