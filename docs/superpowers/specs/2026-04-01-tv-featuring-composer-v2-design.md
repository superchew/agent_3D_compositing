# TV Featuring Composer — v2 Feature Update Design Spec

**Date:** 2026-04-01
**Scope:** Items 1–7 + app rename + DMG/Gatekeeper fix
**Out of scope:** Reference Mode AI scene reconstruction (separate project)

---

## 0. App Rename

**From:** Scene Composer
**To:** TV Featuring Composer

Changes required:
- `src-tauri/tauri.conf.json`: `productName`, `identifier` (change to `com.tvfeaturing.composer`), window title
- `package.json`: `name`, `description`
- All user-facing strings in UI components
- First-run directory name: `~/Documents/TV Featuring Composer/models/`

---

## 1. Model Library — File-Based Pipeline

### User-facing directory

On first launch, Tauri creates:
```
~/Documents/TV Featuring Composer/
  models/
```

On every launch, the app scans this directory for supported 3D files and populates the Model Library panel automatically. Files added by the user persist indefinitely and survive app updates. Files are removed only when the user deletes them from the folder manually.

### Supported formats (priority order)

| Format | Extension | Notes |
|---|---|---|
| GLB | `.glb` | Primary. Three.js native, self-contained. |
| FBX | `.fbx` | Secondary. Common from Maya/Unity/Mixamo. |
| STL | `.stl` | Tertiary. Geometry only, no materials. Used for simple shapes. |
| USDZ/OBJ | — | Not supported. |

### Model Library UI

The Model Library panel has three sections:
1. **Figures** — male/female characters (hardcoded entries pointing to known filenames)
2. **Props** (file-based) — auto-populated from `models/` directory scan; any GLB/FBX/STL file not matching a figure filename appears here
3. **Primitives** (procedural) — box, sphere, cylinder, floor plane, wall; always present, no files needed

Clicking a prop entry adds it to the scene. Figures show an animation preset selector before/after placement.

### File-based model loading

When a model is added to the scene from a file:
1. Load via the appropriate Three.js loader (`GLTFLoader`, `FBXLoader`, `STLLoader`)
2. Traverse all meshes and apply a uniform grey clay material: `MeshStandardMaterial({ color: '#94a3b8', roughness: 0.75, metalness: 0.0 })`
3. No PBR textures are used. Original files are not modified.
4. Model is added to scene at origin, selected automatically.

### Default models shipped with app

Placed in `~/Documents/TV Featuring Composer/models/` on first run (copied from app bundle):

| Filename | Type | Source |
|---|---|---|
| `car_001.glb` | Prop | Provided GLB |
| `industrial_table.glb` | Prop | Provided GLB |
| `modern_chair.glb` | Prop | Provided GLB |
| `old_wooden_chair.glb` | Prop | Provided GLB |
| `human_fig_male_001.fbx` | Figure (male) | Mixamo Ch36, rigged |
| `human_fig_female_001.fbx` | Figure (female) | Mixamo, rigged |
| All animation FBX files | Animations | Mixamo clips |

`car_002.glb` is excluded (23MB, 144 meshes — too heavy).

---

## 2. Human Figures — Mixamo Animation System

### Architecture

The current `HumanoidFigure.jsx` procedural mannequin is replaced by a file-based character loader. The joint-angle pose system (PosePanel sliders) is replaced by animation preset selection.

### Character files

| Character | Mesh file | Skeleton |
|---|---|---|
| Male | `human_fig_male_001.fbx` (33MB) | `mixamorig:` namespace, ~65 bones |
| Female | `human_fig_female_001.fbx` (8.5MB) | `mixamorig:` namespace, ~65 bones |

Both use standard Mixamo `mixamorig:` bone naming. Animation clips are retargeted to this skeleton namespace.

### Animation clips

**Male (5 clips):**
- `human_fig_male_idle_001.fbx` → "Idle"
- `human_fig_male_idle_002.fbx` → "Idle 2"
- `human_fig_male_seated_001.fbx` → "Seated"
- `human_fig_male_lounging_001.fbx` → "Lounging"
- `human_fig_male_action_001.fbx` → "Action"

**Female (8 clips):**
- `human_fig_female_idle_001.fbx` → "Idle"
- `human_fig_female_action_001.fbx` → "Action"
- `human_fig_female_cute_sit_001.fbx` → "Cute Sit"
- `human_fig_female_seated_001.fbx` → "Seated"
- `human_fig_female_laying_001.fbx` → "Laying"
- `human_fig_female_lounging_001.fbx` → "Lounging"
- `human_fig_female_seductive_001.fbx` → "Seductive"
- `human_fig_female_twist_standing.fbx` → "Twist Standing"

