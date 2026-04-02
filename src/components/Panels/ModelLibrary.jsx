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
