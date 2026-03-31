import { useSceneStore, MATTE_COLORS } from '../../store/sceneStore'
import { Layers } from 'lucide-react'

export default function MattePanel() {
  const { matteLabels, setMatteLabel, objects, setObjectMatte, matteMode, setMatteMode } = useSceneStore()

  const usedColors = MATTE_COLORS.filter(m =>
    m.id !== 'none' && objects.some(o => o.matteColor === m.id)
  )

  return (
    <div className="panel flex flex-col h-full">
      <div className="panel-header flex items-center justify-between">
        <span className="flex items-center gap-1.5"><Layers size={11} /> FX Matte Puzzle</span>
        <button
          className={`btn text-[10px] py-0.5 px-2 ${matteMode ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setMatteMode(!matteMode)}
        >
          {matteMode ? 'Matte ON' : 'Matte OFF'}
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        <p className="text-[11px] text-slate-500 leading-relaxed">
          Assign solid colors to scene elements. Export the matte image and describe each color region in your AI prompt.
        </p>

        {/* Color assignments */}
        <div className="space-y-2">
          <div className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Color Channels</div>
          {MATTE_COLORS.filter(m => m.id !== 'none').map(m => {
            const assigned = objects.filter(o => o.matteColor === m.id)
            const label = matteLabels[m.id] || ''
            return (
              <div key={m.id} className="border border-slate-800 rounded-md p-2">
                <div className="flex items-center gap-2 mb-1.5">
                  <span
                    className="w-4 h-4 rounded flex-shrink-0"
                    style={{ background: m.hex }}
                  />
                  <span className="text-[11px] font-medium text-slate-300">{m.label}</span>
                  {assigned.length > 0 && (
                    <span className="ml-auto text-[9px] text-slate-500">{assigned.length} obj</span>
                  )}
                </div>
                <input
                  className="input text-[11px]"
                  placeholder={`Describe "${m.label}" region for AI prompt...`}
                  value={label}
                  onChange={e => setMatteLabel(m.id, e.target.value)}
                />
                {assigned.length > 0 && (
                  <div className="mt-1.5 flex flex-wrap gap-1">
                    {assigned.map(o => (
                      <span key={o.id} className="text-[9px] bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded">
                        {o.name}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* Prompt preview */}
        {usedColors.some(m => matteLabels[m.id]) && (
          <div className="border border-blue-900/50 rounded-md p-2 bg-blue-950/20">
            <div className="text-[10px] text-blue-400 font-semibold mb-1.5 uppercase tracking-wider">Prompt Preview</div>
            <p className="text-[11px] text-slate-300 leading-relaxed">
              {usedColors
                .filter(m => matteLabels[m.id])
                .map(m => `The ${m.label.toLowerCase()} is ${matteLabels[m.id]}.`)
                .join(' ')}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