### Implementation

- Load base character FBX with `FBXLoader`
- Load each animation FBX separately with `FBXLoader`, extract `animations[0]` clip
- Use Three.js `AnimationMixer` to play clips
- Default pose on add: "Idle" clip, paused at frame 0
- UI in right panel (replaces PosePanel for figures): dropdown to select animation preset
- Animation plays in loop while in the viewport so the user can scan through poses; a "Freeze" toggle pauses at current frame for composition use
- Grey clay material applied on load (traverse all skinned meshes)

### Tauri file loading

Tauri's `fs` plugin reads files from `~/Documents/TV Featuring Composer/models/`. The file contents are passed to Three.js loaders via `ArrayBuffer`. This is the Tauri-only path; no browser File System Access API is used.

---

## 3. Startup Backdrop

On every launch, a backdrop wall mesh is automatically added to the scene behind the subject area. It is not in the Model Library and does not appear in the Scene panel object list — it is a permanent scene element, togglable via a button in the toolbar or viewport.

**Geometry:** A large curved or flat plane mesh, positioned behind and slightly above the floor, curving to meet it (cyclorama/infinity cove shape). Initial implementation: two planes joined — a vertical wall 6 units wide × 4 units tall, positioned at z = -3, and a floor plane, with a smooth join. Can be simplified to a single wide wall plane initially.

**Default material:** Matte green (`#22c55e`), `MeshStandardMaterial`, roughness 1.0, no metalness. This is the standard chroma key / stage backdrop color.

**Controls:** A backdrop color picker in the toolbar or a dedicated "Backdrop" section — allows switching between green, grey, white, black, or custom color. Toggling backdrop visibility is a single button.

---

## 4. Viewport Overlays — Rule of Thirds + Aspect Ratio

### Rule of Thirds overlay

A 2D CSS overlay (absolutely positioned div, `pointer-events: none`, `z-index: 20`) drawn over the Three.js canvas. Renders a 3×3 grid of lines — 2 horizontal, 2 vertical — dividing the viewport into thirds. Lines are white at 20% opacity. Toggle button in the toolbar.

### Aspect ratio framing

The viewport displays a **letterbox/pillarbox overlay** showing the selected aspect ratio's crop region. Outside the crop area is darkened (semi-transparent black). The Three.js canvas itself always fills the full panel; the overlay just marks what will be in frame.

**Presets:**
| Label | Ratio | Description |
|---|---|---|
| 16:9 | 1.778 | HD broadcast (default) |
| 9:16 | 0.5625 | Vertical / social |
| 2.39:1 | 2.39 | Cinematic widescreen |

Switching aspect ratios updates both the crop overlay and (optionally) adjusts camera FOV hint. The Three.js camera FOV is not changed automatically — the user adjusts it manually. Aspect ratio selector lives in the toolbar as a button group or small dropdown.

Both overlays (rule of thirds + aspect ratio) are composited on top of each other and can be toggled independently.

---

## 5. Camera Preset Fix

### Root cause

`setCameraPosition` and `setCameraTarget` update Zustand state. `CameraSyncer` only syncs camera → store (one direction). `OrbitControls` owns the actual camera position and ignores the store. Clicking a preset updates the store but nothing moves.

### Fix

`CameraPanel` needs a ref to the `OrbitControls` instance. When a preset is clicked, call imperatively:

```javascript
controls.target.set(...preset.target)
controls.object.position.set(...preset.position)
controls.update()
```

Implementation: pass `controlsRef` from `SceneViewport` up to `App`, then down to `CameraPanel` via a store action or context. Simplest approach: add `setCameraLookAt(position, target)` to the store that triggers a one-shot imperative call via a ref registered by `SceneViewport`.

---

## 6. Viewport Aesthetics — Clay Look

Inspired by `3d_view.jpg` (Cinema 4D/Houdini-style clay viewport).

### Background

Change from near-black `#12161f` to a medium-dark neutral grey: `#2a2a2a` or similar. This separates the floor grid from the background visually.

### Lighting rig

Replace current light setup with a three-point clay render rig:

| Light | Type | Position | Intensity | Color |
|---|---|---|---|---|
| Key | DirectionalLight | [4, 8, 4] | 1.5 | warm white `#fff8f0` |
| Fill | DirectionalLight | [-4, 3, 2] | 0.4 | cool blue `#aac4ff` |
| Rim | DirectionalLight | [0, 4, -6] | 0.6 | neutral white |
| Ambient | AmbientLight | — | 0.3 | — |

Remove `hemisphereLight`. This rig produces the warm-key / cool-fill separation visible in the reference image that gives the clay shading depth.

