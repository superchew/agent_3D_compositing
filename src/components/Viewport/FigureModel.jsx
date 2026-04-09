import { useEffect, useRef, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader.js'
import { applyClayMaterial } from '../../lib/clayMaterial'
import { readModelFile } from '../../lib/tauriBridge'
import { MATTE_COLORS } from '../../store/sceneStore'

const deg = (d) => (d * Math.PI) / 180

/**
 * Loads an FBX file as Object3D from a Tauri file path.
 */
async function loadFBXFromPath(filePath) {
  const buffer = await readModelFile(filePath)
  if (!buffer) return null
  const loader = new FBXLoader()
  return loader.parse(buffer, '')
}

/**
 * Renders a Mixamo FBX character with AnimationMixer.
 * object.filePath        — path to base character FBX (with skin)
 * object.animationPaths  — { [label]: filePath } map of animation clips
 * object.activeAnimation — label of currently selected animation
 */
// Bone names for guide lines (Mixamo namespace — no colon separator)
const MIDLINE_BONES = [
  'mixamorigHeadTop_End',
  'mixamorigHead',
  'mixamorigNeck',
  'mixamorigSpine2',
  'mixamorigSpine1',
  'mixamorigSpine',
  'mixamorigHips',
]

/**
 * Finds a bone by name in the skeleton hierarchy.
 */
function findBone(root, name) {
  let found = null
  root.traverse((child) => {
    if (child.isBone && child.name === name) found = child
  })
  return found
}

export default function FigureModel({ object, isSelected, matteMode }) {
  const { filePath, animationPaths = {}, activeAnimation, matteColor } = object
  const [charObj, setCharObj] = useState(null)
  const mixerRef = useRef(null)
  const actionsRef = useRef({})
  const currentActionRef = useRef(null)
  const animPathsKeyRef = useRef('')
  const midlineRef = useRef(null)
  const eyeLineRef = useRef(null)
  const bonesRef = useRef({ midline: [], head: null, leftShoulder: null, rightShoulder: null })

  // Load character mesh once
  useEffect(() => {
    if (!filePath) return
    let cancelled = false
    loadFBXFromPath(filePath).then(fbx => {
      if (cancelled || !fbx) return
      applyClayMaterial(fbx)
      // Scale Mixamo characters (they export at 100x)
      fbx.scale.setScalar(0.01)
      setCharObj(fbx)
      mixerRef.current = new THREE.AnimationMixer(fbx)
      // Resolve skeleton bones for guide lines
      bonesRef.current.midline = MIDLINE_BONES.map(n => findBone(fbx, n)).filter(Boolean)
      bonesRef.current.head = findBone(fbx, 'mixamorigHead')
      bonesRef.current.leftShoulder = findBone(fbx, 'mixamorigLeftShoulder')
      bonesRef.current.rightShoulder = findBone(fbx, 'mixamorigRightShoulder')
    }).catch(err => console.warn('FigureModel load error:', err))
    return () => { cancelled = true }
  }, [filePath])

  // Load animation clips whenever animationPaths actually changes (by key comparison)
  useEffect(() => {
    if (!charObj || !mixerRef.current) return
    const pathsKey = JSON.stringify(animationPaths)
    if (pathsKey === animPathsKeyRef.current) return
    animPathsKeyRef.current = pathsKey

    let cancelled = false
    const mixer = mixerRef.current
    // Stop all existing actions
    mixer.stopAllAction()
    actionsRef.current = {}
    currentActionRef.current = null

    async function loadClips() {
      for (const [label, animPath] of Object.entries(animationPaths)) {
        if (cancelled) break
        const buffer = await readModelFile(animPath)
        if (!buffer || cancelled) continue
        try {
          const loader = new FBXLoader()
          const animFbx = loader.parse(buffer, '')
          const clip = animFbx.animations?.[0]
          if (clip) {
            actionsRef.current[label] = mixer.clipAction(clip)
          }
        } catch (err) {
          console.warn(`Failed to load animation ${label}:`, err)
        }
      }
      // Play the active animation after all clips load
      if (!cancelled && activeAnimation && actionsRef.current[activeAnimation]) {
        const action = actionsRef.current[activeAnimation]
        action.reset().play()
        currentActionRef.current = action
      }
    }
    loadClips()
    return () => { cancelled = true }
  }, [charObj, animationPaths, activeAnimation])

  // Switch animations when activeAnimation changes
  useEffect(() => {
    const next = actionsRef.current[activeAnimation]
    if (!next) return
    if (currentActionRef.current && currentActionRef.current !== next) {
      currentActionRef.current.stop()
    }
    next.reset().play()
    currentActionRef.current = next
  }, [activeAnimation])

  // Update mixer and guide lines each frame
  const _bonePos = useRef(new THREE.Vector3())
  useFrame((_, delta) => {
    mixerRef.current?.update(delta)

    // Update midline from bone positions
    const midGeo = midlineRef.current
    const { midline, head, leftShoulder, rightShoulder } = bonesRef.current
    if (midGeo && midline.length > 0) {
      const posArr = midGeo.attributes.position
      for (let i = 0; i < midline.length; i++) {
        midline[i].getWorldPosition(_bonePos.current)
        // Convert from world to local (charObj parent is scaled group)
        if (charObj?.parent) charObj.parent.worldToLocal(_bonePos.current)
        posArr.setXYZ(i, _bonePos.current.x, _bonePos.current.y, _bonePos.current.z)
      }
      posArr.needsUpdate = true
    }

    // Update eye line — horizontal across the head using shoulder width as guide
    const eyeGeo = eyeLineRef.current
    if (eyeGeo && head) {
      const posArr = eyeGeo.attributes.position

      // Get head position for the Y height
      head.getWorldPosition(_bonePos.current)
      if (charObj?.parent) charObj.parent.worldToLocal(_bonePos.current)
      const hy = _bonePos.current.y
      const hz = _bonePos.current.z

      // Get shoulder X positions to determine width
      let lx = _bonePos.current.x - 0.15
      let rx = _bonePos.current.x + 0.15
      if (leftShoulder) {
        leftShoulder.getWorldPosition(_bonePos.current)
        if (charObj?.parent) charObj.parent.worldToLocal(_bonePos.current)
        lx = _bonePos.current.x * 0.4
      }
      if (rightShoulder) {
        rightShoulder.getWorldPosition(_bonePos.current)
        if (charObj?.parent) charObj.parent.worldToLocal(_bonePos.current)
        rx = _bonePos.current.x * 0.4
      }

      posArr.setXYZ(0, lx, hy, hz)
      posArr.setXYZ(1, rx, hy, hz)
      posArr.needsUpdate = true
    }
  })

  // Apply matte color override when matteMode changes
  useEffect(() => {
    if (!charObj) return
    const matteEntry = MATTE_COLORS.find(m => m.id === matteColor)
    charObj.traverse((child) => {
      if (child.isMesh || child.isSkinnedMesh) {
        if (matteMode && matteEntry?.rgb) {
          child.material = new THREE.MeshBasicMaterial({
            color: new THREE.Color(...matteEntry.rgb),
          })
        } else {
          child.material = new THREE.MeshStandardMaterial({
            color: '#94a3b8',
            roughness: 0.75,
            metalness: 0.0,
          })
          child.castShadow = true
          child.receiveShadow = true
        }
      }
    })
  }, [charObj, matteMode, matteColor])

  if (!charObj) {
    // Placeholder while loading
    return (
      <group>
        <mesh>
          <capsuleGeometry args={[0.2, 1.2, 8, 16]} />
          <meshStandardMaterial color="#475569" roughness={0.8} wireframe />
        </mesh>
      </group>
    )
  }

  // Max points for midline geometry (pre-allocate for all bones)
  const midlineCount = MIDLINE_BONES.length

  return (
    <group>
      <primitive object={charObj} />
      {/* Midline — traces spine bones */}
      <line>
        <bufferGeometry ref={midlineRef}>
          <bufferAttribute
            attach="attributes-position"
            array={new Float32Array(midlineCount * 3)}
            count={midlineCount}
            itemSize={3}
          />
        </bufferGeometry>
        <lineBasicMaterial color="#ffffff" opacity={0.2} transparent depthTest={false} />
      </line>
      {/* Eye line — traces between eye bones */}
      <line>
        <bufferGeometry ref={eyeLineRef}>
          <bufferAttribute
            attach="attributes-position"
            array={new Float32Array(6)}
            count={2}
            itemSize={3}
          />
        </bufferGeometry>
        <lineBasicMaterial color="#ffffff" opacity={0.3} transparent depthTest={false} />
      </line>
    </group>
  )
}
