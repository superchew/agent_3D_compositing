# Offline / MDM-Compatible Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the 3D Scene Composer fully functional in an Apple MDM corporate environment with no outbound network access, supporting both Tauri .app distribution and vendored CLI development.

**Architecture:** Add CSP headers and Tauri security config to block outbound requests (defense-in-depth). Vendor all npm dependencies as tarballs for offline installation. Add scripts for pack/install/run workflows.

**Tech Stack:** Bash scripts, npm, Vite, Tauri v2

---

## File Structure

| File | Action | Responsibility |
|------|--------|----------------|
| `index.html` | Modify | Add CSP meta tag |
| `package.json` | Modify | Add vendor/offline npm scripts |
| `.npmrc` | Create | npm offline preference |
| `scripts/vendor-pack.sh` | Create | Pack all deps into vendor/ tarballs |
| `scripts/vendor-install.sh` | Create | Install from vendored tarballs offline |
| `src-tauri/tauri.conf.json` | Modify | Add security CSP |
| `.gitignore` | Modify | Exclude vendor/ and scripts output |

---

### Task 1: Add Content Security Policy to index.html

**Files:**
- Modify: `index.html:4-6`

- [ ] **Step 1: Add CSP meta tag**

Edit `index.html` to add the CSP meta tag inside `<head>`, after the viewport meta tag:

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta http-equiv="Content-Security-Policy"
      content="default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' blob: data:; connect-src 'self' ws://localhost:* ws://127.0.0.1:*;">
    <title>3D Scene Composer — AI Workflow</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.jsx"></script>
  </body>
</html>
```

- [ ] **Step 2: Verify the app still loads**

Run: `npm run dev`

Open `http://localhost:5173` in a browser. Open DevTools → Console. Verify:
- The app renders normally (3D viewport, panels, toolbar)
- No CSP violation errors in the console
- Reference image upload still works (uses `blob:` and `data:` URLs)
- PNG export still works (uses canvas `toDataURL()`)

- [ ] **Step 3: Commit**

```bash
git add index.html
git commit -m "security: add Content Security Policy to block outbound network requests"
```

---

### Task 2: Add Tauri Security CSP

**Files:**
- Modify: `src-tauri/tauri.conf.json:22-24`

- [ ] **Step 1: Set CSP in Tauri config**

Edit `src-tauri/tauri.conf.json`. Replace the `"security"` block:

```json
    "security": {
      "csp": "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' blob: data:; connect-src 'self'"
    }
```

Note: The Tauri CSP omits the `ws://localhost:*` since the production Tauri app doesn't use Vite HMR. The built app serves static files directly.

- [ ] **Step 2: Verify Tauri dev still works**

Run: `npm run tauri:dev`

Verify the desktop window opens, the 3D scene renders, and there are no CSP errors in the Tauri dev console (right-click → Inspect Element → Console).

- [ ] **Step 3: Commit**

```bash
git add src-tauri/tauri.conf.json
git commit -m "security: add CSP to Tauri config to block outbound requests in desktop app"
```

---

### Task 3: Create .npmrc for offline preference

**Files:**
- Create: `.npmrc`

- [ ] **Step 1: Create .npmrc**

Create `.npmrc` at the project root with the following content:

```ini
prefer-offline=true
```

- [ ] **Step 2: Commit**

```bash
git add .npmrc
git commit -m "config: add .npmrc with prefer-offline for managed environments"
```

---

### Task 4: Create vendor-pack.sh script

**Files:**
- Create: `scripts/vendor-pack.sh`

- [ ] **Step 1: Create the scripts directory and vendor-pack.sh**

Create `scripts/vendor-pack.sh`:

```bash
#!/usr/bin/env bash
set -euo pipefail

# vendor-pack.sh
# Run this on an UNRESTRICTED machine to pack all npm dependencies
# into vendor/ for offline installation on managed machines.

VENDOR_DIR="vendor"
MANIFEST="$VENDOR_DIR/manifest.json"

echo "==> Ensuring node_modules is up to date..."
npm install

echo "==> Cleaning vendor directory..."
rm -rf "$VENDOR_DIR"
mkdir -p "$VENDOR_DIR"

echo "==> Packing dependencies..."

# Read all dependency names from package.json (both dependencies and devDependencies)
DEPS=$(node -e "
  const pkg = require('./package.json');
  const all = {
    ...pkg.dependencies,
    ...pkg.devDependencies
  };
  console.log(Object.keys(all).join('\n'));
")

MANIFEST_ENTRIES="["
FIRST=true

for DEP in $DEPS; do
  echo "  Packing $DEP..."
  # npm pack outputs the tarball filename to stdout
  TARBALL=$(npm pack "$DEP" --pack-destination "$VENDOR_DIR" 2>/dev/null)

  if [ "$FIRST" = true ]; then
    FIRST=false
  else
    MANIFEST_ENTRIES+=","
  fi
  MANIFEST_ENTRIES+="\"$TARBALL\""
done

MANIFEST_ENTRIES+="]"

echo "$MANIFEST_ENTRIES" | node -e "
  const fs = require('fs');
  let data = '';
  process.stdin.on('data', chunk => data += chunk);
  process.stdin.on('end', () => {
    const tarballs = JSON.parse(data);
    const manifest = {
      generatedAt: new Date().toISOString(),
      packageCount: tarballs.length,
      tarballs: tarballs
    };
    fs.writeFileSync('$MANIFEST', JSON.stringify(manifest, null, 2));
  });
"

echo ""
echo "==> Done! Packed $(echo "$DEPS" | wc -l | tr -d ' ') packages into $VENDOR_DIR/"
echo "==> Manifest written to $MANIFEST"
echo ""
echo "Next steps:"
echo "  1. Copy this project folder (including vendor/) to the managed machine"
echo "  2. On the managed machine, run: npm run vendor:install"
echo "  3. Then run: npm run start:offline"
```

