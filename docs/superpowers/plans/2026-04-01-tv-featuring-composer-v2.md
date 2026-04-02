# TV Featuring Composer v2 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Upgrade Scene Composer → TV Featuring Composer with file-based model pipeline, Mixamo figure system, transform gizmos, viewport overlays, camera fix, clay aesthetics, and DMG Gatekeeper workaround.

**Architecture:** Tauri v2 desktop app; Rust backend commands handle filesystem (no fs plugin needed — use `std::fs` directly via custom commands); frontend loads 3D files as `ArrayBuffer` via `invoke('read_model_file')` and parses with Three.js loaders; all loaded meshes have textures stripped and grey clay material applied at runtime.

**Tech Stack:** React 19, @react-three/fiber, @react-three/drei, Three.js (GLTFLoader, FBXLoader, STLLoader), Zustand, Tauri v2, Vite.

**Spec:** `docs/superpowers/specs/2026-04-01-tv-featuring-composer-v2-design.md`

---

## Phase 1: Foundation

---

### Task 1: App Rename

**Files:**
- Modify: `src-tauri/tauri.conf.json`
- Modify: `src-tauri/Cargo.toml`
- Modify: `package.json`
- Modify: `src/components/Toolbar/Toolbar.jsx`

- [ ] **Step 1: Update tauri.conf.json**

Replace the entire file with:

```json
{
  "productName": "TV Featuring Composer",
  "version": "0.1.0",
  "identifier": "com.tvfeaturing.composer",
  "build": {
    "beforeDevCommand": "npm run dev",
    "devUrl": "http://localhost:5173",
    "beforeBuildCommand": "npm run build",
    "frontendDist": "../dist"
  },
  "app": {
    "windows": [
      {
        "title": "TV Featuring Composer",
        "width": 1400,
        "height": 900,
        "minWidth": 1000,
        "minHeight": 700,
        "resizable": true,
        "fullscreen": false
      }
    ],
    "security": {
      "csp": "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' blob: data:; connect-src 'self'"
    }
  },
  "bundle": {
    "active": true,
    "targets": "all",
    "icon": [
      "icons/32x32.png",
      "icons/128x128.png",
      "icons/128x128@2x.png",
      "icons/icon.icns",
      "icons/icon.ico"
    ]
  }
}
```

- [ ] **Step 2: Update Cargo.toml package name**

In `src-tauri/Cargo.toml`, change:
```toml
[package]
name = "tv-featuring-composer"
version = "0.1.0"
description = "TV Featuring Composer — 3D scene layout for AI artwork workflows"
```

- [ ] **Step 3: Update package.json**

In `package.json`, change the `"name"` field to `"tv-featuring-composer"`.

- [ ] **Step 4: Update Toolbar branding**

In `src/components/Toolbar/Toolbar.jsx`, change line 23:
```jsx
<span className="text-xs font-semibold text-slate-300 tracking-wide">TV Featuring Composer</span>
```

- [ ] **Step 5: Verify dev server starts**

```bash
npm run dev
```
Expected: browser tab opens at localhost:5173, toolbar shows "TV Featuring Composer".

- [ ] **Step 6: Commit**

```bash
git add src-tauri/tauri.conf.json src-tauri/Cargo.toml package.json src/components/Toolbar/Toolbar.jsx
git commit -m "feat: rename app to TV Featuring Composer, update bundle ID"
```

---

### Task 2: DMG Gatekeeper Launcher Script

**Files:**
- Create: `dist-extras/Launch TV Featuring Composer.command`

- [ ] **Step 1: Create dist-extras directory and launcher script**

```bash
mkdir -p /Users/eddie/Github/agent_3D_compositing/dist-extras
```

Create `dist-extras/Launch TV Featuring Composer.command`:

```bash
#!/bin/bash
# TV Featuring Composer — Gatekeeper bypass launcher
# Recipients: right-click this file → Open (once), then double-click works normally.

APP="/Applications/TV Featuring Composer.app"

if [ -d "$APP" ]; then
  xattr -rc "$APP"
  open "$APP"
else
  osascript -e 'display alert "App Not Found" message "Please drag '"'"'TV Featuring Composer.app'"'"' to your Applications folder first, then run this launcher."'
fi
```

- [ ] **Step 2: Make executable**

```bash
chmod +x "/Users/eddie/Github/agent_3D_compositing/dist-extras/Launch TV Featuring Composer.command"
```

- [ ] **Step 3: Commit**

```bash
git add "dist-extras/Launch TV Featuring Composer.command"
git commit -m "feat: add Gatekeeper bypass launcher script for DMG distribution"
```

---

### Task 3: Tauri Backend — Filesystem Commands

**Files:**
- Modify: `src-tauri/src/lib.rs`

- [ ] **Step 1: Add filesystem commands to lib.rs**

Replace the entire contents of `src-tauri/src/lib.rs` with:

```rust
use std::path::PathBuf;
use tauri::Manager;

fn get_models_dir(app: &tauri::AppHandle) -> Result<PathBuf, String> {
    let docs = app
        .path()
        .document_dir()
        .map_err(|e| format!("Cannot resolve Documents dir: {e}"))?;
    Ok(docs.join("TV Featuring Composer").join("models"))
}

#[tauri::command]
fn init_user_dir(app: tauri::AppHandle) -> Result<String, String> {
    let dir = get_models_dir(&app)?;
    std::fs::create_dir_all(&dir)
        .map_err(|e| format!("Cannot create models dir: {e}"))?;
    Ok(dir.to_string_lossy().into_owned())
}

#[tauri::command]
fn list_model_files(app: tauri::AppHandle) -> Result<Vec<String>, String> {
    let dir = get_models_dir(&app)?;
    if !dir.exists() {
        return Ok(vec![]);
    }
    let entries = std::fs::read_dir(&dir)
        .map_err(|e| format!("Cannot read models dir: {e}"))?;
    let files: Vec<String> = entries
        .filter_map(|e| e.ok())
        .filter_map(|e| {
            let path = e.path();
            if !path.is_file() { return None; }
            let ext = path.extension()?.to_str()?.to_lowercase();
            if ["glb", "fbx", "stl"].contains(&ext.as_str()) {
                Some(path.to_string_lossy().into_owned())
            } else {
                None
            }
        })
        .collect();
    Ok(files)
}

#[tauri::command]
fn read_model_file(path: String) -> Result<Vec<u8>, String> {
    std::fs::read(&path).map_err(|e| format!("Cannot read file {path}: {e}"))
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![
            init_user_dir,
            list_model_files,
            read_model_file,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
```

- [ ] **Step 2: Test Rust compiles**

```bash
cd src-tauri && cargo build 2>&1 | tail -5
```
Expected: `Finished dev [unoptimized + debuginfo] target(s)` with no errors.

- [ ] **Step 3: Commit**

```bash
git add src-tauri/src/lib.rs
git commit -m "feat: add Tauri commands for models dir init and file listing"
```

---

### Task 4: Frontend Model Bridge + Clay Material Utility

**Files:**
- Create: `src/lib/tauriBridge.js`
- Create: `src/lib/clayMaterial.js`

- [ ] **Step 1: Create tauriBridge.js**

Create `src/lib/tauriBridge.js`:

