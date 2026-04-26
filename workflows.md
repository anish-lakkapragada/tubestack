# GitHub Actions: cross-platform release builds

## What this does

`.github/workflows/release.yml` builds tubestack for **macOS** and **Windows** in the cloud whenever you push a version tag. The output is a draft GitHub Release with a `.dmg` (Mac) and `.msi` + `.exe` (Windows) attached. You don't need a Windows machine.

## How to cut a release

```bash
# 1. commit your changes as usual
git add . && git commit -m "whatever"
git push origin main

# 2. tag it and push the tag
git tag v0.1.0
git push origin v0.1.0
```

The tag push triggers the workflow. ~10–15 min later you get a draft release at:

`https://github.com/<you>/<repo>/releases`

Open it, edit the description, then hit **Publish**. The Windows folks download the `.msi` from there.

## Tag naming

The workflow listens for tags starting with `v` (the `v*` glob). So `v0.1.0`, `v1.2.3-beta`, `v2.0` all trigger it. Anything else (e.g. `release-1`, plain `0.1.0`) won't.

## Manual trigger (no tag)

The workflow also has `workflow_dispatch`, so you can run it ad-hoc without a tag:

GitHub repo → **Actions** tab → **Release** → **Run workflow**.

Useful for testing the pipeline before committing to a real version number.

## What runs where

| Job | Runner | Output |
|---|---|---|
| macOS build | `macos-latest` | `.dmg`, `.app.tar.gz` (unsigned — see below) |
| Windows build | `windows-latest` | `.msi`, `.exe` (NSIS) (unsigned — see below) |

Both jobs run in parallel via a matrix. If one fails, the other still finishes (`fail-fast: false`).

## Windows signing note

The `.msi`/`.exe` are unsigned. Windows users will see a SmartScreen warning on first launch — they click "More info" → "Run anyway." This is fine for sharing with friends; not fine for a real product. If you ever want to make the warning go away, the cheapest legit option is [SignPath](https://signpath.io) (free for OSS) or Azure Trusted Signing (~$10/mo).

## Mac signing note

`tauri.conf.json` has your local `Developer ID Application` signing identity baked in. CI doesn't have your cert, so the workflow strips that field before building — the CI Mac artifact is **unsigned** and will trigger Gatekeeper warnings.

Two options for Mac distribution:
- **Keep building Mac locally** with `./run-build.sh` (signed) and only use CI for Windows.
- **Add Apple signing to CI** by importing your Developer ID cert as a GitHub secret. See [Tauri's signing guide](https://v2.tauri.app/distribute/sign/macos/) — you'd add `APPLE_CERTIFICATE`, `APPLE_CERTIFICATE_PASSWORD`, etc. as repo secrets and wire them into the `tauri-action` env.

## How the workflow is structured

- `actions/checkout@v4` — pulls the repo.
- `actions/setup-node@v4` — installs Node LTS, caches `~/.npm`.
- `dtolnay/rust-toolchain@stable` — installs Rust.
- `swatinem/rust-cache@v2` — caches `src-tauri/target` so subsequent builds are way faster (first run is slow because nothing is cached).
- `npm ci` — installs frontend deps from the lockfile.
- The Mac-only step strips `signingIdentity` from `tauri.conf.json` in the runner's checkout (doesn't touch your repo).
- `tauri-apps/tauri-action@v0` — runs `tauri build`, collects bundle artifacts, creates/updates a draft GitHub Release with them attached.

## Gotchas

- **First run is slow** (~20 min) because Rust deps compile from scratch on each platform. Subsequent runs hit the `swatinem/rust-cache` and drop to ~5–8 min.
- **`releaseDraft: true`** means releases stay as drafts until you publish them. If you want auto-publish, flip it to `false`.
- **GITHUB_TOKEN is auto-provided** by Actions — you don't set up secrets for the basic flow.
- **package-lock.json must be committed** for `npm ci` to work. It already is.
- If you bump the version, update `package.json` and `src-tauri/tauri.conf.json` (the `version` field in both) before tagging — the tag itself is just a git ref, the version baked into the binary comes from those files.
