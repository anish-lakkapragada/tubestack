#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
OUT_DIR="$ROOT_DIR/release/friend-test"
STAMP="$(date +%Y%m%d-%H%M%S)"

if [[ "${1:-}" == "-h" || "${1:-}" == "--help" ]]; then
  echo "usage: npm run friend-dmg"
  echo
  echo "builds a macOS dmg, copies it to release/friend-test, and applies"
  echo "the quarantine xattr so local launch testing behaves like a download."
  exit 0
fi

cd "$ROOT_DIR"

echo "building tubestack dmg..."
set +e
npm run tauri build -- --bundles dmg
BUILD_STATUS=$?
set -e

if [[ "$BUILD_STATUS" -ne 0 ]]; then
  echo
  echo "tauri reported a dmg bundling failure."
  echo "checking whether a dmg was still produced before failing..."
fi

DMG_PATH="$(
  find "$ROOT_DIR/src-tauri/target/release/bundle/dmg" -maxdepth 1 -type f -name "*.dmg" -print0 2>/dev/null |
  xargs -0 ls -t 2>/dev/null |
  head -n 1
)"

if [[ -z "${DMG_PATH:-}" || ! -f "$DMG_PATH" ]]; then
  echo "could not find generated dmg in src-tauri/target/release/bundle/dmg" >&2
  if [[ -f "$ROOT_DIR/src-tauri/target/release/bundle/dmg/bundle_dmg.sh" ]]; then
    echo
    echo "for the underlying dmg command, try:" >&2
    echo "bash -x src-tauri/target/release/bundle/dmg/bundle_dmg.sh" >&2
  fi
  exit 1
fi

mkdir -p "$OUT_DIR"

FRIEND_DMG="$OUT_DIR/tubestack-latest.dmg"
cp "$DMG_PATH" "$FRIEND_DMG"

# Make local macOS treat this copy like a file downloaded from the internet.
# This is the closest local simulation of what friends will see after download.
if command -v xattr >/dev/null 2>&1; then
  xattr -w com.apple.quarantine "0081;$(printf '%x' "$(date +%s)");Safari;https://example.com/tubestack.dmg" "$FRIEND_DMG" || true
fi

echo
echo "friend-test dmg created:"
echo "$FRIEND_DMG"
echo
echo "to test the friend experience:"
echo "1. open this dmg in finder"
echo "2. drag tubestack into applications if prompted"
echo "3. double-click the app normally"
echo "4. if macOS blocks it, right-click the app -> open -> open"
echo
echo "quarantine status:"
xattr -l "$FRIEND_DMG" 2>/dev/null || echo "no xattr output"
