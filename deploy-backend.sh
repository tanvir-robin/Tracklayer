#!/usr/bin/env bash
set -euo pipefail

REPO_DIR="$(cd "$(dirname "$0")" && pwd)"
BACKEND_DIR="$REPO_DIR/backend"
REMOTE="cicd@tracklayer.xyz"
REMOTE_PATH="~/tracklayer/backend/"

echo "==> Syncing backend to $REMOTE..."
rsync -avz --delete \
  --exclude 'node_modules' \
  -e "ssh -o StrictHostKeyChecking=no" \
  "$BACKEND_DIR/" "$REMOTE:$REMOTE_PATH"

echo "==> Installing dependencies..."
ssh -o StrictHostKeyChecking=no "$REMOTE" "cd $REMOTE_PATH && npm install --omit=dev"

echo "==> Restarting pm2 tracklayer-api..."
ssh -o StrictHostKeyChecking=no "$REMOTE" "pm2 restart tracklayer-api"

echo "==> Syncing nginx config..."
scp -o StrictHostKeyChecking=no "$REPO_DIR/nginx.conf" "$REMOTE:/etc/nginx/sites-available/tracklayer"
ssh -o StrictHostKeyChecking=no "$REMOTE" "nginx -t && systemctl reload nginx"

echo "==> Backend deploy complete."
