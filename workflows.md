# GitHub Actions release workflow

## Trigger

`.github/workflows/release.yml` runs on every push to `main`. It can also be run manually from GitHub: Actions -> Release -> Run workflow.

The workflow does not bump the app version. The version comes from `package.json`, and the release tag adds the GitHub run number so every run is unique:

```text
v0.1.0-build.12
```

If you want a new app version, update both `package.json` and `src-tauri/tauri.conf.json` before pushing.

## Jobs

### `prepare-release`

Runs on `ubuntu-latest`.

1. Checks out the repo.
2. Reads `package.json` with Node to get the version.
3. Creates a GitHub Release named `tubestack v<version> build <run number>`.
4. Exposes the release ID and version to the build matrix.

### `build`

Builds desktop artifacts with `tauri-apps/tauri-action@v0`.

| Matrix label | Runner | Rust target | Asset suffix |
| --- | --- | --- | --- |
| `macos-apple-silicon` | `macos-15` | `aarch64-apple-darwin` | `macos-arm64` |
| `macos-intel` | `macos-15-intel` | `x86_64-apple-darwin` | `macos-x64` |
| `windows-x64` | `windows-latest` | default Windows target | `windows-x64` |

Each matrix job:

1. Checks out the repo.
2. Installs Node 22.
3. Installs Rust stable, including the configured Rust target when needed.
4. Restores the Rust build cache for `src-tauri/target`.
5. Runs `npm ci`.
6. For macOS builds, requires Apple signing and notarization secrets.
7. For macOS builds, imports the Developer ID certificate into a temporary keychain.
8. Runs Tauri build and uploads artifacts to the release created by `prepare-release`.

## Asset names

Assets are named from the package version and matrix suffix:

```text
tubestack-v0.1.0-macos-arm64.dmg
tubestack-v0.1.0-macos-arm64.app.tar.gz
tubestack-v0.1.0-macos-x64.dmg
tubestack-v0.1.0-windows-x64.exe
tubestack-v0.1.0-windows-x64.msi
```

The workflow uses `needs.prepare-release.outputs.version`, not a placeholder string, so `__VERSION__` should never appear in uploaded release assets.

## Signing

macOS releases are signed and notarized in CI. These repo secrets must exist:

- `APPLE_CERTIFICATE_BASE64`
- `APPLE_CERTIFICATE_PASSWORD`
- `APPLE_ID`
- `APPLE_PASSWORD`
- `APPLE_TEAM_ID`

The workflow refuses to upload unsigned macOS artifacts because unsigned downloaded DMGs are blocked by Gatekeeper.

Windows artifacts are currently unsigned, so Windows may show SmartScreen warnings.

## Local friend-test builds

The old `run-friends.sh`, `npm run friend-dmg`, and `release/friend-test` flow was removed. Use the GitHub Release artifacts as the distribution source for DMGs.
