# ============================================
# Operation: Laser Birthday — Windows Install Script
# Run as Administrator: powershell -ExecutionPolicy Bypass -File install.ps1
# ============================================

param(
    [string]$InstallDir = "C:\laser-birthday",
    [int]$Port = 3000
)

$ErrorActionPreference = "Stop"

Write-Host ""
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "  Installing Operation: Laser Birthday" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""

# --- Check for Node.js ---
try {
    $nodeVersion = & node -v 2>$null
    Write-Host "[OK] Node $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "[ERROR] Node.js is not installed. Install Node 20+ first." -ForegroundColor Red
    Write-Host "  Download: https://nodejs.org/" -ForegroundColor Yellow
    exit 1
}

# --- Check for PM2 ---
$pm2Path = & where.exe pm2 2>$null
if (-not $pm2Path) {
    Write-Host "[INFO] Installing PM2 globally..." -ForegroundColor Yellow
    & npm install -g pm2
}
$pm2Version = & pm2 -v 2>$null
Write-Host "[OK] PM2 $pm2Version" -ForegroundColor Green

# --- Determine source directory (where the zip was extracted) ---
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path

# --- Copy files to install directory ---
if (Test-Path $InstallDir) {
    Write-Host "[INFO] Updating existing installation at $InstallDir..." -ForegroundColor Yellow
} else {
    Write-Host "[INFO] Creating $InstallDir..." -ForegroundColor Yellow
    New-Item -ItemType Directory -Path $InstallDir -Force | Out-Null
}

# Copy everything except node_modules, .git, .env
$exclude = @("node_modules", ".git", ".env", "install.ps1")
Get-ChildItem -Path $ScriptDir -Exclude $exclude | ForEach-Object {
    if ($_.PSIsContainer) {
        Copy-Item -Path $_.FullName -Destination (Join-Path $InstallDir $_.Name) -Recurse -Force
    } else {
        Copy-Item -Path $_.FullName -Destination $InstallDir -Force
    }
}
Write-Host "[OK] Files copied to $InstallDir" -ForegroundColor Green

# --- Install production dependencies ---
Write-Host "[INFO] Installing dependencies..." -ForegroundColor Yellow
Push-Location $InstallDir
& npm install --omit=dev
Pop-Location
Write-Host "[OK] Dependencies installed" -ForegroundColor Green

# --- Create .env if it doesn't exist ---
$envFile = Join-Path $InstallDir ".env"
if (-not (Test-Path $envFile)) {
    @"
PORT=$Port

# Microsoft Graph API — Azure AD App Registration
# Get these from the Azure AD app registration (shared with skitabor.com)
GRAPH_TENANT_ID=your-tenant-id
GRAPH_CLIENT_ID=your-client-id
GRAPH_CLIENT_SECRET=your-client-secret
SEND_FROM_EMAIL=birthday@coltonessig.com

# Forward incoming emails from birthday@ to your personal email
FORWARD_TO_EMAIL=jason.m.essig@gmail.com
"@ | Out-File -FilePath $envFile -Encoding utf8
    Write-Host ""
    Write-Host "[IMPORTANT] Created $envFile" -ForegroundColor Yellow
    Write-Host "  Edit this file and fill in the Graph credentials!" -ForegroundColor Yellow
    Write-Host ""
} else {
    Write-Host "[OK] .env already exists" -ForegroundColor Green
}

# --- Start or restart with PM2 ---
$pm2Status = & pm2 describe laser-birthday 2>$null
if ($LASTEXITCODE -eq 0) {
    Write-Host "[INFO] Restarting laser-birthday..." -ForegroundColor Yellow
    & pm2 restart laser-birthday
} else {
    Write-Host "[INFO] Starting laser-birthday on port $Port..." -ForegroundColor Yellow
    Push-Location $InstallDir
    & pm2 start server.js --name laser-birthday --node-args="--env-file=.env"
    Pop-Location
}

& pm2 save

Write-Host ""
Write-Host "==========================================" -ForegroundColor Green
Write-Host "  INSTALLED SUCCESSFULLY" -ForegroundColor Green
Write-Host "  Local:  http://localhost:$Port" -ForegroundColor Green
Write-Host "  Public: https://birthday.coltonessig.com" -ForegroundColor Green
Write-Host "==========================================" -ForegroundColor Green
Write-Host ""
Write-Host "NEXT STEPS:" -ForegroundColor Cyan
Write-Host "  1. Edit $envFile with Graph credentials" -ForegroundColor White
Write-Host "  2. Edit $InstallDir\guests.json with invited guests" -ForegroundColor White
Write-Host "  3. Ensure cloudflared routes birthday.coltonessig.com -> localhost:$Port" -ForegroundColor White
Write-Host "  4. Restart after .env changes: pm2 restart laser-birthday" -ForegroundColor White
Write-Host ""
Write-Host "USEFUL COMMANDS:" -ForegroundColor Cyan
Write-Host "  pm2 logs laser-birthday      - view logs" -ForegroundColor White
Write-Host "  pm2 restart laser-birthday   - restart after changes" -ForegroundColor White
Write-Host "  pm2 stop laser-birthday      - stop the server" -ForegroundColor White
Write-Host ""