```javascript
// Wraps Tauri invoke calls. Falls back gracefully when running in browser (dev without Tauri).
const isTauri = () => typeof window !== 'undefined' && window.__TAURI_INTERNALS__ !== undefined

async function invokeOrNull(cmd, args) {
  if (!isTauri()) return null
  const { invoke } = await import('@tauri-apps/api/core')
  return invoke(cmd, args)
}

/**
 * Creates ~/Documents/TV Featuring Composer/models/ if it doesn't exist.
 * Returns the absolute path string, or null in browser mode.
 */
export async function initUserDir() {
  return invokeOrNull('init_user_dir')
}

/**
 * Returns array of absolute file paths for all GLB/FBX/STL files in models dir.
 * Returns [] in browser mode.
 */
export async function listModelFiles() {
  return invokeOrNull('list_model_files') ?? []
}

/**
 * Reads a file from disk and returns its contents as ArrayBuffer.
 * Returns null in browser mode.
 */
export async function readModelFile(path) {
  const bytes = await invokeOrNull('read_model_file', { path })
  if (!bytes) return null
  return new Uint8Array(bytes).buffer
}
```

- [ ] **Step 2: Create clayMaterial.js**

Create `src/lib/clayMaterial.js`:

```javascript
import * as THREE from 'three'

const CLAY_COLOR = '#94a3b8'
const CLAY_ROUGHNESS = 0.75
const CLAY_METALNESS = 0.0

/**
 * Traverses an Object3D and replaces every mesh's material with
 * a uniform grey clay MeshStandardMaterial. Also enables shadows.
 */
export function applyClayMaterial(object) {
  const mat = new THREE.MeshStandardMaterial({
    color: CLAY_COLOR,
    roughness: CLAY_ROUGHNESS,
    metalness: CLAY_METALNESS,
  })
  object.traverse((child) => {
    if (child.isMesh || child.isSkinnedMesh) {
      child.material = mat
      child.castShadow = true
      child.receiveShadow = true
    }
  })
}
```

- [ ] **Step 3: Verify imports resolve**

```bash
npm run build 2>&1 | grep -i error | head -10
```
Expected: no import errors.

- [ ] **Step 4: Commit**

```bash
git add src/lib/tauriBridge.js src/lib/clayMaterial.js
git commit -m "feat: add Tauri bridge and clay material utility"
```

---

## Phase 2: Model Pipeline

---

### Task 5: Three.js File Loaders

**Files:**
- Create: `src/lib/fileLoader.js`

- [ ] **Step 1: Create fileLoader.js**

Create `src/lib/fileLoader.js`:

```javascript
import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader.js'
import { STLLoader } from 'three/examples/jsm/loaders/STLLoader.js'
import { applyClayMaterial } from './clayMaterial.js'

/**
 * Detects format from file path extension.
 * Returns 'glb' | 'fbx' | 'stl' | null
 */
export function detectFormat(filePath) {
  const ext = filePath.split('.').pop()?.toLowerCase()
  if (ext === 'glb' || ext === 'gltf') return 'glb'
  if (ext === 'fbx') return 'fbx'
  if (ext === 'stl') return 'stl'
  return null
}

/**
 * Loads a 3D model from an ArrayBuffer and returns a THREE.Object3D.
 * Applies clay material to all meshes.
 * @param {ArrayBuffer} buffer
 * @param {string} format — 'glb' | 'fbx' | 'stl'
 * @returns {Promise<THREE.Object3D>}
 */
export async function loadModelFromBuffer(buffer, format) {
  if (format === 'glb') {
    return loadGLB(buffer)
  } else if (format === 'fbx') {
    return loadFBX(buffer)
  } else if (format === 'stl') {
    return loadSTL(buffer)
  }
  throw new Error(`Unsupported format: ${format}`)
}

function loadGLB(buffer) {
  return new Promise((resolve, reject) => {
    const loader = new GLTFLoader()
    loader.parse(buffer, '', (gltf) => {
      applyClayMaterial(gltf.scene)
      resolve(gltf.scene)
    }, reject)
  })
}

function loadFBX(buffer) {
  return new Promise((resolve, reject) => {
    try {
      const loader = new FBXLoader()
      const object = loader.parse(buffer, '')
      applyClayMaterial(object)
      resolve(object)
    } catch (err) {
      reject(err)
    }
  })
}

function loadSTL(buffer) {
  return new Promise((resolve, reject) => {
    try {
      const loader = new STLLoader()
      const geometry = loader.parse(buffer)
      const mat = new THREE.MeshStandardMaterial({
        color: '#94a3b8',
        roughness: 0.75,
        metalness: 0.0,
      })
      const mesh = new THREE.Mesh(geometry, mat)
      mesh.castShadow = true
      mesh.receiveShadow = true
      const group = new THREE.Group()
      group.add(mesh)
      resolve(group)
    } catch (err) {
      reject(err)
    }
  })
}

/**
 * Loads an FBX animation file and returns the first AnimationClip.
 * Used for loading Mixamo animation-only FBX files.
 * @param {ArrayBuffer} buffer
 * @returns {THREE.AnimationClip | null}
 */
export function loadAnimationClip(buffer) {
  try {
    const loader = new FBXLoader()
    const fbx = loader.parse(buffer, '')
    return fbx.animations?.[0] ?? null
  } catch (err) {
    console.warn('Failed to load animation clip:', err)
    return null
  }
}
```

- [ ] **Step 2: Verify build has no import errors**

```bash
npm run build 2>&1 | grep -i error | head -10
```
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/lib/fileLoader.js
git commit -m "feat: add GLB/FBX/STL file loaders with clay material"
```

---

### Task 6: Store — File Model Type + Available Models

**Files:**
- Modify: `src/store/sceneStore.js`

- [ ] **Step 1: Add availableModels state and fileModel type to sceneStore.js**

In `src/store/sceneStore.js`, after the `idCounter` line, add a helper:

```javascript
const defaultFileModel = (filePath, position = [0, 0, 0]) => ({
  id: nextId(),
  type: 'fileModel',          // new type alongside 'model' and 'figure'
  filePath,
  name: filePath.split('/').pop().replace(/\.[^.]+$/, ''),
  position,
  rotation: [0, 0, 0],
  scale: [1, 1, 1],
  matteColor: 'none',
  visible: true,
})
```

In the `useSceneStore` create call, add to initial state:

```javascript
// Available models scanned from ~/Documents/TV Featuring Composer/models/
availableModels: [],   // Array of { filePath, name, format, isFigure }
modelsLoaded: false,
```

And add these actions:

```javascript
setAvailableModels: (models) => set({ availableModels: models, modelsLoaded: true }),

addFileModel: (filePath, position) => {
  const model = defaultFileModel(filePath, position || [0, 0, 0])
  set(s => ({ objects: [...s.objects, model], selectedId: model.id }))
},
```

- [ ] **Step 2: Verify dev server starts without errors**

```bash
npm run dev
```
Open browser console — no errors expected.

- [ ] **Step 3: Commit**

```bash
git add src/store/sceneStore.js
git commit -m "feat: add fileModel type and availableModels state to store"
```

---

### Task 7: PropModel — Render File-Based Models

**Files:**
- Modify: `src/components/Viewport/PropModel.jsx`

- [ ] **Step 1: Rewrite PropModel.jsx to handle both procedural and file-based models**

Replace entire `src/components/Viewport/PropModel.jsx`:

```jsx
import { useEffect, useState, useRef } from 'react'
import * as THREE from 'three'
import { MATTE_COLORS } from '../../store/sceneStore'
import { loadModelFromBuffer, detectFormat } from '../../lib/fileLoader'
import { readModelFile } from '../../lib/tauriBridge'

const deg = (d) => (d * Math.PI) / 180

// ── Procedural shapes ──────────────────────────────────────────────────────

