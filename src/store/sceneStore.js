import { create } from 'zustand'
import * as THREE from 'three'

let idCounter = 0
const nextId = () => `obj_${++idCounter}`

export const MATTE_COLORS = [
  { id: 'none',   label: 'No Matte',   hex: null,      rgb: null },
  { id: 'red',    label: 'Red',         hex: '#ef4444', rgb: [1, 0.27, 0.27] },
  { id: 'green',  label: 'Green',       hex: '#22c55e', rgb: [0.13, 0.77, 0.37] },
  { id: 'blue',   label: 'Blue',        hex: '#3b82f6', rgb: [0.23, 0.51, 0.96] },
  { id: 'yellow', label: 'Yellow',      hex: '#eab308', rgb: [0.92, 0.70, 0.03] },
  { id: 'cyan',   label: 'Cyan',        hex: '#06b6d4', rgb: [0.02, 0.71, 0.83] },
  { id: 'magenta',label: 'Magenta',     hex: '#d946ef', rgb: [0.85, 0.27, 0.94] },
  { id: 'orange', label: 'Orange',      hex: '#f97316', rgb: [0.98, 0.45, 0.09] },
  { id: 'white',  label: 'White',       hex: '#f1f5f9', rgb: [0.95, 0.96, 0.98] },
]

export const JOINT_NAMES = [
  // Spine
  'hips', 'spine', 'chest', 'neck', 'head',
  // Left arm
  'leftShoulder', 'leftUpperArm', 'leftForearm', 'leftHand',
  // Right arm
  'rightShoulder', 'rightUpperArm', 'rightForearm', 'rightHand',
  // Left leg
  'leftUpperLeg', 'leftLowerLeg', 'leftFoot',
  // Right leg
  'rightUpperLeg', 'rightLowerLeg', 'rightFoot',
]

const defaultPose = () => {
  const pose = {}
  JOINT_NAMES.forEach(name => {
    pose[name] = { x: 0, y: 0, z: 0 }
  })
  return pose
}

const defaultFigure = (position = [0, 0, 0]) => ({
  id: nextId(),
  type: 'figure',
  name: 'Figure',
  position,
  rotation: [0, 0, 0],
  scale: [1, 1, 1],
  matteColor: 'none',
  pose: defaultPose(),
  visible: true,
})

const defaultModel = (modelType, position = [0, 0, 0]) => ({
  id: nextId(),
  type: 'model',
  modelType,
  name: modelType.charAt(0).toUpperCase() + modelType.slice(1),
  position,
  rotation: [0, 0, 0],
  scale: [1, 1, 1],
  matteColor: 'none',
  visible: true,
})

