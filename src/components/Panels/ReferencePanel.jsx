import { useRef } from 'react'
import { Upload, X, Eye } from 'lucide-react'
import { useSceneStore } from '../../store/sceneStore'

export default function ReferencePanel() {
  const { referencePhoto, referenceOpacity, setReferencePhoto, setReferenceOpacity } = useSceneStore()
  const fileRef = useRef()

  const handleFile = (e) => {
    const file = e.target.files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => setReferencePhoto(ev.target.result)
    reader.readAsDataURL(file)
  }

  return (
    <div className="panel flex flex-col h-full">
      <div className="panel-header">Reference Photo</div>
      <div className="p-3 space-y-3 flex-1 overflow-y-auto">
        <p className="text-[11px] text-slate-500 leading-relaxed">
          Upload a pose reference image. It will overlay the viewport for matching.
        </p>

        <button
          className="btn btn-secondary w-full justify-center gap-2"
          onClick={() => fileRef.current?.click()}
        >
          <Upload size={13} />
          {referencePhoto ? 'Replace Photo' : 'Upload Reference'}
        </button>
        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />

        {referencePhoto && (
          <>
            <div className="relative rounded overflow-hidden border border-slate-700">
              <img src={referencePhoto} alt="Reference" className="w-full h-auto max-h-48 object-contain bg-slate-900" />
              <button
                className="absolute top-1.5 right-1.5 bg-slate-900/80 rounded p-0.5 hover:bg-red-900/80 transition-colors"
                onClick={() => setReferencePhoto(null)}
              >
                <X size={12} />
              </button>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] text-slate-400 flex items-center gap-1"><Eye size={10} /> Overlay Opacity</span>
                <span className="text-[10px] text-slate-400 tabular-nums">{Math.round(referenceOpacity * 100)}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={referenceOpacity}
                className="w-full h-1 accent-blue-500 cursor-pointer"
                onChange={e => setReferenceOpacity(parseFloat(e.target.value))}
              />
            </div>

            <div className="text-[10px] text-slate-500 bg-slate-900 rounded p-2 border border-slate-800">
              The reference overlays the 3D viewport. Pose your figure to match the photo, then remove the overlay before rendering.
            </div>
          </>
        )}
      </div>
    </div>
  )
}
