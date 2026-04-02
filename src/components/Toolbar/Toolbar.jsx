import { useRef } from 'react'
import { MousePointer2, PersonStanding, Layers, Camera, BookImage, Download, Image } from 'lucide-react'
import { useSceneStore } from '../../store/sceneStore'

const TOOLS = [
  { id: 'select', label: 'Select',    icon: MousePointer2,    shortcut: 'Q' },
  { id: 'pose',   label: 'Pose',      icon: PersonStanding,   shortcut: 'W' },
  { id: 'matte',  label: 'Matte',     icon: Layers,           shortcut: 'E' },
  { id: 'camera', label: 'Camera',    icon: Camera,           shortcut: 'R' },
  { id: 'ref',    label: 'Reference', icon: BookImage,        shortcut: 'T' },
]

export default function Toolbar({ onExportRender, onExportMatte }) {
  const { mode, setMode, matteMode, setMatteMode, backdropVisible, setBackdropVisible, backdropColor, setBackdropColor } = useSceneStore()

  return (
    <div className="flex items-center gap-1 bg-[#0f1117] border-b border-slate-800 px-3 h-11 select-none flex-shrink-0">
      {/* Logo */}
      <div className="flex items-center gap-2 mr-4">
        <div className="w-6 h-6 rounded bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
          <span className="text-[9px] font-bold text-white">3D</span>
        </div>
        <span className="text-xs font-semibold text-slate-300 tracking-wide">TV Featuring Composer</span>
      </div>

      <div className="h-5 w-px bg-slate-800 mx-1" />

      {/* Mode tools */}
      {TOOLS.map(tool => {
        const Icon = tool.icon
        const isActive = mode === tool.id
        return (
          <button
            key={tool.id}
            title={`${tool.label} (${tool.shortcut})`}
            className={`btn py-1.5 px-2.5 text-[11px] gap-1.5 ${isActive ? 'btn-active' : 'btn-ghost'}`}
            onClick={() => setMode(tool.id)}
          >
            <Icon size={13} />
            <span className="hidden sm:inline">{tool.label}</span>
          </button>
        )
      })}

      <div className="flex-1" />

      <div className="h-5 w-px bg-slate-800 mx-1" />

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

      {/* Matte toggle */}
      <button
        className={`btn py-1.5 px-3 text-[11px] gap-1.5 ${matteMode ? 'btn-primary' : 'btn-secondary'}`}
        onClick={() => setMatteMode(!matteMode)}
        title="Toggle matte render mode"
      >
        <Layers size={13} />
        {matteMode ? 'Matte View' : 'Normal View'}
      </button>

      <div className="h-5 w-px bg-slate-800 mx-1" />

      {/* Export buttons */}
      <button
        className="btn btn-secondary py-1.5 px-3 text-[11px] gap-1.5"
        onClick={onExportRender}
        title="Export scene render"
      >
        <Image size={13} />
        Export
      </button>
      <button
        className="btn btn-primary py-1.5 px-3 text-[11px] gap-1.5"
        onClick={onExportMatte}
        title="Export matte map"
      >
        <Download size={13} />
        Matte PNG
      </button>
    </div>
  )
}
