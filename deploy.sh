#!/bin/bash
set -e

# ============================================
# Operation: Laser Birthday — Deployment Script
# Run this on your server: bash deploy.sh
# ============================================

APP_NAME="laser-birthday"
APP_DIR="/opt/$APP_NAME"
REPO_URL="https://github.com/jmessig/laser-birthday.git"
PORT=3000

echo "=========================================="
echo "  Deploying Operation: Laser Birthday"
echo "=========================================="

# Check for Node.js
if ! command -v node &>/dev/null; then
  echo "[ERROR] Node.js is not installed. Install Node 20+ first."
  exit 1
fi
echo "[OK] Node $(node -v)"

# Check for PM2
if ! command -v pm2 &>/dev/null; then
  echo "[INFO] Installing PM2..."
  npm install -g pm2
fi
echo "[OK] PM2 $(pm2 -v)"

# Clone or update repo
if [ -d "$APP_DIR" ]; then
  echo "[INFO] Updating existing installation..."
  cd "$APP_DIR"
  git pull
else
  echo "[INFO] Cloning repo..."
  git clone "$REPO_URL" "$APP_DIR"
  cd "$APP_DIR"
fi

# Install dependencies
echo "[INFO] Installing dependencies..."
npm install

# Build React frontend
echo "[INFO] Building frontend..."
npm run build

# Create .env if it doesn't exist
if [ ! -f .env ]; then
  cat > .env << 'ENVEOF'
PORT=3000

# Microsoft Graph API — Azure AD App Registration
# Get these from the Azure AD app registration (shared with skitabor.com)
GRAPH_TENANT_ID=your-tenant-id
GRAPH_CLIENT_ID=your-client-id
GRAPH_CLIENT_SECRET=your-client-secret
SEND_FROM_EMAIL=birthday@coltonessig.com
ENVEOF
  echo "[INFO] Created .env — edit if needed"
else
  echo "[OK] .env already exists"
fi

# Start or restart with PM2
if pm2 describe "$APP_NAME" &>/dev/null; then
  echo "[INFO] Restarting $APP_NAME..."
  pm2 restart "$APP_NAME"
else
  echo "[INFO] Starting $APP_NAME on port $PORT..."
  pm2 start server.js --name "$APP_NAME" --node-args="--env-file=.env"
fi

pm2 save

# Verify
sleep 2
if curl -s -o /dev/null -w "%{http_code}" "http://localhost:$PORT" | grep -q "200"; then
  echo ""
  echo "=========================================="
  echo "  DEPLOYED SUCCESSFULLY"
  echo "  Local:  http://localhost:$PORT"
  echo "  Public: https://birthday.coltonessig.com"
  echo "=========================================="
else
  echo ""
  echo "[WARN] Server may not be responding yet."
  echo "  Check logs: pm2 logs $APP_NAME"
fi

echo ""
echo "NEXT STEPS:"
echo "  1. Edit $APP_DIR/guests.json with invited guests"
echo "  2. Ensure cloudflared routes birthday.coltonessig.com → localhost:$PORT"
echo "  3. Test: curl https://birthday.coltonessig.com"
echo ""
echo "USEFUL COMMANDS:"
echo "  pm2 logs $APP_NAME     — view logs"
echo "  pm2 restart $APP_NAME  — restart after changes"
echo "  pm2 stop $APP_NAME     — stop the server"
