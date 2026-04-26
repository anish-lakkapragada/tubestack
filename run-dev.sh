#!/usr/bin/env sh
set -eu

ROOT_DIR="$(cd "$(dirname "$0")" && pwd)"
PORT="${PORT:-1420}"

cd "$ROOT_DIR"

if [ ! -d node_modules ]; then
  echo "node_modules missing; running npm install..."
  npm install
fi

echo "regenerating app icons from public/icon.svg..."
npm run tauri icon public/icon.svg

# Touch the bundle config + icons so cargo's incremental build re-embeds them.
# Without this, tauri dev can reuse a cached binary that still holds the old icon.
if command -v touch >/dev/null 2>&1; then
  touch src-tauri/tauri.conf.json 2>/dev/null || true
  touch src-tauri/icons/icon.icns src-tauri/icons/icon.png 2>/dev/null || true
fi

# macOS aggressively caches Dock/Finder icons even after the bundle changes.
# These are non-destructive busts that let us avoid logout/reboot during dev.
if [ "$(uname -s)" = "Darwin" ]; then
  rm -rf "$HOME/Library/Caches/com.apple.iconservices.store" 2>/dev/null || true
  killall Dock 2>/dev/null || true
fi

if command -v lsof >/dev/null 2>&1; then
  PIDS="$(lsof -tiTCP:"$PORT" -sTCP:LISTEN 2>/dev/null || true)"
  if [ -n "$PIDS" ]; then
    echo "stopping stale dev server(s) on port $PORT: $PIDS"
    kill $PIDS 2>/dev/null || true
    sleep 0.5
  fi
fi

echo "starting tubestack dev..."
npm run tauri dev
