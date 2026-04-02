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
