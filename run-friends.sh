#!/usr/bin/env bash
source .env.notarize
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$ROOT_DIR"

if [[ ! -d node_modules ]]; then
  echo "node_modules missing; running npm install..."
  npm install
fi

echo "regenerating app icons from public/icon.svg..."
npm run tauri icon public/icon.svg

# Touch the bundle config + icons so cargo re-embeds them in the release build.
touch src-tauri/tauri.conf.json src-tauri/icons/icon.icns src-tauri/icons/icon.png 2>/dev/null || true

# Bust the user-level Finder/Dock icon cache before bundling, so when a friend
# (or you, testing) drops the new app into Applications it doesn't display the
# previously cached icon for the same bundle id.
if [[ "$(uname -s)" == "Darwin" ]]; then
  rm -rf "$HOME/Library/Caches/com.apple.iconservices.store" 2>/dev/null || true
  killall Dock 2>/dev/null || true
fi

echo "confirming generated icon:"
ls -lh src-tauri/icons/icon.png src-tauri/icons/icon.icns

echo "building friend-test dmg..."
npm run friend-dmg