function Chair({ color }) {
  return (
    <group>
      <mesh position={[0, 0.45, 0]}><boxGeometry args={[0.5, 0.05, 0.5]} /><meshStandardMaterial color={color} roughness={0.8} /></mesh>
      <mesh position={[0, 0.75, -0.23]}><boxGeometry args={[0.5, 0.6, 0.05]} /><meshStandardMaterial color={color} roughness={0.8} /></mesh>
      {[[-0.22, -0.22], [-0.22, 0.22], [0.22, -0.22], [0.22, 0.22]].map(([x, z], i) => (
        <mesh key={i} position={[x, 0.22, z]}><boxGeometry args={[0.05, 0.44, 0.05]} /><meshStandardMaterial color={color} roughness={0.8} /></mesh>
      ))}
    </group>
  )
}

function Table({ color }) {
  return (
    <group>
      <mesh position={[0, 0.74, 0]}><boxGeometry args={[1.2, 0.06, 0.7]} /><meshStandardMaterial color={color} roughness={0.7} /></mesh>
      {[[-0.52, -0.28], [-0.52, 0.28], [0.52, -0.28], [0.52, 0.28]].map(([x, z], i) => (
        <mesh key={i} position={[x, 0.36, z]}><boxGeometry args={[0.06, 0.72, 0.06]} /><meshStandardMaterial color={color} roughness={0.7} /></mesh>
      ))}
    </group>
  )
}

function Box({ color }) {
  return <mesh><boxGeometry args={[0.5, 0.5, 0.5]} /><meshStandardMaterial color={color} roughness={0.7} /></mesh>
}

function Sphere({ color }) {
  return <mesh position={[0, 0.25, 0]}><sphereGeometry args={[0.25, 32, 24]} /><meshStandardMaterial color={color} roughness={0.4} metalness={0.1} /></mesh>
}

function Cylinder({ color }) {
  return <mesh position={[0, 0.4, 0]}><cylinderGeometry args={[0.2, 0.2, 0.8, 32]} /><meshStandardMaterial color={color} roughness={0.5} /></mesh>
}

function Plane({ color }) {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.001, 0]}>
      <planeGeometry args={[2, 2]} />
      <meshStandardMaterial color={color} roughness={0.9} side={THREE.DoubleSide} />
    </mesh>
  )
}

function Wall({ color }) {
  return (
    <mesh position={[0, 1.2, 0]}>
      <boxGeometry args={[3, 2.4, 0.1]} />
      <meshStandardMaterial color={color} roughness={0.9} />
    </mesh>
  )
}

function Camera3D({ color }) {
  return (
    <group>
      <mesh position={[0, 0.1, 0]}><boxGeometry args={[0.25, 0.18, 0.12]} /><meshStandardMaterial color={color} roughness={0.3} metalness={0.6} /></mesh>
      <mesh position={[0, 0.1, 0.1]} rotation={[Math.PI/2, 0, 0]}><cylinderGeometry args={[0.05, 0.06, 0.12, 12]} /><meshStandardMaterial color="#1a1a2e" roughness={0.2} metalness={0.8} /></mesh>
    </group>
  )
}

function Light3D({ color }) {
  return (
    <group>
      <mesh position={[0, 0.3, 0]}><cylinderGeometry args={[0.06, 0.06, 0.6, 8]} /><meshStandardMaterial color="#334155" roughness={0.5} /></mesh>
      <mesh position={[0, 0.65, 0]}><boxGeometry args={[0.3, 0.15, 0.3]} /><meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.3} /></mesh>
    </group>
  )
}

function Car({ color }) {
  return (
    <group>
      <mesh position={[0, 0.25, 0]}><boxGeometry args={[1.8, 0.5, 0.9]} /><meshStandardMaterial color={color} roughness={0.2} metalness={0.7} /></mesh>
      <mesh position={[0, 0.62, 0.05]}><boxGeometry args={[1.1, 0.38, 0.85]} /><meshStandardMaterial color={color} roughness={0.2} metalness={0.7} /></mesh>
      {[[-0.6, -0.38], [-0.6, 0.38], [0.6, -0.38], [0.6, 0.38]].map(([x, z], i) => (
        <mesh key={i} position={[x, 0.15, z]} rotation={[Math.PI/2, 0, 0]}>
          <torusGeometry args={[0.15, 0.06, 8, 16]} />
          <meshStandardMaterial color="#1a1a2e" roughness={0.9} />
        </mesh>
      ))}
    </group>
  )
}

const PROCEDURAL_MAP = {
  chair: Chair, table: Table, box: Box, sphere: Sphere,
  cylinder: Cylinder, plane: Plane, wall: Wall,
  camera_prop: Camera3D, light_stand: Light3D, car: Car,
}

// ── File-based model loader ────────────────────────────────────────────────

function FileModel({ filePath }) {
  const [obj3d, setObj3d] = useState(null)

  useEffect(() => {
    let cancelled = false
    async function load() {
      const format = detectFormat(filePath)
      if (!format) return
      const buffer = await readModelFile(filePath)
      if (!buffer || cancelled) return
      try {
        const loaded = await loadModelFromBuffer(buffer, format)
        if (!cancelled) setObj3d(loaded)
      } catch (err) {
        console.warn(`Failed to load model ${filePath}:`, err)
      }
    }
    load()
    return () => { cancelled = true }
  }, [filePath])

  if (!obj3d) return null
  return <primitive object={obj3d} />
}

// ── Main export ────────────────────────────────────────────────────────────

export default function PropModel({ object, isSelected, matteMode }) {
  const { modelType, filePath, position, rotation, scale, matteColor, type } = object
  const matteEntry = MATTE_COLORS.find(m => m.id === matteColor)

  const color = matteMode && matteEntry?.rgb
    ? `rgb(${matteEntry.rgb.map(v => Math.round(v * 255)).join(',')})`
    : '#94a3b8'

  return (
    <group
      position={position}
      rotation={rotation.map(deg)}
      scale={scale}
    >
      {type === 'fileModel' && filePath
        ? <FileModel filePath={filePath} />
        : (() => {
            const Component = PROCEDURAL_MAP[modelType] || Box
            return <Component color={color} />
          })()
      }
    </group>
  )
}
```

- [ ] **Step 2: Run dev and verify existing procedural models still render**

```bash
npm run dev
```
Add a Box and Sphere from the library. Confirm they render as before.

- [ ] **Step 3: Commit**

```bash
git add src/components/Viewport/PropModel.jsx
git commit -m "feat: PropModel supports file-based GLB/FBX/STL loading"
```

---

### Task 8: ModelLibrary — Scan and Display File-Based Models

**Files:**
- Modify: `src/components/Panels/ModelLibrary.jsx`
- Modify: `src/App.jsx`

- [ ] **Step 1: Update App.jsx to init models on mount**

In `src/App.jsx`, add the following imports at the top:

```javascript
import { useEffect } from 'react'
import { initUserDir, listModelFiles } from './lib/tauriBridge'
import { detectFormat } from './lib/fileLoader'
```

Inside the `App` component function, before the `return`, add:

```javascript
const { setAvailableModels } = useSceneStore()

useEffect(() => {
  async function loadModels() {
    await initUserDir()
    const paths = await listModelFiles()
    const FIGURE_NAMES = ['human_fig_male', 'human_fig_female']
    const models = paths.map(fp => {
      const name = fp.split('/').pop().replace(/\.[^.]+$/, '')
      const isFigure = FIGURE_NAMES.some(n => name.startsWith(n) && !name.includes('action') && !name.includes('idle') && !name.includes('seated') && !name.includes('lounging') && !name.includes('laying') && !name.includes('twist') && !name.includes('cute') && !name.includes('seductive'))
      const isAnimation = name.includes('idle') || name.includes('action') || name.includes('seated') || name.includes('lounging') || name.includes('laying') || name.includes('twist') || name.includes('cute_sit') || name.includes('seductive')
      return {
        filePath: fp,
        name,
        format: detectFormat(fp),
        isFigure,
        isAnimation,
      }
    })
    setAvailableModels(models)
  }
  loadModels()
}, [setAvailableModels])
```

- [ ] **Step 2: Rewrite ModelLibrary.jsx**

Replace entire `src/components/Panels/ModelLibrary.jsx`:

```jsx
import { Upload, User, Package, Box as BoxIcon } from 'lucide-react'
import { useSceneStore } from '../../store/sceneStore'

