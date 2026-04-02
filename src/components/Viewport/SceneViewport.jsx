import { useRef, useCallback, useEffect } from 'react'
import { Canvas, useThree, useFrame } from '@react-three/fiber'
import { OrbitControls, TransformControls, Grid, GizmoHelper, GizmoViewport } from '@react-three/drei'
import * as THREE from 'three'
import { useSceneStore } from '../../store/sceneStore'
import FigureModel from './FigureModel'
import PropModel from './PropModel'

function CameraSyncer() {
  const { camera } = useThree()
  const { cameraFov, cameraPosition, cameraTarget, setCameraPosition, setCameraTarget } = useSceneStore()

  useEffect(() => {
    camera.fov = cameraFov
    camera.updateProjectionMatrix()
  }, [cameraFov, camera])

  useFrame(() => {
    const pos = camera.position.toArray()
    // only update store if significant change (avoid loop)
    const cp = useSceneStore.getState().cameraPosition
    if (Math.abs(pos[0] - cp[0]) > 0.01 || Math.abs(pos[1] - cp[1]) > 0.01 || Math.abs(pos[2] - cp[2]) > 0.01) {
      setCameraPosition(pos)
    }
  })

  return null
}

function ClickPlane({ onClickGround }) {
  return (
    <mesh
      rotation={[-Math.PI / 2, 0, 0]}
      position={[0, 0, 0]}
      onClick={onClickGround}
      visible={false}
    >
      <planeGeometry args={[100, 100]} />
      <meshBasicMaterial />
    </mesh>
  )
}

function Backdrop() {
  const { backdropVisible, backdropColor, matteMode } = useSceneStore()
  if (!backdropVisible || matteMode) return null
  return (
    <group>
      {/* Vertical back wall */}
      <mesh position={[0, 2.5, -4]} receiveShadow>
        <planeGeometry args={[14, 8]} />
        <meshStandardMaterial color={backdropColor} roughness={1} metalness={0} />
      </mesh>
      {/* Floor continuation — blends into wall */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.002, -1.5]} receiveShadow>
        <planeGeometry args={[14, 5]} />
        <meshStandardMaterial color={backdropColor} roughness={1} metalness={0} />
      </mesh>
    </group>
  )
}

function SceneObjectsAndGizmo({ onSelectObject }) {
  const { objects, selectedId, mode, matteMode, gizmoMode, orbitEnabled, setOrbitEnabled, updateObject } = useSceneStore()
  const selectedGroupRef = useRef(null)

  return (
    <>
      {objects.map(obj => {
        const isSelected = obj.id === selectedId
        if (!obj.visible) return null

        const handleClick = (e) => {
          e.stopPropagation()
          onSelectObject(obj.id)
        }

        return (
          <group
            key={obj.id}
            ref={isSelected ? selectedGroupRef : undefined}
            onClick={handleClick}
          >
            {obj.type === 'figure'
              ? <FigureModel object={obj} isSelected={isSelected} />
              : <PropModel object={obj} isSelected={isSelected} matteMode={matteMode} />
            }
          </group>
        )
      })}

      {/* Transform gizmo for selected object */}
      {selectedId && selectedGroupRef.current && !matteMode && (
        <TransformControls
          key={selectedId}
          object={selectedGroupRef.current}
          mode={gizmoMode}
          onMouseDown={() => setOrbitEnabled(false)}
          onMouseUp={() => setOrbitEnabled(true)}
          onChange={() => {
            const g = selectedGroupRef.current
            if (!g) return
            updateObject(selectedId, {
              position: g.position.toArray(),
              rotation: [
                THREE.MathUtils.radToDeg(g.rotation.x),
                THREE.MathUtils.radToDeg(g.rotation.y),
                THREE.MathUtils.radToDeg(g.rotation.z),
              ],
            })
          }}
        />
      )}
    </>
  )
}

function CameraController({ controlsRef }) {
  const { pendingCameraMove, clearCameraMove } = useSceneStore()

  useEffect(() => {
    const controls = controlsRef.current
    if (!controls || !pendingCameraMove) return
    controls.target.set(...pendingCameraMove.target)
    controls.object.position.set(...pendingCameraMove.position)
    controls.update()
    clearCameraMove()
  }, [pendingCameraMove, controlsRef, clearCameraMove])

  return null
}

export default function SceneViewport({ canvasRef }) {
  const { selectObject, matteMode, orbitEnabled } = useSceneStore()
  const controlsRef = useRef()

  const handleSelectObject = useCallback((id) => {
    selectObject(id)
  }, [selectObject])

  const handleClickGround = useCallback((e) => {
    e.stopPropagation()
    selectObject(null)
  }, [selectObject])

  return (
    <Canvas
      ref={canvasRef}
      gl={{ preserveDrawingBuffer: true, antialias: true }}
      camera={{ fov: 45, position: [0, 1.6, 5], near: 0.01, far: 1000 }}
      style={{ background: matteMode ? '#000000' : '#2a2a2a' }}
      shadows
    >
      {!matteMode && (
        <>
          {/* Key light — warm, upper right front */}
          <directionalLight
            position={[4, 8, 4]}
            intensity={1.8}
            color="#fff8f0"
            castShadow
            shadow-mapSize={[2048, 2048]}
          />
          {/* Fill light — cool blue, upper left */}
          <directionalLight
            position={[-4, 3, 2]}
            intensity={0.5}
            color="#aac4ff"
          />
          {/* Rim light — behind subject */}
          <directionalLight
            position={[0, 4, -6]}
            intensity={0.7}
            color="#ffffff"
          />
          {/* Low ambient to prevent pure black shadows */}
          <ambientLight intensity={0.25} />
        </>
      )}
      {matteMode && (
        <ambientLight intensity={10} />
      )}

      <SceneObjectsAndGizmo onSelectObject={handleSelectObject} />
      <Backdrop />
      <ClickPlane onClickGround={handleClickGround} />

      {!matteMode && (
        <Grid
          position={[0, 0, 0]}
          args={[20, 20]}
          cellSize={0.5}
          cellThickness={0.5}
          cellColor="#444444"
          sectionSize={2}
          sectionThickness={1.0}
          sectionColor="#666666"
          fadeDistance={25}
          fadeStrength={1}
          infiniteGrid={false}
        />
      )}
      {matteMode && (
        <mesh rotation={[-Math.PI/2, 0, 0]} position={[0, 0, 0]} receiveShadow>
          <planeGeometry args={[50, 50]} />
          <meshBasicMaterial color="#000000" />
        </mesh>
      )}

      <OrbitControls
        ref={controlsRef}
        makeDefault
        enabled={orbitEnabled}
        target={[0, 1, 0]}
        minDistance={0.5}
        maxDistance={50}
        enablePan
        panSpeed={0.8}
      />

      {!matteMode && (
        <GizmoHelper alignment="bottom-right" margin={[60, 60]}>
          <GizmoViewport axisColors={['#ef4444', '#22c55e', '#3b82f6']} labelColor="white" />
        </GizmoHelper>
      )}

      <CameraSyncer />
      <CameraController controlsRef={controlsRef} />
    </Canvas>
  )
}