export const useSceneStore = create((set, get) => ({
  // Scene objects
  objects: [],
  selectedId: null,

  // Mode: 'select' | 'pose' | 'matte' | 'camera'
  mode: 'select',

  // Matte rendering
  matteMode: false,
  matteLabels: {},  // { colorId: string description }

  // Reference photo
  referencePhoto: null,
  referenceOpacity: 0.4,

  // Camera
  cameraFov: 45,
  cameraPosition: [0, 1.6, 5],
  cameraTarget: [0, 1, 0],

  // Active joint for pose editing
  activeJoint: 'hips',

  // --- Object management ---
  addFigure: (position) => {
    const fig = defaultFigure(position || [0, 0, 0])
    set(s => ({ objects: [...s.objects, fig], selectedId: fig.id }))
  },

  addModel: (modelType, position) => {
    const model = defaultModel(modelType, position || [0, 0, 0])
    set(s => ({ objects: [...s.objects, model], selectedId: model.id }))
  },

  removeObject: (id) => {
    set(s => ({
      objects: s.objects.filter(o => o.id !== id),
      selectedId: s.selectedId === id ? null : s.selectedId,
    }))
  },

  selectObject: (id) => set({ selectedId: id }),

  updateObject: (id, patch) => {
    set(s => ({
      objects: s.objects.map(o => o.id === id ? { ...o, ...patch } : o),
    }))
  },

  setObjectMatte: (id, colorId) => {
    set(s => ({
      objects: s.objects.map(o => o.id === id ? { ...o, matteColor: colorId } : o),
    }))
  },

  // --- Pose ---
  setJointRotation: (figureId, jointName, axis, value) => {
    set(s => ({
      objects: s.objects.map(o => {
        if (o.id !== figureId || o.type !== 'figure') return o
        return {
          ...o,
          pose: {
            ...o.pose,
            [jointName]: {
              ...o.pose[jointName],
              [axis]: value,
            }
          }
        }
      })
    }))
  },

  resetPose: (figureId) => {
    set(s => ({
      objects: s.objects.map(o =>
        o.id === figureId && o.type === 'figure'
          ? { ...o, pose: defaultPose() }
          : o
      )
    }))
  },

  applyPresetPose: (figureId, preset) => {
    const poses = {
      tpose: defaultPose(),
      apose: {
        ...defaultPose(),
        leftUpperArm:  { x: 0, y: 0, z: -40 },
        rightUpperArm: { x: 0, y: 0, z:  40 },
      },
      standing: {
        ...defaultPose(),
        leftUpperArm:  { x: 15,  y: 0, z: -20 },
        rightUpperArm: { x: -15, y: 0, z:  20 },
        leftForearm:   { x: 10,  y: 0, z:  0  },
        rightForearm:  { x: -10, y: 0, z:  0  },
      },
      sitting: {
        ...defaultPose(),
        hips:          { x: 0, y: 0, z: 0  },
        leftUpperLeg:  { x: -80, y: 0, z: 5  },
        rightUpperLeg: { x: -80, y: 0, z: -5 },
        leftLowerLeg:  { x: 80,  y: 0, z: 0  },
        rightLowerLeg: { x: 80,  y: 0, z: 0  },
        leftFoot:      { x: -10, y: 0, z: 0  },
        rightFoot:     { x: -10, y: 0, z: 0  },
        leftUpperArm:  { x: 10, y: 0, z: -20 },
        rightUpperArm: { x: -10, y: 0, z:  20 },
      },
      walking: {
        ...defaultPose(),
        leftUpperLeg:  { x: -30, y: 0, z: 0 },
        rightUpperLeg: { x:  30, y: 0, z: 0 },
        leftLowerLeg:  { x: 10,  y: 0, z: 0 },
        rightLowerLeg: { x: -10, y: 0, z: 0 },
        leftUpperArm:  { x: 30,  y: 0, z: -15 },
        rightUpperArm: { x: -30, y: 0, z:  15 },
        leftForearm:   { x: -20, y: 0, z: 0 },
        rightForearm:  { x:  20, y: 0, z: 0 },
      },
      arms_raised: {
        ...defaultPose(),
        leftUpperArm:  { x: 0,  y: 0, z: -160 },
        rightUpperArm: { x: 0,  y: 0, z:  160 },
        leftForearm:   { x: 0,  y: 0, z: -10  },
        rightForearm:  { x: 0,  y: 0, z:  10  },
      },
    }
    const pose = poses[preset] || defaultPose()
    set(s => ({
      objects: s.objects.map(o =>
        o.id === figureId && o.type === 'figure' ? { ...o, pose } : o
      )
    }))
  },

  // --- Mode ---
  setMode: (mode) => set({ mode }),

  // --- Matte ---
  setMatteMode: (v) => set({ matteMode: v }),
  setMatteLabel: (colorId, text) => {
    set(s => ({ matteLabels: { ...s.matteLabels, [colorId]: text } }))
  },

  // --- Reference photo ---
  setReferencePhoto: (dataUrl) => set({ referencePhoto: dataUrl }),
  setReferenceOpacity: (v) => set({ referenceOpacity: v }),

  // --- Camera ---
  setCameraFov: (v) => set({ cameraFov: v }),
  setCameraPosition: (pos) => set({ cameraPosition: pos }),
  setCameraTarget: (t) => set({ cameraTarget: t }),

  setActiveJoint: (j) => set({ activeJoint: j }),
}))
