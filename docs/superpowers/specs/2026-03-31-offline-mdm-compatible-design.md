# Offline / MDM-Compatible 3D Scene Composer

**Date:** 2026-03-31
**Status:** Draft

## Context

The 3D Scene Composer needs to run in an Apple-managed (MDM) corporate environment where outbound network requests are blocked at the OS/firewall level and npm registry access is unreliable or fully blocked. Some npm packages may be available through an internal Apple-mirrored registry, but this cannot be relied upon.

The app already has zero runtime network dependencies — all 3D models are procedural, no CDN links, no API calls, no external fonts. The changes needed are:

1. Harden configuration to guarantee no outbound requests
2. Vendor all npm dependencies for offline installation
3. Provide clear workflows for both developer and teammate distribution

## Distribution Modes

### Mode 1: Tauri Desktop App (for teammates)

Built on an unrestricted machine, distributed as a `.app` bundle. Teammates double-click to launch. No Node.js, npm, or dev tools required on their machine.

### Mode 2: Vendored Source (for CLI development)

The full source tree plus vendored dependencies copied to the managed machine. Developer runs `npm run start:offline` to launch the Vite dev server. No registry access needed.

## Changes

### 1. Content Security Policy (`index.html`)

Add a CSP meta tag that blocks all outbound network requests while allowing the app to function:

```html
<meta http-equiv="Content-Security-Policy"
  content="default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' blob: data:; connect-src 'self' ws://localhost:* ws://127.0.0.1:*;">
```

- `default-src 'self'` — only load resources from the app's own origin
- `script-src 'self' 'unsafe-inline'` — allow app scripts and inline scripts (Vite HMR in dev)
- `style-src 'self' 'unsafe-inline'` — allow app styles and inline styles (Tailwind)
- `img-src 'self' blob: data:` — allow local images, blob URLs (canvas export), and data URLs (reference photo upload)
- `connect-src 'self' ws://localhost:* ws://127.0.0.1:*` — allow Vite HMR WebSocket in dev mode (localhost only), block all external connections

### 2. Tauri Security Lockdown (`src-tauri/tauri.conf.json`)

- Ensure no `updater` plugin is configured (no auto-update checks)
- Add CSP to Tauri's security config matching the HTML CSP
- No remote URLs in any allowlist

### 3. Tauri Capabilities (`src-tauri/capabilities/default.json`)

- Keep only `opener:default` permission (local file operations)
- No network-related permissions

### 4. Vendoring Scripts

#### `scripts/vendor-pack.sh` (run on unrestricted machine)

1. Run `npm install` to ensure `node_modules` is current
2. Run `npm pack` for each production and dev dependency
3. Store tarballs in `vendor/` directory
4. Generate `vendor/manifest.json` listing all packages and versions

#### `scripts/vendor-install.sh` (run on managed machine)

1. Read `vendor/manifest.json`
2. Install all packages from local tarballs using `npm install --offline`
3. No registry contact required

### 5. npm Scripts (`package.json`)

```json
{
  "vendor:pack": "bash scripts/vendor-pack.sh",
  "vendor:install": "bash scripts/vendor-install.sh",
  "start:offline": "npx vite --host"
}
```

- `vendor:pack` — package all deps into `vendor/` (run on unrestricted machine)
- `vendor:install` — install from vendored tarballs (run on managed machine)
- `start:offline` — launch Vite dev server from local deps (identical to `dev` but intent-clear)

### 6. Project Config (`.npmrc`)

New file at project root:

```ini
prefer-offline=true
```

Tells npm to prefer cached/local packages over registry lookups.

### 7. Git Ignore (`.gitignore`)

Add `vendor/` — the vendored tarballs are large and should be distributed as a separate archive alongside the source, not committed to git.

## Files Changed

| File | Action | Purpose |
|------|--------|---------|
| `index.html` | Edit | Add CSP meta tag |
| `package.json` | Edit | Add vendor/offline npm scripts |
| `.npmrc` | Create | Prefer offline npm installs |
| `scripts/vendor-pack.sh` | Create | Pack deps into vendor/ tarballs |
| `scripts/vendor-install.sh` | Create | Install from vendored tarballs |
| `src-tauri/tauri.conf.json` | Edit | Add security CSP, no updater |
| `.gitignore` | Edit | Exclude vendor/ directory |

## Workflow

### Initial Setup (your unrestricted machine)

```bash
git clone <repo>
cd agent_3D_compositing
npm install
npm run vendor:pack        # creates vendor/ with all tarballs
npm run tauri:build        # creates .app bundle
```

### Distribute to Managed Machine (CLI dev)

```bash
# Copy project folder + vendor/ to managed machine
cp -r agent_3D_compositing /path/to/managed/machine/

# On managed machine:
cd agent_3D_compositing
npm run vendor:install     # installs from local tarballs
npm run start:offline      # launches dev server
```

### Distribute to Teammates (desktop app)

```bash
# Copy the built .app from:
#   src-tauri/target/release/bundle/macos/Scene Composer.app
# to teammates via internal file share, AirDrop, etc.
# They double-click to launch. Done.
```

## Error Handling

- If `npm install` is accidentally run on the managed machine and fails, no harm — existing `node_modules` from vendored install remains intact
- CSP blocks any accidental outbound requests at the browser level (defense-in-depth with the firewall)
- Canvas export (`toDataURL`) and reference image upload (`FileReader`) use local browser APIs — unaffected by CSP

## Testing

- Verify no CSP violations appear in browser devtools console
- Verify Tauri `.app` launches and functions without network access
- Verify full round-trip: `vendor:pack` on unrestricted machine, `vendor:install` + `start:offline` on a clean directory with no network
- Verify PNG export and reference image upload still work with CSP in place
