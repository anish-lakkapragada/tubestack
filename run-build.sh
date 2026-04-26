#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$ROOT_DIR"

if [[ ! -d node_modules ]]; then
  echo "node_modules missing; running npm install..."
  npm install
fi

echo "regenerating app icons from public/icon.svg..."
npm run tauri icon public/icon.svg

echo "confirming generated icon:"
ls -lh src-tauri/icons/icon.png src-tauri/icons/icon.icns

echo "building frontend..."
npm run build

echo "building tauri app bundle..."
npm run tauri build
