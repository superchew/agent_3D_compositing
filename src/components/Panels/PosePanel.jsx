import { useSceneStore, JOINT_NAMES } from '../../store/sceneStore'
import { RotateCcw } from 'lucide-react'

const JOINT_GROUPS = [
  { label: 'Spine', joints: ['hips', 'spine', 'chest', 'neck', 'head'] },
  { label: 'Left Arm', joints: ['leftShoulder', 'leftUpperArm', 'leftForearm', 'leftHand'] },
  { label: 'Right Arm', joints: ['rightShoulder', 'rightUpperArm', 'rightForearm', 'rightHand'] },
  { label: 'Left Leg', joints: ['leftUpperLeg', 'leftLowerLeg', 'leftFoot'] },
  { label: 'Right Leg', joints: ['rightUpperLeg', 'rightLowerLeg', 'rightFoot'] },
]

const PRESETS = [
  { id: 'tpose', label: 'T-Pose' },
  { id: 'apose', label: 'A-Pose' },
  { id: 'standing', label: 'Standing' },
  { id: 'sitting', label: 'Sitting' },
  { id: 'walking', label: 'Walking' },
  { id: 'arms_raised', label: 'Arms Up' },
]

function JointSlider({ figureId, joint, axis, value }) {
  const setJointRotation = useSceneStore(s => s.setJointRotation)
  return (
    <div className="flex items-center gap-2">
      <span className="text-[9px] text-slate-500 w-3 uppercase">{axis}</span>
      <input
        type="range"
        min="-180"
        max="180"
        step="1"
        value={value}
        className="flex-1 h-1 accent-blue-500 cursor-pointer"
        onChange={e => setJointRotation(figureId, joint, axis, parseFloat(e.target.value))}
      />
      <span className="text-[10px] text-slate-400 w-9 text-right tabular-nums">{Math.round(value)}°</span>
    </div>
  )
}

export default function PosePanel() {
  const { objects, selectedId, activeJoint, setActiveJoint, resetPose, applyPresetPose } = useSceneStore()
  const figure = objects.find(o => o.id === selectedId && o.type === 'figure')

  if (!figure) {
    return (
      <div className="panel flex flex-col h-full">
        <div className="panel-header">Pose Editor</div>
        <div className="p-4 text-xs text-slate-600 text-center">Select a figure to edit its pose</div>
      </div>
    )
  }

  return (
    <div className="panel flex flex-col h-full">
      <div className="panel-header flex items-center justify-between">
        <span>Pose Editor</span>
        <button
          className="btn btn-ghost py-0.5 px-1.5 text-[10px] flex items-center gap-1"
          onClick={() => resetPose(figure.id)}
        >
          <RotateCcw size={10} /> Reset
        </button>
      </div>

      <div className="p-2 border-b border-slate-800">
        <div className="text-[10px] text-slate-500 mb-2 uppercase tracking-wider">Presets</div>
        <div className="grid grid-cols-3 gap-1">
          {PRESETS.map(p => (
            <button
              key={p.id}
              className="btn btn-secondary py-1 px-2 text-[10px] justify-center"
              onClick={() => applyPresetPose(figure.id, p.id)}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {JOINT_GROUPS.map(group => (
          <div key={group.label} className="border-b border-slate-800/60">
            <div className="text-[10px] font-semibold text-slate-500 px-3 pt-2 pb-1 uppercase tracking-wider">
              {group.label}
            </div>
            {group.joints.map(joint => {
              const isActive = activeJoint === joint
              const pose = figure.pose[joint] || { x: 0, y: 0, z: 0 }
              return (
                <div
                  key={joint}
                  className={`px-3 pb-2 cursor-pointer ${isActive ? 'bg-blue-900/20' : ''}`}
                  onClick={() => setActiveJoint(joint)}
                >
                  <div className="text-[10px] text-slate-400 mb-1 flex items-center gap-1">
                    <span className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-blue-400' : 'bg-slate-600'}`} />
                    {joint}
                  </div>
                  <div className="space-y-1">
                    {['x', 'y', 'z'].map(axis => (
                      <JointSlider
                        key={axis}
                        figureId={figure.id}
                        joint={joint}
                        axis={axis}
                        value={pose[axis] ?? 0}
                      />
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        ))}
      </div>
    </div>
  )
}
