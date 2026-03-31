import { useSceneStore, MATTE_COLORS } from '../../store/sceneStore'

function NumInput({ label, value, onChange, step = 0.1, min, max }) {
  return (
    <div className="flex items-center gap-1">
      <span className="text-[10px] text-slate-500 w-3">{label}</span>
      <input
        type="number"
        className="input text-center"
        style={{ padding: '2px 4px', fontSize: '11px' }}
        value={Math.round(value * 100) / 100}
        step={step}
        min={min}
        max={max}
        onChange={e => onChange(parseFloat(e.target.value) || 0)}
      />
    </div>
  )
}

function Vec3Row({ label, values, onChange, step }) {
  return (
    <div className="mb-2">
      <div className="text-[10px] text-slate-500 mb-1">{label}</div>
      <div className="grid grid-cols-3 gap-1">
        {['X', 'Y', 'Z'].map((axis, i) => (
          <NumInput key={axis} label={axis} value={values[i]} step={step}
            onChange={v => {
              const next = [...values]
              next[i] = v
              onChange(next)
            }}
          />
        ))}
      </div>
    </div>
  )
}

export default function PropertiesPanel() {
  const { objects, selectedId, updateObject, setObjectMatte } = useSceneStore()
  const obj = objects.find(o => o.id === selectedId)

  if (!obj) {
    return (
      <div className="panel flex flex-col h-full">
        <div className="panel-header">Properties</div>
        <div className="p-4 text-xs text-slate-600 text-center">Select an object</div>
      </div>
    )
  }

  return (
    <div className="panel flex flex-col h-full overflow-y-auto">
      <div className="panel-header">Properties</div>
      <div className="p-3 space-y-3">
        {/* Name */}
        <div>
          <div className="text-[10px] text-slate-500 mb-1">Name</div>
          <input
            className="input"
            value={obj.name}
            onChange={e => updateObject(obj.id, { name: e.target.value })}
          />
        </div>

        {/* Transform */}
        <div className="border border-slate-800 rounded p-2">
          <div className="text-[10px] text-slate-400 font-semibold mb-2 uppercase tracking-wider">Transform</div>
          <Vec3Row label="Position" values={obj.position} step={0.1}
            onChange={v => updateObject(obj.id, { position: v })} />
          <Vec3Row label="Rotation (°)" values={obj.rotation} step={1}
            onChange={v => updateObject(obj.id, { rotation: v })} />
          <Vec3Row label="Scale" values={obj.scale} step={0.05}
            onChange={v => updateObject(obj.id, { scale: v })} />
        </div>

        {/* Matte color */}
        <div className="border border-slate-800 rounded p-2">
          <div className="text-[10px] text-slate-400 font-semibold mb-2 uppercase tracking-wider">Matte Color</div>
          <div className="flex flex-wrap gap-2">
            {MATTE_COLORS.map(m => (
              <button
                key={m.id}
                title={m.label}
                onClick={() => setObjectMatte(obj.id, m.id)}
                className={`color-swatch ${obj.matteColor === m.id ? 'active' : ''}`}
                style={{
                  background: m.hex || 'transparent',
                  border: m.hex
                    ? `2px solid ${obj.matteColor === m.id ? 'white' : 'rgba(255,255,255,0.15)'}`
                    : '2px dashed #334155',
                }}
              />
            ))}
          </div>
          <div className="mt-1 text-[10px] text-slate-500">
            {MATTE_COLORS.find(m => m.id === obj.matteColor)?.label || 'None'}
          </div>
        </div>
      </div>
    </div>
  )
}
