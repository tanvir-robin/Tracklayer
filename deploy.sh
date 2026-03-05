#!/usr/bin/env bash
set -euo pipefail

FRONTEND_DIR="$(cd "$(dirname "$0")/frontend" && pwd)"
REMOTE="cicd@tracklayer.xyz"
REMOTE_PATH="~/tracklayer/frontend/dist/"

echo "==> Fixing dist ownership..."
sudo chown -R "$(whoami)" "$FRONTEND_DIR/dist" 2>/dev/null || true

echo "==> Building frontend..."
cd "$FRONTEND_DIR"
npm run build

echo "==> Syncing to $REMOTE..."
rsync -avz --delete \
  -e "ssh -o StrictHostKeyChecking=no" \
  "$FRONTEND_DIR/dist/" "$REMOTE:$REMOTE_PATH"

echo "==> Deploy complete."
