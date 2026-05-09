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
  APP_PATH="$ROOT_DIR/src-tauri/target/release/bundle/macos/tubestack.app"
  FALLBACK_DMG="$ROOT_DIR/src-tauri/target/release/bundle/dmg/tubestack-friend-fallback.dmg"

  if [[ -d "$APP_PATH" ]]; then
    echo "could not find generated dmg in src-tauri/target/release/bundle/dmg"
    echo "creating fallback dmg from signed app bundle..."

    TMP_DMG_DIR="$(mktemp -d)"
    TMP_RW_DMG="$TMP_DMG_DIR/tubestack-rw.dmg"
    TMP_MOUNT=""
    TMP_DEVICE=""
    trap '[[ -n "${TMP_DEVICE:-}" ]] && hdiutil detach "$TMP_DEVICE" >/dev/null 2>&1 || true; rm -rf "${TMP_DMG_DIR:-}"' EXIT

    mkdir -p "$(dirname "$FALLBACK_DMG")"
    rm -f "$FALLBACK_DMG"

    hdiutil create \
      -volname "tubestack" \
      -size 160m \
      -fs HFS+ \
      -ov \
      "$TMP_RW_DMG"

    ATTACH_OUTPUT="$(hdiutil attach -readwrite -noverify -noautoopen "$TMP_RW_DMG")"
    TMP_DEVICE="$(printf '%s\n' "$ATTACH_OUTPUT" | sed -n 's#^\\(/dev/[^[:space:]]*\\).*#\\1#p' | head -n 1)"
    TMP_MOUNT="$(printf '%s\n' "$ATTACH_OUTPUT" | sed -n 's#.*\\(/Volumes/.*\\)$#\\1#p' | head -n 1)"

    if [[ -z "$TMP_DEVICE" || -z "$TMP_MOUNT" || ! -d "$TMP_MOUNT" ]]; then
      echo "failed to mount fallback dmg" >&2
      exit 1
    fi

    ditto "$APP_PATH" "$TMP_MOUNT/tubestack.app"
    ln -s /Applications "$TMP_MOUNT/Applications"
    hdiutil detach "$TMP_DEVICE"
    TMP_DEVICE=""

    hdiutil convert "$TMP_RW_DMG" -format UDZO -o "$FALLBACK_DMG"

    DMG_PATH="$FALLBACK_DMG"
  else
    echo "could not find generated dmg in src-tauri/target/release/bundle/dmg" >&2
    echo "could not find built app at src-tauri/target/release/bundle/macos/tubestack.app" >&2
    if [[ -f "$ROOT_DIR/src-tauri/target/release/bundle/dmg/bundle_dmg.sh" ]]; then
      echo
      echo "for the underlying dmg command, try:" >&2
      echo "bash -x src-tauri/target/release/bundle/dmg/bundle_dmg.sh <args>" >&2
    fi
    exit 1
  fi
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
