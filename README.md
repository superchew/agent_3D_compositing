# TV Featuring Composer

A desktop app for compositing 3D scenes used as visual prompt guidance for AI-generated artwork. Load GLB/FBX/STL models, pose Mixamo characters, frame the camera, and export color-coded matte maps to drive AI image workflows.

---

## What it does

- **Load 3D models** — Drop GLB, FBX, or STL files into `~/Documents/TV Featuring Composer/models/` and they appear in the Model Library. All models get a uniform grey clay material.
- **Pose Mixamo figures** — Add male or female characters loaded from FBX files. Select animation presets (Idle, Seated, Lounging, Action, etc.) powered by Three.js AnimationMixer. Subtle guide lines trace the spine midline and eye level, following the skeleton pose.
- **Props & environment** — Procedural primitives (box, sphere, cylinder, plane, wall, camera, light stand) plus file-based props from your models folder.
- **Transform gizmos** — Select any object and move (G) or rotate (R) it with drei TransformControls.
- **Green backdrop** — Starts with a green backdrop wall; toggle on/off and pick any color from the toolbar.
- **Viewport overlays** — Rule of thirds grid and aspect ratio crop (16:9, 9:16, 2.39:1) as CSS/SVG overlays.
- **Camera control** — Set FOV via lens equivalents (24mm–135mm) and jump to composition presets (eye level, low angle, bird's eye, close-up, wide, side, 3/4 view). Presets move OrbitControls imperatively.
- **Clay lighting** — Three-point rig: warm key light, cool blue fill, white rim light. Grey background (#2a2a2a).
- **FX Puzzle Matte** — Assign solid colors to objects and toggle matte view for flat-colored silhouettes on black, like a VFX ID/puzzle matte. Annotate each color channel for AI prompts.
- **Reference photo overlay** — Upload a reference image with adjustable opacity.
- **Export** — Save the scene render or matte map as PNG.

---

## Running the app

### In the browser (limited)

```bash
npm install --legacy-peer-deps
npm run dev
```

Open `http://localhost:5173`. Note: browser mode only shows procedural primitives — file-based models require the Tauri desktop app.

### As a macOS desktop app (Tauri) — recommended

Requires [Rust](https://rustup.rs) and Node.

```bash
source ~/.cargo/env
npm run tauri:dev
```

On first launch, the app creates `~/Documents/TV Featuring Composer/models/`. Place your GLB/FBX/STL files there (or symlink your models directory).

### Build a distributable .app

```bash
npm run tauri:build
# Output: src-tauri/target/release/bundle/macos/TV Featuring Composer.app
```

For unsigned distribution: bundle `dist-extras/Launch TV Featuring Composer.command` alongside the app in a DMG. Recipients right-click > Open the script once to bypass Gatekeeper.

### Offline / managed environment setup

```bash
# On an unrestricted machine:
npm install --legacy-peer-deps
npm run vendor:pack          # creates vendor/node_modules.tar.gz (~80MB)

# Copy project + vendor/ to the managed machine, then:
npm run vendor:install       # extracts node_modules from archive
npm run start:offline        # launches dev server
```

---

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start Vite dev server (browser, localhost:5173) |
| `npm run build` | Build static frontend to `dist/` |
| `npm run tauri:dev` | Launch as a native macOS desktop app with hot reload |
| `npm run tauri:build` | Package a distributable macOS `.app` bundle |
| `npm run vendor:pack` | Archive node_modules for offline transfer |
| `npm run vendor:install` | Install from vendored archive (no network) |
| `npm run start:offline` | Start dev server (same as `dev`) |

---

## Keyboard shortcuts

| Key | Action |
|---|---|
| `Q` | Select mode |
| `W` | Pose mode |
| `E` | Matte mode |
| `T` | Reference mode |
| `G` | Move gizmo (translate) |
| `R` | Rotate gizmo |

Camera mode is accessible from the toolbar (no keyboard shortcut — R was reassigned to rotate gizmo).

---

## Stack

- [React 19](https://react.dev) + [Vite](https://vitejs.dev)
- [Three.js](https://threejs.org) via [@react-three/fiber](https://docs.pmnd.rs/react-three-fiber) and [@react-three/drei](https://github.com/pmndrs/drei)
- [Zustand](https://github.com/pmndrs/zustand) for state
- [Tailwind CSS v4](https://tailwindcss.com)
- [Tauri v2](https://tauri.app) for the desktop wrapper
- [Lucide React](https://lucide.dev) for icons

---

## Project structure

```
src/
  App.jsx                              Main layout + model scanning on mount
  store/sceneStore.js                  Zustand state (objects, camera, gizmos, overlays, backdrop)
  lib/
    tauriBridge.js                     Tauri invoke wrapper with browser fallback
    clayMaterial.js                    Grey clay MeshStandardMaterial utility
    fileLoader.js                      GLB/FBX/STL loaders from ArrayBuffer
  components/
    Toolbar/Toolbar.jsx                Mode switcher, gizmo buttons, backdrop, overlays, export
    Viewport/
      SceneViewport.jsx                Three.js canvas, lighting, grid, backdrop, TransformControls
      FigureModel.jsx                  Mixamo FBX character loader + AnimationMixer
      PropModel.jsx                    File-based model loader + procedural shape fallbacks
      ViewportOverlays.jsx             Rule of thirds + aspect ratio crop (CSS/SVG)
    Panels/
      ScenePanel.jsx                   Scene hierarchy (visibility, delete)
      PropertiesPanel.jsx              Transform + matte color assignment
      PosePanel.jsx                    Animation preset dropdown
      MattePanel.jsx                   Color channel labels + prompt preview
      CameraPanel.jsx                  FOV + composition presets (imperative OrbitControls)
      ReferencePanel.jsx               Photo upload + opacity slider
      ModelLibrary.jsx                 Scans models dir, shows figures/props/primitives
src-tauri/
  src/lib.rs                           Rust commands: init_user_dir, list_model_files, read_model_file
  tauri.conf.json                      App config, CSP, window settings
dist-extras/
  Launch TV Featuring Composer.command  Gatekeeper bypass script for DMG distribution
```
