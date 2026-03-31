import { Eye, EyeOff, Trash2, User, Box, ChevronRight } from 'lucide-react'
import { useSceneStore, MATTE_COLORS } from '../../store/sceneStore'

export default function ScenePanel() {
  const { objects, selectedId, selectObject, removeObject, updateObject } = useSceneStore()

  return (
    <div className="panel flex flex-col h-full">
      <div className="panel-header">Scene Hierarchy</div>
      <div className="flex-1 overflow-y-auto">
        {objects.length === 0 && (
          <div className="p-4 text-center text-xs text-slate-600">
            Add figures or models to the scene
          </div>
        )}
        {objects.map(obj => {
          const isSelected = obj.id === selectedId
          const matte = MATTE_COLORS.find(m => m.id === obj.matteColor)
          return (
            <div
              key={obj.id}
              className={`flex items-center gap-2 px-3 py-2 cursor-pointer border-b border-slate-800/50 hover:bg-slate-800/40 transition-colors ${isSelected ? 'bg-blue-900/30 border-l-2 border-l-blue-500' : ''}`}
              onClick={() => selectObject(obj.id)}
            >
              <span className="text-slate-500">
                {obj.type === 'figure' ? <User size={13} /> : <Box size={13} />}
              </span>
              <span className="flex-1 text-xs text-slate-300 truncate">{obj.name}</span>
              {matte?.hex && (
                <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: matte.hex }} />
              )}
              <button
                className="p-0.5 rounded hover:bg-slate-700 text-slate-500 hover:text-slate-300"
                onClick={(e) => { e.stopPropagation(); updateObject(obj.id, { visible: !obj.visible }) }}
              >
                {obj.visible ? <Eye size={12} /> : <EyeOff size={12} />}
              </button>
              <button
                className="p-0.5 rounded hover:bg-red-900/50 text-slate-600 hover:text-red-400"
                onClick={(e) => { e.stopPropagation(); removeObject(obj.id) }}
              >
                <Trash2 size={12} />
              </button>
            </div>
          )
        })}
      </div>
    </div>
  )
}
