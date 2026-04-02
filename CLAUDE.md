# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## App Name

**TV Featuring Composer** (previously "Scene Composer" — renamed 2026-04-01)
- Bundle ID: `com.tvfeaturing.composer`
- User data directory: `~/Documents/TV Featuring Composer/`

## Environment

This project runs in an Apple MDM managed environment. Key constraints:
- NOT airgapped — internet is accessible, but runtime outbound calls should be intentional and discussed before adding them
- npm registry access is sandboxed — may need `registry.npmjs.org` temporarily allowlisted in `~/.claude/apple/dangerous_allowed_domains.csv` (remove after use)
- Always use `--legacy-peer-deps` with npm install (configured in `.npmrc`)
- Vite `--host` flag is blocked by sandbox; use `npm run dev` for localhost-only serving
- Apple's internal npm implementation may not match public registry — test carefully

## Build Commands

| Command | Description |
|---|---|
| `npm run dev` | Start Vite dev server (localhost:5173) |
| `npm run build` | Build static frontend to `dist/` |
| `npm run tauri:dev` | Desktop app with hot reload |
| `npm run tauri:build` | Build distributable macOS `.app` |
| `npm run vendor:pack` | Archive node_modules for offline transfer |
| `npm run vendor:install` | Install from vendored archive (no network) |
| `npm run start:offline` | Alias for dev server |

## Architecture

- React 19 + Three.js via @react-three/fiber and @react-three/drei
- **Targeting Tauri desktop app** for filesystem features (model loading, first-run dir creation)
- State management: Zustand (in-memory, no persistence)
- Lighting: local three-point clay rig (warm key, cool fill, rim) — no HDR environment maps
- CSP enforced: no runtime outbound network

### Model Pipeline

- User models live in `~/Documents/TV Featuring Composer/models/` (created on first run)
- Supported formats: **GLB** (primary), **FBX** (secondary), **STL** (tertiary)
- All loaded meshes have textures stripped at load time — uniform grey clay material applied:
  `MeshStandardMaterial({ color: '#94a3b8', roughness: 0.75, metalness: 0.0 })`
- Primitives (box, sphere, cylinder, plane, wall) remain procedural
- Human figures use Mixamo FBX files + Three.js AnimationMixer for pose presets

### Key Components

| File | Purpose |
|---|---|
| `src/components/Viewport/SceneViewport.jsx` | Three.js canvas, lighting, grid, backdrop, TransformControls |
| `src/components/Viewport/FigureModel.jsx` | FBX character loader + AnimationMixer (replaces HumanoidFigure.jsx) |
| `src/components/Viewport/PropModel.jsx` | GLB/FBX/STL file loader + procedural fallbacks |
| `src/components/Viewport/ViewportOverlays.jsx` | Rule of thirds + aspect ratio crop (CSS/SVG, not Three.js) |
| `src/components/Panels/ModelLibrary.jsx` | Scans models dir, populates library |
| `src/components/Panels/PosePanel.jsx` | Animation preset dropdown (replaced joint sliders) |
| `src/components/Panels/CameraPanel.jsx` | FOV + presets (presets call OrbitControls imperatively) |
| `src/store/sceneStore.js` | Zustand store — objects, camera, mode, overlays, backdrop |

## Important Patterns

- CSP in `index.html` blocks all outbound network. Needs `'unsafe-eval'` for Vite and `worker-src blob:` for Three.js.
- Tauri CSP in `src-tauri/tauri.conf.json` mirrors the HTML CSP (without ws:// for production).
- When adding drei features, check if they load external assets (HDR, fonts, models). Use local alternatives instead.
- Camera presets must call OrbitControls imperatively — updating Zustand state alone does NOT move the camera.
- TransformControls: disable OrbitControls while dragging to prevent conflict.

## In-Progress: v2 Feature Update

Spec: `docs/superpowers/specs/2026-04-01-tv-featuring-composer-v2-design.md`

**Status: spec approved, implementation plan not yet written.**

Items:
1. File-based model library (scan `models/` dir, GLB/FBX/STL)
2. Mixamo FBX figures with AnimationMixer presets
3. Startup green backdrop mesh
4. Rule of thirds overlay + aspect ratio (16:9, 9:16, 2.39:1)
5. Camera preset fix (imperative OrbitControls)
6. Viewport clay aesthetics (lighting + grid + bg)
7. Transform gizmos (translate/rotate via `<TransformControls>`)
8. App rename + DMG Gatekeeper launcher script

## Tauri Desktop Build

- Requires Rust/Cargo (`source ~/.cargo/env` to activate)
- First build needs `index.crates.io`, `static.crates.io`, `crates.io` temporarily allowlisted in sandbox
- Tauri's DMG bundler may fail — create manually with `hdiutil create`
- Output .app: `src-tauri/target/release/bundle/macos/TV Featuring Composer.app`
- Output DMG: `src-tauri/target/release/bundle/dmg/TV Featuring Composer.dmg`
- `src-tauri/gen/` is auto-generated — gitignored
- DMG distribution: bundle `Launch TV Featuring Composer.command` script to bypass Gatekeeper (runs `xattr -rc` on the app)
