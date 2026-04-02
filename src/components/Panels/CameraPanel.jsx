import { useSceneStore } from '../../store/sceneStore'
import { Camera } from 'lucide-react'

const CAMERA_PRESETS = [
  { label: 'Eye Level',  position: [0, 1.65, 4],   target: [0, 1, 0] },
  { label: 'Low Angle',  position: [0, 0.3, 4],    target: [0, 1.2, 0] },
  { label: 'High Angle', position: [0, 3.5, 4],    target: [0, 0.8, 0] },
  { label: "Bird's Eye", position: [0, 6, 0.5],    target: [0, 0, 0] },
  { label: 'Close-Up',   position: [0, 1.7, 1.2],  target: [0, 1.6, 0] },
  { label: 'Wide',       position: [0, 1.5, 8],    target: [0, 1, 0] },
  { label: 'Side View',  position: [4, 1.5, 0],    target: [0, 1, 0] },
  { label: '3/4 View',   position: [2.5, 1.5, 3],  target: [0, 1, 0] },
]

const FOV_PRESETS = [
  { label: '24mm', fov: 74 },
  { label: '35mm', fov: 54 },
  { label: '50mm', fov: 40 },
  { label: '85mm', fov: 24 },
  { label: '135mm', fov: 15 },
]

export default function CameraPanel() {
  const { cameraFov, setCameraFov, setCameraPreset } = useSceneStore()

  return (
    <div className="panel flex flex-col h-full">
      <div className="panel-header flex items-center gap-1.5">
        <Camera size={11} /> Camera
      </div>
      <div className="p-3 space-y-4 overflow-y-auto flex-1">

        {/* FOV */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Field of View</span>
            <span className="text-[11px] text-slate-300 tabular-nums">{cameraFov}°</span>
          </div>
          <input
            type="range"
            min="10"
            max="110"
            step="1"
            value={cameraFov}
            className="w-full h-1 accent-blue-500 cursor-pointer"
            onChange={e => setCameraFov(parseInt(e.target.value))}
          />
          <div className="flex gap-1 mt-2 flex-wrap">
            {FOV_PRESETS.map(p => (
              <button
                key={p.label}
                className={`btn btn-secondary py-0.5 px-2 text-[10px] ${cameraFov === p.fov ? 'btn-active' : ''}`}
                onClick={() => setCameraFov(p.fov)}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {/* Position presets */}
        <div>
          <div className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider mb-2">Composition Presets</div>
          <div className="grid grid-cols-2 gap-1">
            {CAMERA_PRESETS.map(p => (
              <button
                key={p.label}
                className="btn btn-secondary py-1.5 px-2 text-[10px] justify-center"
                onClick={() => setCameraPreset(p.position, p.target)}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        <div className="text-[10px] text-slate-600 bg-slate-900 rounded p-2 border border-slate-800">
          Orbit: Left drag &nbsp;|&nbsp; Pan: Right drag / Shift+drag &nbsp;|&nbsp; Zoom: Scroll
        </div>
      </div>
    </div>
  )
}