- [ ] **Step 2: Make it executable**

Run: `chmod +x scripts/vendor-pack.sh`

- [ ] **Step 3: Test the script**

Run: `bash scripts/vendor-pack.sh`

Expected: A `vendor/` directory is created containing `.tgz` tarballs for each dependency and a `manifest.json` file listing them all. Output should show each package being packed and a summary at the end.

- [ ] **Step 4: Commit**

```bash
git add scripts/vendor-pack.sh
git commit -m "feat: add vendor-pack script for offline dependency bundling"
```

---

### Task 5: Create vendor-install.sh script

**Files:**
- Create: `scripts/vendor-install.sh`

- [ ] **Step 1: Create vendor-install.sh**

Create `scripts/vendor-install.sh`:

```bash
#!/usr/bin/env bash
set -euo pipefail

# vendor-install.sh
# Run this on a MANAGED machine to install dependencies from
# vendored tarballs without any network access.

VENDOR_DIR="vendor"
MANIFEST="$VENDOR_DIR/manifest.json"

if [ ! -f "$MANIFEST" ]; then
  echo "ERROR: $MANIFEST not found."
  echo "Run 'npm run vendor:pack' on an unrestricted machine first."
  exit 1
fi

echo "==> Reading manifest..."

# Extract tarball list from manifest
TARBALLS=$(node -e "
  const manifest = require('./$MANIFEST');
  manifest.tarballs.forEach(t => console.log(t));
")

# Build npm install command with all local tarballs
INSTALL_ARGS=""
for TARBALL in $TARBALLS; do
  INSTALL_ARGS+=" $VENDOR_DIR/$TARBALL"
done

echo "==> Installing $(echo "$TARBALLS" | wc -l | tr -d ' ') packages from vendored tarballs..."
npm install --offline $INSTALL_ARGS

echo ""
echo "==> Done! Dependencies installed from vendor/."
echo "==> Run 'npm run start:offline' to launch the dev server."
```

- [ ] **Step 2: Make it executable**

Run: `chmod +x scripts/vendor-install.sh`

- [ ] **Step 3: Test the round-trip**

To verify, simulate a clean install:

```bash
rm -rf node_modules
bash scripts/vendor-install.sh
npm run dev
```

Expected: `node_modules` is rebuilt from vendored tarballs. `npm run dev` starts Vite and the app loads at `http://localhost:5173`.

After verifying, restore full node_modules: `npm install`

- [ ] **Step 4: Commit**

```bash
git add scripts/vendor-install.sh
git commit -m "feat: add vendor-install script for offline dependency installation"
```

---

### Task 6: Add npm scripts to package.json

**Files:**
- Modify: `package.json:6-12`

- [ ] **Step 1: Add the three new scripts**

Edit `package.json` to add the vendor and offline scripts to the `"scripts"` block:

```json
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview",
    "tauri:dev": "tauri dev",
    "tauri:build": "tauri build",
    "vendor:pack": "bash scripts/vendor-pack.sh",
    "vendor:install": "bash scripts/vendor-install.sh",
    "start:offline": "npx vite --host"
  },
```

- [ ] **Step 2: Verify scripts are accessible**

Run: `npm run start:offline`

Expected: Vite starts and serves the app at `http://localhost:5173` (with `--host` exposing it on the network).

Stop the server with Ctrl+C.

- [ ] **Step 3: Commit**

```bash
git add package.json
git commit -m "feat: add vendor:pack, vendor:install, and start:offline npm scripts"
```

---

### Task 7: Update .gitignore

**Files:**
- Modify: `.gitignore`

- [ ] **Step 1: Add vendor/ to .gitignore**

Edit `.gitignore` to add the vendor directory:

```
node_modules
dist
.vite

# Tauri
src-tauri/target

# Vendored dependencies (distribute separately, not via git)
vendor
```

- [ ] **Step 2: Commit**

```bash
git add .gitignore
git commit -m "chore: add vendor/ to .gitignore"
```

---

### Task 8: End-to-end verification

- [ ] **Step 1: Run vendor:pack**

Run: `npm run vendor:pack`

Expected: `vendor/` directory created with tarballs and `manifest.json`.

- [ ] **Step 2: Simulate managed machine install**

```bash
rm -rf node_modules
npm run vendor:install
```

Expected: `node_modules` rebuilt from local tarballs only, no network requests.

- [ ] **Step 3: Launch offline and verify functionality**

Run: `npm run start:offline`

Open `http://localhost:5173`. Verify:
- 3D viewport renders with orbit controls
- Can add a humanoid figure and adjust poses
- Can add props (chair, table, etc.)
- Can upload a reference image (drag or file picker)
- Can export PNG (scene and matte map)
- Browser DevTools Console shows zero CSP violations
- Browser DevTools Network tab shows zero external requests

- [ ] **Step 4: Verify Tauri build**

Run: `npm run tauri:build`

Expected: `.app` bundle created at `src-tauri/target/release/bundle/macos/Scene Composer.app`. Launch it and verify the same functionality as step 3.

- [ ] **Step 5: Restore and commit any fixes**

Run: `npm install` to restore full node_modules.

If any fixes were needed during verification, commit them:

```bash
git add -A
git commit -m "fix: adjustments from end-to-end offline verification"
```
