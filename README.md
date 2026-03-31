# 3D Scene Composer

A browser and desktop app for compositing 3D scenes used as visual prompt guidance for AI-generated artwork. Place and pose humanoid figures, arrange props, frame the camera, and export color-coded matte maps to drive AI image workflows.

---

## What it does

- **Pose figures** — Place rigged humanoid figures and manipulate 18 joints (spine, arms, legs, head) with per-axis rotation sliders. Apply preset poses: T-Pose, A-Pose, Standing, Sitting, Walking, Arms Raised.
- **Reference photo overlay** — Upload a pose reference image and overlay it on the 3D viewport with adjustable opacity to match poses against real photos.
- **Props & environment** — Add chairs, tables, boxes, spheres, walls, cars, camera stands, light stands, and more.
- **Camera control** — Set FOV via lens equivalents (24mm–135mm) and jump to composition presets: eye level, low angle, high angle, bird's eye, close-up, wide, side, 3/4 view.
- **FX Puzzle Matte** — Assign a solid color (red, green, blue, yellow, cyan, magenta, orange, white) to each object. Toggle matte view to render flat-colored silhouettes on black — exactly like a VFX ID/puzzle matte. Annotate each color channel with a plain-language description that assembles into an AI prompt.
- **Export** — Save the normal scene render or the matte map as a PNG, ready to use as a ControlNet reference, inpainting mask, or prompt guidance image.

---

## Running the app

### In the browser

```bash
npm install
npm run dev
```

Open `http://localhost:5173` in any browser. To access from another device on the same network:

```bash
npm run dev -- --host
```

Then open the `Network:` URL shown in the terminal on your phone or tablet.

### As a macOS desktop app (Tauri)

Requires [Rust](https://rustup.rs) and Node.

```bash
# First time only
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
npm install

# Development (hot reload)
npm run tauri:dev

# Build a distributable .app
npm run tauri:build
# Output: src-tauri/target/release/bundle/macos/Scene Composer.app
```

The desktop app uses macOS's built-in WebKit engine — no bundled browser. The `.app` is ~5–10 MB.

---

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start Vite dev server (browser, localhost:5173) |
| `npm run build` | Build static frontend to `dist/` |
| `npm run preview` | Preview the production build locally |
| `npm run tauri:dev` | Launch as a native macOS desktop app with hot reload |
| `npm run tauri:build` | Package a distributable macOS `.app` bundle |

---

## Keyboard shortcuts

| Key | Mode |
|---|---|
| `Q` | Select — transform properties |
| `W` | Pose — joint editor |
| `E` | Matte — FX puzzle matte |
| `R` | Camera — FOV and composition presets |
| `T` | Reference — photo overlay |

---

## Stack

- [React 18](https://react.dev) + [Vite](https://vitejs.dev)
- [Three.js](https://threejs.org) via [@react-three/fiber](https://docs.pmnd.rs/react-three-fiber) and [@react-three/drei](https://github.com/pmndrs/drei)
- [Zustand](https://github.com/pmndrs/zustand) for state
- [Tailwind CSS v4](https://tailwindcss.com)
- [Tauri v2](https://tauri.app) for the desktop wrapper
- [Lucide React](https://lucide.dev) for icons

---

## Project structure

```
src/
  App.jsx                        Main layout
  store/sceneStore.js            Zustand state (objects, pose, matte, camera)
  components/
    Toolbar/Toolbar.jsx          Mode switcher + export buttons
    Viewport/
      SceneViewport.jsx          Three.js canvas, orbit controls
      HumanoidFigure.jsx         Procedural rigged humanoid (18 joints)
      PropModel.jsx              Chair, table, car, and other props
    Panels/
      ScenePanel.jsx             Scene hierarchy (visibility, delete)
      PropertiesPanel.jsx        Transform + matte color assignment
      PosePanel.jsx              Joint sliders + pose presets
      MattePanel.jsx             Color channel labels + prompt preview
      CameraPanel.jsx            FOV + composition presets
      ReferencePanel.jsx         Photo upload + opacity slider
      ModelLibrary.jsx           Add figures and props to scene
src-tauri/                       Tauri desktop wrapper (Rust)
```
