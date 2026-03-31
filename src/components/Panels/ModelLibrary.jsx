import { useSceneStore } from '../../store/sceneStore'
import { User, Package } from 'lucide-react'

const FIGURES = [
  { label: 'Male Figure',   type: 'figure', icon: '🧍', desc: 'Rigged humanoid' },
  { label: 'Female Figure', type: 'figure', icon: '🧍‍♀️', desc: 'Rigged humanoid' },
]

const PROPS = [
  { label: 'Chair',       modelType: 'chair',       icon: '🪑' },
  { label: 'Table',       modelType: 'table',       icon: '🪵' },
  { label: 'Box',         modelType: 'box',         icon: '📦' },
  { label: 'Sphere',      modelType: 'sphere',      icon: '⚪' },
  { label: 'Cylinder',    modelType: 'cylinder',    icon: '🥫' },
  { label: 'Floor Plane', modelType: 'plane',       icon: '▬' },
  { label: 'Wall',        modelType: 'wall',        icon: '🧱' },
  { label: 'Camera Prop', modelType: 'camera_prop', icon: '📷' },
  { label: 'Light Stand', modelType: 'light_stand', icon: '💡' },
  { label: 'Car',         modelType: 'car',         icon: '🚗' },
]

export default function ModelLibrary() {
  const { addFigure, addModel } = useSceneStore()

  return (
    <div className="panel flex flex-col h-full">
      <div className="panel-header">Model Library</div>
      <div className="flex-1 overflow-y-auto p-2 space-y-3">

        <div>
          <div className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold mb-1.5 px-1 flex items-center gap-1">
            <User size={10} /> Figures
          </div>
          <div className="grid grid-cols-2 gap-1">
            {FIGURES.map(f => (
              <button
                key={f.label}
                className="btn btn-secondary flex-col items-center py-3 gap-1 text-[10px] hover:border-blue-700/60 hover:bg-blue-950/30 transition-colors"
                onClick={() => addFigure([Math.random() * 2 - 1, 0, Math.random() * 2 - 1])}
              >
                <span className="text-xl">{f.icon}</span>
                <span>{f.label}</span>
              </button>
            ))}
          </div>
        </div>

        <div>
          <div className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold mb-1.5 px-1 flex items-center gap-1">
            <Package size={10} /> Props & Environment
          </div>
          <div className="grid grid-cols-2 gap-1">
            {PROPS.map(p => (
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
      </div>
    </div>
  )
}