const PROCEDURAL_PRIMITIVES = [
  { label: 'Box',         modelType: 'box',         icon: '📦' },
  { label: 'Sphere',      modelType: 'sphere',      icon: '⚪' },
  { label: 'Cylinder',    modelType: 'cylinder',    icon: '🥫' },
  { label: 'Floor Plane', modelType: 'plane',       icon: '▬'  },
  { label: 'Wall',        modelType: 'wall',        icon: '🧱' },
  { label: 'Camera Prop', modelType: 'camera_prop', icon: '📷' },
  { label: 'Light Stand', modelType: 'light_stand', icon: '💡' },
]

function toDisplayName(name) {
  return name
    .replace(/_/g, ' ')
    .replace(/\b\w/g, c => c.toUpperCase())
    .replace(/\d{3}$/, s => ` ${parseInt(s, 10)}`)
    .trim()
}

export default function ModelLibrary() {
  const { addFigure, addModel, addFileModel, availableModels } = useSceneStore()

  const figures = availableModels.filter(m => m.isFigure)
  const fileProps = availableModels.filter(m => !m.isFigure && !m.isAnimation)

  return (
    <div className="panel flex flex-col h-full">
      <div className="panel-header">Model Library</div>
      <div className="flex-1 overflow-y-auto p-2 space-y-3">

        {/* Figures */}
        {figures.length > 0 && (
          <div>
            <div className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold mb-1.5 px-1 flex items-center gap-1">
              <User size={10} /> Figures
            </div>
            <div className="grid grid-cols-2 gap-1">
              {figures.map(f => (
                <button
                  key={f.filePath}
                  className="btn btn-secondary flex-col items-center py-3 gap-1 text-[10px] hover:border-blue-700/60 hover:bg-blue-950/30 transition-colors"
                  onClick={() => addFileModel(f.filePath, [Math.random() * 2 - 1, 0, Math.random() * 2 - 1])}
                >
                  <span className="text-xl">🧍</span>
                  <span>{toDisplayName(f.name)}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* File-based props */}
        {fileProps.length > 0 && (
          <div>
            <div className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold mb-1.5 px-1 flex items-center gap-1">
              <Package size={10} /> Props
            </div>
            <div className="grid grid-cols-2 gap-1">
              {fileProps.map(p => (
                <button
                  key={p.filePath}
                  className="btn btn-secondary flex-col items-center py-2 gap-1 text-[10px] hover:border-slate-600 transition-colors"
                  onClick={() => addFileModel(p.filePath, [Math.random() * 3 - 1.5, 0, Math.random() * 3 - 1.5])}
                >
                  <span className="text-base">📦</span>
                  <span className="text-center leading-tight">{toDisplayName(p.name)}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Procedural primitives — always present */}
        <div>
          <div className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold mb-1.5 px-1 flex items-center gap-1">
            <BoxIcon size={10} /> Primitives
          </div>
          <div className="grid grid-cols-2 gap-1">
            {PROCEDURAL_PRIMITIVES.map(p => (
              <button
                key={p.label}
                className="btn btn-secondary flex-col items-center py-2 gap-1 text-[10px] hover:border-slate-600 transition-colors"
                onClick={() => addModel(p.modelType, [Math.random() * 3 - 1.5, 0, Math.random() * 3 - 1.5])}
              >
                <span className="text-base">{p.icon}</span>
                <span>{p.label}</span>
              </button>
            ))}
          </div>
        </div>

        {availableModels.length === 0 && (
          <div className="text-[10px] text-slate-600 p-2 text-center leading-relaxed">
            Drop GLB, FBX, or STL files into<br />
            <span className="text-slate-500">~/Documents/TV Featuring Composer/models/</span><br />
            and restart the app.
          </div>
        )}
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Run dev and confirm library populates**

```bash
npm run dev
```
In the Tauri dev build (`npm run tauri:dev`), the models folder should be created and props/figures should appear in the library. In browser-only mode (`npm run dev`), the library shows only Primitives (expected — no Tauri).

- [ ] **Step 4: Commit**

```bash
git add src/components/Panels/ModelLibrary.jsx src/App.jsx
git commit -m "feat: ModelLibrary scans models dir, shows file-based props and figures"
```

---

## Phase 3: Human Figures

---

### Task 9: FigureModel Component — FBX + AnimationMixer

**Files:**
- Create: `src/components/Viewport/FigureModel.jsx`
- Delete: `src/components/Viewport/HumanoidFigure.jsx` (after this task)

- [ ] **Step 1: Create FigureModel.jsx**

Create `src/components/Viewport/FigureModel.jsx`:

```jsx
import { useEffect, useRef, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader.js'
import { applyClayMaterial } from '../../lib/clayMaterial'
import { readModelFile } from '../../lib/tauriBridge'

const deg = (d) => (d * Math.PI) / 180

/**
 * Loads an FBX file as Object3D from a Tauri file path.
 */
async function loadFBXFromPath(filePath) {
  const buffer = await readModelFile(filePath)
  if (!buffer) return null
  const loader = new FBXLoader()
  return loader.parse(buffer, '')
}

/**
 * Renders a Mixamo FBX character with AnimationMixer.
 * object.filePath        — path to base character FBX (with skin)
 * object.animationPaths  — { [label]: filePath } map of animation clips
 * object.activeAnimation — label of currently selected animation
 */
export default function FigureModel({ object, isSelected }) {
  const { filePath, animationPaths = {}, activeAnimation, position, rotation, scale } = object
  const [charObj, setCharObj] = useState(null)
  const mixerRef = useRef(null)
  const actionsRef = useRef({})
  const currentActionRef = useRef(null)

  // Load character mesh once
  useEffect(() => {
    if (!filePath) return
    let cancelled = false
    loadFBXFromPath(filePath).then(fbx => {
      if (cancelled || !fbx) return
      applyClayMaterial(fbx)
      // Scale Mixamo characters (they export at 100x)
      fbx.scale.setScalar(0.01)
      setCharObj(fbx)
      mixerRef.current = new THREE.AnimationMixer(fbx)
    }).catch(err => console.warn('FigureModel load error:', err))
    return () => { cancelled = true }
  }, [filePath])

  // Load animation clips whenever animationPaths changes
  useEffect(() => {
    if (!charObj || !mixerRef.current) return
    let cancelled = false
    const mixer = mixerRef.current
    actionsRef.current = {}

    async function loadClips() {
      for (const [label, animPath] of Object.entries(animationPaths)) {
        if (cancelled) break
        const buffer = await readModelFile(animPath)
        if (!buffer || cancelled) continue
        try {
          const loader = new FBXLoader()
          const animFbx = loader.parse(buffer, '')
          const clip = animFbx.animations?.[0]
          if (clip) {
            actionsRef.current[label] = mixer.clipAction(clip)
          }
        } catch (err) {
          console.warn(`Failed to load animation ${label}:`, err)
        }
      }
      // Play the active animation after all clips load
      if (!cancelled && activeAnimation && actionsRef.current[activeAnimation]) {
        actionsRef.current[activeAnimation].play()
        currentActionRef.current = actionsRef.current[activeAnimation]
      }
    }
    loadClips()
    return () => { cancelled = true }
  }, [charObj, animationPaths])

  // Switch animations when activeAnimation changes
  useEffect(() => {
    const next = actionsRef.current[activeAnimation]
    if (!next) return
    if (currentActionRef.current && currentActionRef.current !== next) {
      currentActionRef.current.fadeOut(0.3)
    }
    next.reset().fadeIn(0.3).play()
    currentActionRef.current = next
  }, [activeAnimation])

  // Update mixer each frame
  useFrame((_, delta) => {
    mixerRef.current?.update(delta)
  })

  if (!charObj) {
    // Placeholder while loading
    return (
      <group position={position} rotation={rotation.map(deg)} scale={scale}>
        <mesh>
          <capsuleGeometry args={[0.2, 1.2, 8, 16]} />
          <meshStandardMaterial color="#475569" roughness={0.8} wireframe />
        </mesh>
      </group>
    )
  }

  return (
    <group position={position} rotation={rotation.map(deg)} scale={scale}>
      <primitive object={charObj} />
    </group>
  )
}
```

- [ ] **Step 2: Verify no import errors**

```bash
npm run build 2>&1 | grep -i error | head -10
```

- [ ] **Step 3: Commit**

```bash
git add src/components/Viewport/FigureModel.jsx
git commit -m "feat: FigureModel loads Mixamo FBX with AnimationMixer"
```

---

### Task 10: Store + PosePanel — Figure Animation State

**Files:**
- Modify: `src/store/sceneStore.js`
- Modify: `src/components/Panels/PosePanel.jsx`
- Modify: `src/components/Viewport/SceneViewport.jsx`

- [ ] **Step 1: Add figure animation state to sceneStore.js**

In `src/store/sceneStore.js`, update `defaultFigure` and add animation actions.

Replace `defaultFigure`:

```javascript
const defaultFigure = (filePath, position = [0, 0, 0]) => ({
  id: nextId(),
  type: 'figure',
  filePath,
  name: filePath ? filePath.split('/').pop().replace(/\.[^.]+$/, '') : 'Figure',
  position,
  rotation: [0, 0, 0],
  scale: [1, 1, 1],
  matteColor: 'none',
  animationPaths: {},     // { label: filePath }
  activeAnimation: null,
  visible: true,
})
```

Update `addFigure` and add `addFileModel` (used by ModelLibrary for both figures and props) and `setFigureAnimation`:

```javascript
addFigure: (filePath, position) => {
  const fig = defaultFigure(filePath, position || [0, 0, 0])
  set(s => ({ objects: [...s.objects, fig], selectedId: fig.id }))
},

addFileModel: (filePath, position) => {
  // Detect if this is a figure base mesh
  const FIGURE_BASES = ['human_fig_male_001', 'human_fig_female_001']
  const name = filePath.split('/').pop().replace(/\.[^.]+$/, '')
  if (FIGURE_BASES.some(n => name === n)) {
    const fig = defaultFigure(filePath, position || [0, 0, 0])
    set(s => ({ objects: [...s.objects, fig], selectedId: fig.id }))
  } else {
    const model = defaultFileModel(filePath, position || [0, 0, 0])
    set(s => ({ objects: [...s.objects, model], selectedId: model.id }))
  }
},

setFigureAnimationPaths: (id, animationPaths) => {
  set(s => ({
    objects: s.objects.map(o => o.id === id ? { ...o, animationPaths } : o)
  }))
},

setActiveAnimation: (id, label) => {
  set(s => ({
    objects: s.objects.map(o => o.id === id ? { ...o, activeAnimation: label } : o)
  }))
},
```

- [ ] **Step 2: Rewrite PosePanel.jsx as AnimationPanel**

Replace entire `src/components/Panels/PosePanel.jsx`:

```jsx
import { useEffect } from 'react'
import { useSceneStore } from '../../store/sceneStore'

// Maps figure base filename → animation clip filenames and their labels.
// Keys must match the `name` field (filename without extension).
const FIGURE_ANIMATIONS = {
  'human_fig_male_001': [
    { label: 'Idle',      file: 'human_fig_male_idle_001.fbx' },
    { label: 'Idle 2',    file: 'human_fig_male_idle_002.fbx' },
    { label: 'Seated',    file: 'human_fig_male_seated_001.fbx' },
    { label: 'Lounging',  file: 'human_fig_male_lounging_001.fbx' },
    { label: 'Action',    file: 'human_fig_male_action_001.fbx' },
  ],
  'human_fig_female_001': [
    { label: 'Idle',          file: 'human_fig_female_idle_001.fbx' },
    { label: 'Action',        file: 'human_fig_female_action_001.fbx' },
    { label: 'Cute Sit',      file: 'human_fig_female_cute_sit_001.fbx' },
    { label: 'Seated',        file: 'human_fig_female_seated_001.fbx' },
    { label: 'Laying',        file: 'human_fig_female_laying_001.fbx' },
    { label: 'Lounging',      file: 'human_fig_female_lounging_001.fbx' },
    { label: 'Seductive',     file: 'human_fig_female_seductive_001.fbx' },
    { label: 'Twist Standing',file: 'human_fig_female_twist_standing.fbx' },
  ],
}

export default function PosePanel() {
  const {
    objects, selectedId,
    setFigureAnimationPaths, setActiveAnimation, availableModels
  } = useSceneStore()

  const obj = objects.find(o => o.id === selectedId && o.type === 'figure')

  // Wire up animation paths when a figure is selected
  useEffect(() => {
    if (!obj) return
    const baseName = obj.name
    const clips = FIGURE_ANIMATIONS[baseName]
    if (!clips) return

    // Find the models dir from any available model path
    const anyModel = availableModels[0]
    if (!anyModel) return
    const dir = anyModel.filePath.substring(0, anyModel.filePath.lastIndexOf('/'))

    const paths = {}
    clips.forEach(({ label, file }) => {
      paths[label] = `${dir}/${file}`
    })
    setFigureAnimationPaths(obj.id, paths)

    // Set default animation
    if (!obj.activeAnimation && clips[0]) {
      setActiveAnimation(obj.id, clips[0].label)
    }
  }, [obj?.id, obj?.name, availableModels])

  if (!obj) {
    return (
      <div className="panel flex flex-col h-full">
        <div className="panel-header">Pose / Animation</div>
        <div className="p-4 text-xs text-slate-600 text-center">Select a figure</div>
      </div>
    )
  }

  const baseName = obj.name
  const clips = FIGURE_ANIMATIONS[baseName] || []

  return (
    <div className="panel flex flex-col h-full">
      <div className="panel-header">Pose / Animation</div>
      <div className="p-3 space-y-3 overflow-y-auto flex-1">
        <div className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">
          Animation Preset
        </div>
        {clips.length === 0 && (
          <div className="text-[10px] text-slate-600">No animations for this figure.</div>
        )}
        <div className="grid grid-cols-2 gap-1">
          {clips.map(({ label }) => (
            <button
              key={label}
              className={`btn py-2 text-[10px] justify-center ${
                obj.activeAnimation === label ? 'btn-active' : 'btn-secondary'
              }`}
              onClick={() => setActiveAnimation(obj.id, label)}
            >
              {label}
            </button>
          ))}
        </div>
        <div className="text-[10px] text-slate-600 bg-slate-900 rounded p-2 border border-slate-800 mt-2">
          Animation plays in loop. Use the viewport to view the pose, then compose your shot.
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Update SceneViewport to use FigureModel**

In `src/components/Viewport/SceneViewport.jsx`, replace the import of `HumanoidFigure` with `FigureModel`:

```javascript
import FigureModel from './FigureModel'
```

In `SceneObjects`, replace the figure branch:

```jsx
if (obj.type === 'figure') {
  return (
    <group key={obj.id} onClick={(e) => { e.stopPropagation(); onSelectObject(obj.id) }}>
      <FigureModel figure={obj} isSelected={isSelected} />
    </group>
  )
}
```

Wait — the prop name must match. Change to:

```jsx
if (obj.type === 'figure') {
  return (
    <group key={obj.id} onClick={(e) => { e.stopPropagation(); onSelectObject(obj.id) }}>
      <FigureModel object={obj} isSelected={isSelected} />
    </group>
  )
}
```

- [ ] **Step 4: Run tauri:dev and verify**

```bash
npm run tauri:dev
```
Add a male figure from the library. Confirm it loads (shows wireframe capsule while loading, then character mesh). Open Pose Mode — animation presets appear. Click "Idle" — animation plays.

- [ ] **Step 5: Commit**

```bash
git add src/store/sceneStore.js src/components/Panels/PosePanel.jsx src/components/Viewport/SceneViewport.jsx
git commit -m "feat: figure animation system with Mixamo preset selection"
```

- [ ] **Step 6: Remove HumanoidFigure.jsx**

```bash
git rm src/components/Viewport/HumanoidFigure.jsx
git commit -m "chore: remove procedural HumanoidFigure, replaced by FigureModel"
```

---

## Phase 4: Scene & Aesthetics

---

### Task 11: Startup Backdrop

**Files:**
- Modify: `src/store/sceneStore.js`
- Modify: `src/components/Viewport/SceneViewport.jsx`
- Modify: `src/components/Toolbar/Toolbar.jsx`

- [ ] **Step 1: Add backdrop state to sceneStore.js**

Add to initial state in `useSceneStore`:

```javascript
backdropVisible: true,
backdropColor: '#22c55e',
```

Add actions:

```javascript
setBackdropVisible: (v) => set({ backdropVisible: v }),
setBackdropColor: (c) => set({ backdropColor: c }),
```

- [ ] **Step 2: Add backdrop mesh to SceneViewport.jsx**

In `SceneViewport.jsx`, add this import at top:

```javascript
import { useSceneStore } from '../../store/sceneStore'
```

Add a `Backdrop` component before `SceneViewport`:

```jsx
function Backdrop() {
  const { backdropVisible, backdropColor, matteMode } = useSceneStore()
  if (!backdropVisible || matteMode) return null
  return (
    <group>
      {/* Vertical back wall */}
      <mesh position={[0, 2.5, -4]} receiveShadow>
        <planeGeometry args={[14, 8]} />
        <meshStandardMaterial color={backdropColor} roughness={1} metalness={0} />
      </mesh>
      {/* Floor continuation — blends into wall */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.002, -1.5]} receiveShadow>
        <planeGeometry args={[14, 5]} />
        <meshStandardMaterial color={backdropColor} roughness={1} metalness={0} />
      </mesh>
    </group>
  )
}
```

Add `<Backdrop />` inside the `<Canvas>` in `SceneViewport`, after `<SceneObjects .../>`:

```jsx
<Backdrop />
```

- [ ] **Step 3: Add backdrop toggle to Toolbar.jsx**

In `src/components/Toolbar/Toolbar.jsx`, add to imports:

```javascript
import { MousePointer2, PersonStanding, Layers, Camera, BookImage, Download, Image, Move3D, Axis3D } from 'lucide-react'
```

Add after the existing matte toggle button:

```jsx
{/* Backdrop toggle */}
<button
  className={`btn py-1.5 px-2.5 text-[11px] gap-1.5 ${backdropVisible ? 'btn-active' : 'btn-secondary'}`}
  onClick={() => setBackdropVisible(!backdropVisible)}
  title="Toggle backdrop"
>
  🎬 Backdrop
</button>
<input
  type="color"
  value={backdropColor}
  title="Backdrop color"
  className="w-7 h-7 rounded cursor-pointer border border-slate-700 bg-transparent"
  onChange={e => setBackdropColor(e.target.value)}
/>
```

And in the toolbar's `useSceneStore` destructure, add:
```javascript
const { mode, setMode, matteMode, setMatteMode, backdropVisible, setBackdropVisible, backdropColor, setBackdropColor } = useSceneStore()
```

- [ ] **Step 4: Verify backdrop appears on startup**

```bash
npm run dev
```
Confirm green backdrop wall is visible behind the default scene. Toggle button shows/hides it. Color picker changes its color.

- [ ] **Step 5: Commit**

```bash
git add src/store/sceneStore.js src/components/Viewport/SceneViewport.jsx src/components/Toolbar/Toolbar.jsx
git commit -m "feat: startup green backdrop with toggle and color picker"
```

---

### Task 12: Viewport Aesthetics — Clay Lighting + Grid

**Files:**
- Modify: `src/components/Viewport/SceneViewport.jsx`

- [ ] **Step 1: Replace lighting rig and background in SceneViewport.jsx**

In `SceneViewport`, change the `<Canvas>` style background:

```jsx
style={{ background: matteMode ? '#000000' : '#2a2a2a' }}
```

Replace the non-matte light block (lines containing `ambientLight`, `directionalLight`, `hemisphereLight`) with:

```jsx
{!matteMode && (
  <>
    {/* Key light — warm, upper right front */}
    <directionalLight
      position={[4, 8, 4]}
      intensity={1.8}
      color="#fff8f0"
      castShadow
      shadow-mapSize={[2048, 2048]}
    />
    {/* Fill light — cool blue, upper left */}
    <directionalLight
      position={[-4, 3, 2]}
      intensity={0.5}
      color="#aac4ff"
    />
    {/* Rim light — behind subject */}
    <directionalLight
      position={[0, 4, -6]}
      intensity={0.7}
      color="#ffffff"
    />
    {/* Low ambient to prevent pure black shadows */}
    <ambientLight intensity={0.25} />
  </>
)}
```

- [ ] **Step 2: Replace Grid component**

Replace the `<Grid .../>` block with:

```jsx
{!matteMode && (
  <Grid
    position={[0, 0, 0]}
    args={[20, 20]}
    cellSize={0.5}
    cellThickness={0.5}
    cellColor="#444444"
    sectionSize={2}
    sectionThickness={1.0}
    sectionColor="#666666"
    fadeDistance={25}
    fadeStrength={1}
    infiniteGrid={false}
  />
)}
```

- [ ] **Step 3: Verify clay look**

```bash
npm run dev
```
Add a Sphere and Box. Confirm warm highlight on one side, cool shadow on the other. Background is medium grey. Grid lines are clearly visible against the floor.

- [ ] **Step 4: Commit**

```bash
git add src/components/Viewport/SceneViewport.jsx
git commit -m "feat: three-point clay lighting rig, grey bg, higher-contrast grid"
```

---

## Phase 5: Camera Fix

---

### Task 13: Camera Preset Fix — Imperative OrbitControls

**Files:**
- Modify: `src/store/sceneStore.js`
- Modify: `src/components/Viewport/SceneViewport.jsx`
- Modify: `src/components/Panels/CameraPanel.jsx`

- [ ] **Step 1: Add pendingCameraMove to sceneStore.js**

Add to initial state:

```javascript
pendingCameraMove: null,   // { position: [x,y,z], target: [x,y,z] } | null
```

Add action:

```javascript
setCameraPreset: (position, target) => set({ pendingCameraMove: { position, target } }),
clearCameraMove: () => set({ pendingCameraMove: null }),
```

- [ ] **Step 2: Add CameraController to SceneViewport.jsx**

Add this component inside `SceneViewport.jsx` (before the `export default`):

```jsx
function CameraController({ controlsRef }) {
  const { pendingCameraMove, clearCameraMove } = useSceneStore()

  useEffect(() => {
    const controls = controlsRef.current
    if (!controls || !pendingCameraMove) return
    controls.target.set(...pendingCameraMove.target)
    controls.object.position.set(...pendingCameraMove.position)
    controls.update()
    clearCameraMove()
  }, [pendingCameraMove, controlsRef, clearCameraMove])

  return null
}
```

Add `<CameraController controlsRef={controlsRef} />` inside the `<Canvas>`, after `<CameraSyncer />`.

- [ ] **Step 3: Update CameraPanel.jsx to use setCameraPreset**

In `src/components/Panels/CameraPanel.jsx`, replace the import line and preset click handler:

```javascript
const { cameraFov, setCameraFov, setCameraPreset } = useSceneStore()
```

Change each preset button's `onClick`:

```jsx
onClick={() => setCameraPreset(p.position, p.target)}
```

- [ ] **Step 4: Test camera presets**

```bash
npm run dev
```
Switch to Camera mode (press R). Click "Bird's Eye" — camera should jump to that position. Click "Eye Level" — camera jumps back. Confirm OrbitControls still work after each preset jump.

- [ ] **Step 5: Commit**

```bash
git add src/store/sceneStore.js src/components/Viewport/SceneViewport.jsx src/components/Panels/CameraPanel.jsx
git commit -m "fix: camera presets now move OrbitControls imperatively"
```

---

## Phase 6: Viewport Overlays

---

### Task 14: Rule of Thirds + Aspect Ratio Overlays

**Files:**
- Create: `src/components/Viewport/ViewportOverlays.jsx`
- Modify: `src/store/sceneStore.js`
- Modify: `src/App.jsx`
- Modify: `src/components/Toolbar/Toolbar.jsx`

- [ ] **Step 1: Add overlay state to sceneStore.js**

Add to initial state:

```javascript
showRuleOfThirds: false,
aspectRatio: '16:9',    // '16:9' | '9:16' | '2.39:1'
```

Add actions:

```javascript
setShowRuleOfThirds: (v) => set({ showRuleOfThirds: v }),
setAspectRatio: (r) => set({ aspectRatio: r }),
```

- [ ] **Step 2: Create ViewportOverlays.jsx**

Create `src/components/Viewport/ViewportOverlays.jsx`:

```jsx
import { useSceneStore } from '../../store/sceneStore'

const RATIOS = {
  '16:9':   16 / 9,
  '9:16':   9 / 16,
  '2.39:1': 2.39,
}

/**
 * Returns CSS position/size for the frame rectangle, centered in the container.
 * Uses CSS aspect-ratio so it responds to container resize automatically.
 */
function getCropStyle(ratio) {
  if (ratio >= 1) {
    return {
      top: 0, bottom: 0,
      left: '50%',
      transform: 'translateX(-50%)',
      aspectRatio: String(ratio),
      height: '100%',
      maxWidth: '100%',
    }
  }
  return {
    left: 0, right: 0,
    top: '50%',
    transform: 'translateY(-50%)',
    aspectRatio: String(ratio),
    width: '100%',
    maxHeight: '100%',
  }
}

/**
 * Darkens everything outside the active frame using a CSS box-shadow punch-out.
 */
function AspectCrop({ ratio }) {
  const cropStyle = getCropStyle(ratio)
  return (
    <>
      <div className="absolute inset-0" style={{ background: 'rgba(0,0,0,0.4)' }} />
      <div style={{
        ...cropStyle,
        position: 'absolute',
        background: 'transparent',
        boxShadow: '0 0 0 9999px rgba(0,0,0,0.4)',
        outline: '1px solid rgba(255,255,255,0.4)',
        pointerEvents: 'none',
      }} />
    </>
  )
}

/**
 * Draws rule-of-thirds lines + intersection dots inside the active frame area.
 */
function RuleOfThirds({ ratio }) {
  const style = getCropStyle(ratio)
  return (
    <div style={{ ...style, position: 'absolute' }}>
      <svg width="100%" height="100%" style={{ position: 'absolute', inset: 0 }}>
        <line x1="33.33%" y1="0" x2="33.33%" y2="100%" stroke="white" strokeOpacity="0.3" strokeWidth="1" />
        <line x1="66.66%" y1="0" x2="66.66%" y2="100%" stroke="white" strokeOpacity="0.3" strokeWidth="1" />
        <line x1="0" y1="33.33%" x2="100%" y2="33.33%" stroke="white" strokeOpacity="0.3" strokeWidth="1" />
        <line x1="0" y1="66.66%" x2="100%" y2="66.66%" stroke="white" strokeOpacity="0.3" strokeWidth="1" />
        {['33.33%', '66.66%'].flatMap(x =>
          ['33.33%', '66.66%'].map(y => (
            <circle key={`${x}-${y}`} cx={x} cy={y} r="3" fill="white" fillOpacity="0.5" />
          ))
        )}
      </svg>
    </div>
  )
}

export default function ViewportOverlays() {
  const { showRuleOfThirds, aspectRatio } = useSceneStore()
  const ratio = RATIOS[aspectRatio]

  return (
    <div className="absolute inset-0 pointer-events-none z-20">
      <AspectCrop ratio={ratio} />
      {showRuleOfThirds && <RuleOfThirds ratio={ratio} />}
    </div>
  )
}
```

- [ ] **Step 3: Add ViewportOverlays to App.jsx**

In `src/App.jsx`, import:

```javascript
import ViewportOverlays from './components/Viewport/ViewportOverlays'
```

Add inside the viewport div (alongside `<ReferenceOverlay />`):

```jsx
<ViewportOverlays />
```

- [ ] **Step 4: Add overlay controls to Toolbar.jsx**

In `Toolbar.jsx`, add to the `useSceneStore` destructure:

```javascript
const {
  ...,
  showRuleOfThirds, setShowRuleOfThirds,
  aspectRatio, setAspectRatio
} = useSceneStore()
```

Add after the backdrop controls:

```jsx
<div className="h-5 w-px bg-slate-800 mx-1" />

{/* Rule of thirds */}
<button
  className={`btn py-1.5 px-2.5 text-[11px] ${showRuleOfThirds ? 'btn-active' : 'btn-secondary'}`}
  onClick={() => setShowRuleOfThirds(!showRuleOfThirds)}
  title="Rule of thirds"
>
  ⊞ Thirds
</button>

{/* Aspect ratio */}
{['16:9', '9:16', '2.39:1'].map(r => (
  <button
    key={r}
    className={`btn py-1.5 px-2 text-[10px] ${aspectRatio === r ? 'btn-active' : 'btn-secondary'}`}
    onClick={() => setAspectRatio(r)}
    title={r}
  >
    {r}
  </button>
))}
```

- [ ] **Step 5: Verify overlays**

```bash
npm run dev
```
Click "⊞ Thirds" — grid appears. Click "2.39:1" — letterbox bars appear. Click "9:16" — pillarbox bars appear. Confirm grid lines align within the active frame.

- [ ] **Step 6: Commit**

```bash
git add src/components/Viewport/ViewportOverlays.jsx src/store/sceneStore.js src/App.jsx src/components/Toolbar/Toolbar.jsx
git commit -m "feat: rule of thirds overlay and aspect ratio crop (16:9, 9:16, 2.39:1)"
```

---

## Phase 7: Transform Gizmos

---

### Task 15: Transform Gizmos — Translate + Rotate

**Files:**
- Modify: `src/store/sceneStore.js`
- Modify: `src/components/Viewport/SceneViewport.jsx`
- Modify: `src/components/Toolbar/Toolbar.jsx`
- Modify: `src/App.jsx`

- [ ] **Step 1: Add gizmo mode to sceneStore.js**

Add to initial state:

```javascript
gizmoMode: 'translate',   // 'translate' | 'rotate'
orbitEnabled: true,
```

Add actions:

```javascript
setGizmoMode: (m) => set({ gizmoMode: m }),
setOrbitEnabled: (v) => set({ orbitEnabled: v }),
```

- [ ] **Step 2: Update SceneViewport.jsx for gizmos**

In `src/components/Viewport/SceneViewport.jsx`, add import:

```javascript
import { TransformControls } from '@react-three/drei'
```

Change `SceneObjects` to pass a ref registration callback. Replace the component:

```jsx
function SceneObjectsAndGizmo({ onSelectObject }) {
  const { objects, selectedId, mode, matteMode, gizmoMode, orbitEnabled, setOrbitEnabled, updateObject } = useSceneStore()
  const selectedGroupRef = useRef(null)

  return (
    <>
      {objects.map(obj => {
        const isSelected = obj.id === selectedId
        if (!obj.visible) return null

        const handleClick = (e) => {
          e.stopPropagation()
          onSelectObject(obj.id)
        }

        return (
          <group
            key={obj.id}
            ref={isSelected ? selectedGroupRef : undefined}
            onClick={handleClick}
          >
            {obj.type === 'figure'
              ? <FigureModel object={obj} isSelected={isSelected} />
              : <PropModel object={obj} isSelected={isSelected} matteMode={matteMode} />
            }
          </group>
        )
      })}

      {/* Transform gizmo for selected object */}
      {selectedId && selectedGroupRef.current && !matteMode && (
        <TransformControls
          key={selectedId}
          object={selectedGroupRef.current}
          mode={gizmoMode}
          onMouseDown={() => setOrbitEnabled(false)}
          onMouseUp={() => setOrbitEnabled(true)}
          onChange={() => {
            const g = selectedGroupRef.current
            if (!g) return
            updateObject(selectedId, {
              position: g.position.toArray(),
              rotation: [
                THREE.MathUtils.radToDeg(g.rotation.x),
                THREE.MathUtils.radToDeg(g.rotation.y),
                THREE.MathUtils.radToDeg(g.rotation.z),
              ],
            })
          }}
        />
      )}
    </>
  )
}
```

In the `<Canvas>`, replace `<SceneObjects onSelectObject={handleSelectObject} />` with:

```jsx
<SceneObjectsAndGizmo onSelectObject={handleSelectObject} />
```

Update `<OrbitControls>` to respect `orbitEnabled`:

```jsx
const { orbitEnabled } = useSceneStore()

<OrbitControls
  ref={controlsRef}
  makeDefault
  enabled={orbitEnabled}
  target={[0, 1, 0]}
  minDistance={0.5}
  maxDistance={50}
  enablePan
  panSpeed={0.8}
/>
```

Add `import * as THREE from 'three'` if not already present.

- [ ] **Step 3: Add gizmo mode buttons to Toolbar.jsx**

In `Toolbar.jsx`, add to `useSceneStore` destructure:

```javascript
const { ..., gizmoMode, setGizmoMode } = useSceneStore()
```

Add after the mode tools separator:

```jsx
<div className="h-5 w-px bg-slate-800 mx-1" />

{/* Gizmo mode */}
<button
  className={`btn py-1.5 px-2.5 text-[11px] gap-1 ${gizmoMode === 'translate' ? 'btn-active' : 'btn-secondary'}`}
  onClick={() => setGizmoMode('translate')}
  title="Move (G)"
>
  ↔ Move
</button>
<button
  className={`btn py-1.5 px-2.5 text-[11px] gap-1 ${gizmoMode === 'rotate' ? 'btn-active' : 'btn-secondary'}`}
  onClick={() => setGizmoMode('rotate')}
  title="Rotate (R)"
>
  ↻ Rotate
</button>
```

- [ ] **Step 4: Add keyboard shortcuts for gizmo modes**

In `src/App.jsx`, update the keyboard shortcut handler. Find the existing `map` object:

```javascript
const map = { q: 'select', w: 'pose', e: 'matte', r: 'camera', t: 'ref' }
```

Replace the entire handler:

```javascript
const handler = (e) => {
  if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return
  const modeMap = { q: 'select', w: 'pose', e: 'matte', t: 'ref' }
  if (modeMap[e.key.toLowerCase()]) {
    setMode(modeMap[e.key.toLowerCase()])
    return
  }
  // Gizmo shortcuts (Blender-style)
  if (e.key.toLowerCase() === 'g') useSceneStore.getState().setGizmoMode('translate')
  if (e.key.toLowerCase() === 'r') useSceneStore.getState().setGizmoMode('rotate')
}
```

Note: `r` is now gizmo rotate instead of Camera mode — Camera mode is accessible via the toolbar or pressing `e` to open the camera panel button. Update `TOOLS` in `Toolbar.jsx` — the `r` shortcut is removed from Camera; it stays toolbar-only or assign another key. Since Camera was `R` and Rotate is also `R`, remove Camera shortcut from the tools list:

In `Toolbar.jsx` TOOLS array, change Camera entry:
```javascript
{ id: 'camera', label: 'Camera', icon: Camera, shortcut: '' },
```

- [ ] **Step 5: Verify gizmos**

```bash
npm run dev
```
Add a Box. Click it — transform arrows appear. Drag X arrow — box moves along X axis. Press R — rings appear, drag to rotate. Press G — back to move mode. Confirm OrbitControls are disabled during drag and re-enabled after.

- [ ] **Step 6: Commit**

```bash
git add src/store/sceneStore.js src/components/Viewport/SceneViewport.jsx src/components/Toolbar/Toolbar.jsx src/App.jsx
git commit -m "feat: transform gizmos (translate/rotate) with keyboard shortcuts G/R"
```

---

## Final Verification

- [ ] **Full feature check**

Run `npm run tauri:dev` and verify each feature:

1. ✅ Toolbar shows "TV Featuring Composer"
2. ✅ `~/Documents/TV Featuring Composer/models/` is created on first launch
3. ✅ GLB/FBX props appear in Model Library and load with grey clay material
4. ✅ Male/female figures load from FBX with Mixamo animations
5. ✅ Pose mode shows animation presets; switching presets plays animation
6. ✅ Green backdrop is visible on startup; toggle + color picker work
7. ✅ Grey background, three-point lighting visible on objects
8. ✅ Grid lines are clearly visible (not blending into bg)
9. ✅ Camera preset buttons in Camera panel actually move the camera
10. ✅ Rule of thirds overlay toggles on/off
11. ✅ Aspect ratio buttons show correct crop overlay
12. ✅ Selecting an object shows transform gizmo
13. ✅ G key = move mode, R key = rotate mode
14. ✅ DMG launcher script exists in `dist-extras/`

- [ ] **Final commit**

```bash
git add .
git commit -m "feat: TV Featuring Composer v2 — complete feature update"
```

---

## Notes for Implementer

**Tauri vs browser:** `tauriBridge.js` guards all Tauri calls with `isTauri()`. In browser dev mode (`npm run dev`), file loading is skipped — only procedural primitives work. Use `npm run tauri:dev` to test file-based models and figures.

**FBX scale:** Mixamo FBX characters export at 100× scale. `FigureModel.jsx` applies `fbx.scale.setScalar(0.01)` after load to normalize to scene units.

**Animation retargeting:** Mixamo characters and animation files share `mixamorig:` bone names — no retargeting needed. `AnimationMixer.clipAction(clip)` maps bones by name automatically.

**TransformControls React key:** If the selected object changes, React needs to re-mount `TransformControls` with the new object. The `key={selectedId}` prop ensures this. Add it: `<TransformControls key={selectedId} .../>`.

**car_002.glb is excluded** from the models dir by default. If the user copies it in manually, it will appear in the library — it's heavy (23MB, 144 meshes) and may cause slow load times.
