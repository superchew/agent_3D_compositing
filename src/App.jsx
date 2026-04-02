import { useRef, useCallback, useEffect } from 'react'
import { useSceneStore } from './store/sceneStore'
import { initUserDir, listModelFiles } from './lib/tauriBridge'
import { detectFormat } from './lib/fileLoader'
import Toolbar from './components/Toolbar/Toolbar'
import SceneViewport from './components/Viewport/SceneViewport'
import ScenePanel from './components/Panels/ScenePanel'
import PropertiesPanel from './components/Panels/PropertiesPanel'
import PosePanel from './components/Panels/PosePanel'
import MattePanel from './components/Panels/MattePanel'
import ReferencePanel from './components/Panels/ReferencePanel'
import CameraPanel from './components/Panels/CameraPanel'
import ModelLibrary from './components/Panels/ModelLibrary'
import ViewportOverlays from './components/Viewport/ViewportOverlays'

function ReferenceOverlay() {
  const { referencePhoto, referenceOpacity } = useSceneStore()
  if (!referencePhoto) return null
  return (
    <div
      className="absolute inset-0 pointer-events-none z-10"
      style={{ opacity: referenceOpacity }}
    >
      <img
        src={referencePhoto}
        alt=""
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'contain',
          mixBlendMode: 'screen',
        }}
      />
    </div>
  )
}

function RightPanel() {
  const { mode } = useSceneStore()
  return (
    <div className="flex flex-col h-full overflow-hidden" style={{ width: 240 }}>
      {/* Top: context panel based on mode */}
      <div className="flex-1 overflow-hidden">
        {mode === 'select'  && <PropertiesPanel />}
        {mode === 'pose'    && <PosePanel />}
        {mode === 'matte'   && <MattePanel />}
        {mode === 'camera'  && <CameraPanel />}
        {mode === 'ref'     && <ReferencePanel />}
      </div>
      {/* Bottom: always-visible properties when in pose/matte mode */}
      {(mode === 'pose' || mode === 'matte') && (
        <div className="border-t border-slate-800" style={{ maxHeight: 200, overflow: 'hidden' }}>
          <PropertiesPanel />
        </div>
      )}
    </div>
  )
}

export default function App() {
  const canvasRef = useRef()
  const { setMode, mode } = useSceneStore()
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

  // Keyboard shortcuts
  useEffect(() => {
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
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [setMode])

  const exportCanvas = useCallback((matteOverride) => {
    // Find the canvas element
    const canvas = document.querySelector('canvas')
    if (!canvas) return

    const wasMatteMode = useSceneStore.getState().matteMode
    if (matteOverride !== undefined) {
      useSceneStore.getState().setMatteMode(matteOverride)
    }

    // Give React a frame to re-render
    setTimeout(() => {
      const link = document.createElement('a')
      link.download = matteOverride ? 'matte_map.png' : 'scene_render.png'
      link.href = canvas.toDataURL('image/png')
      link.click()
      if (matteOverride !== undefined) {
        useSceneStore.getState().setMatteMode(wasMatteMode)
      }
    }, 200)
  }, [])

  const handleExportRender = useCallback(() => exportCanvas(false), [exportCanvas])
  const handleExportMatte  = useCallback(() => exportCanvas(true),  [exportCanvas])

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden">
      <Toolbar onExportRender={handleExportRender} onExportMatte={handleExportMatte} />

      <div className="flex flex-1 overflow-hidden">
        {/* Left sidebar */}
        <div className="flex flex-col border-r border-slate-800 overflow-hidden" style={{ width: 200 }}>
          <div style={{ flex: '0 0 40%', overflow: 'hidden' }}>
            <ModelLibrary />
          </div>
          <div style={{ flex: '0 0 60%', overflow: 'hidden', borderTop: '1px solid #1e293b' }}>
            <ScenePanel />
          </div>
        </div>

        {/* Viewport */}
        <div className="flex-1 relative overflow-hidden">
          <SceneViewport canvasRef={canvasRef} />
          <ReferenceOverlay />
          <ViewportOverlays />

          {/* Mode badge */}
          <div className="absolute top-3 left-3 z-20">
            <span className="text-[10px] font-semibold uppercase tracking-widest bg-slate-900/80 border border-slate-700 text-slate-400 px-2 py-1 rounded">
              {mode === 'select' ? 'Select Mode' :
               mode === 'pose'   ? 'Pose Mode' :
               mode === 'matte'  ? 'Matte Mode' :
               mode === 'camera' ? 'Camera Mode' : 'Reference Mode'}
            </span>
          </div>

          {/* Camera overlay hint */}
          <div className="absolute bottom-3 left-3 z-20 text-[9px] text-slate-600">
            Orbit: Left drag &nbsp;·&nbsp; Pan: Right drag &nbsp;·&nbsp; Zoom: Scroll
          </div>
        </div>

        {/* Right panel */}
        <div className="border-l border-slate-800 overflow-hidden">
          <RightPanel />
        </div>
      </div>
    </div>
  )
}