### Floor grid

Replace `<Grid>` component with a custom grid that has:
- Higher contrast lines against the grey background
- A subtle two-tone: thin cell lines at medium grey, section lines slightly brighter
- Cell color: `#444444`, section color: `#666666`
- Slight fade at distance, no infinite grid (bounded 20×20 units)

This matches the distinct, readable grid in `3d_view.jpg` rather than blending into the background.

### Shadow

Ensure `castShadow` / `receiveShadow` is enabled on all loaded meshes (traverse on load). Floor plane receives shadows.

---

## 7. Transform Gizmos

When an object is selected, display a transform gizmo directly on it in the 3D viewport. Two modes, toggled from the toolbar:

### Translate mode (default)

XYZ axis arrows. Drag an arrow to move the object along that axis only. Drag the center square to move freely on the XY plane.

Implementation: `@react-three/drei` exports `<TransformControls>` which wraps Three.js `TransformControls`. Set `mode="translate"`.

### Rotate mode

XYZ rings. Drag a ring to rotate around that axis.

Implementation: same `<TransformControls>` component, `mode="rotate"`.

### Behavior

- `TransformControls` wraps the selected object's group
- When dragging the gizmo, `OrbitControls` is temporarily disabled (prevent orbit fighting with drag). `TransformControls` has an `onMouseDown`/`onMouseUp` event to disable/re-enable.
- On transform end, the new position/rotation is written back to Zustand store via `updateObject`
- Toolbar shows two toggle buttons: **Move** (arrow icon) and **Rotate** (circular arrow icon). Keyboard shortcuts: `G` = translate, `R` = rotate (matches Blender conventions)
- Gizmo is hidden in matte mode

---

## 8. DMG / Gatekeeper Fix + App Rename

### App rename

- `productName`: "TV Featuring Composer"
- `bundle identifier`: `com.tvfeaturing.composer`
- Window title: "TV Featuring Composer"
- First-run directory: `~/Documents/TV Featuring Composer/`

### Gatekeeper workaround launcher

Bundle a `Launch TV Featuring Composer.command` shell script in the DMG alongside the `.app`. Contents:

```bash
#!/bin/bash
APP="/Applications/TV Featuring Composer.app"
if [ -d "$APP" ]; then
  xattr -rc "$APP"
  open "$APP"
else
  osascript -e 'display alert "App not found" message "Please drag TV Featuring Composer to your Applications folder first."'
fi
```

The `.command` file itself will be quarantined on download. Recipients right-click → Open once (macOS shows "are you sure?" rather than "corrupted"). After that, double-click works normally. The script removes quarantine from the app then launches it.

Note: this is a workaround, not a permanent fix. The proper fix (Apple notarization) requires an Apple Developer Program membership ($99/year) and is a separate task if needed.

---

## Files to Create / Modify

| File | Change |
|---|---|
| `src-tauri/tauri.conf.json` | Rename, bundle ID, first-run dir |
| `package.json` | Name update |
| `src/store/sceneStore.js` | Add aspect ratio state, backdrop state, gizmo mode, imperative camera action |
| `src/components/Viewport/SceneViewport.jsx` | New lighting rig, grid, backdrop mesh, TransformControls, pass controlsRef |
| `src/components/Viewport/FigureModel.jsx` | New file: replaces HumanoidFigure.jsx; FBX loader + AnimationMixer |
| `src/components/Viewport/PropModel.jsx` | Add GLB/FBX/STL file loader path alongside procedural shapes |
| `src/components/Panels/ModelLibrary.jsx` | Scan models dir, show file-based props, figure entries |
| `src/components/Panels/PosePanel.jsx` | Replace joint sliders with animation preset dropdown |
| `src/components/Panels/CameraPanel.jsx` | Fix preset buttons with imperative camera move |
| `src/components/Toolbar/Toolbar.jsx` | Add: gizmo mode toggle, rule-of-thirds toggle, aspect ratio selector, backdrop toggle |
| `src/components/Viewport/ViewportOverlays.jsx` | New file: rule of thirds + aspect ratio crop overlay (CSS/SVG) |
| `src-tauri/src/lib.rs` (or `main.rs`) | Add Tauri command to read models directory, copy defaults on first run |
| `DMG/Launch TV Featuring Composer.command` | New launcher script for Gatekeeper bypass |

---

## Out of Scope

- Reference Mode AI scene reconstruction (separate project spec)
- Female figure additional animations beyond the 8 provided
- `car_002.glb` (too heavy, excluded)
- USDZ / OBJ format support
- Apple notarization (separate task, requires Developer account)
