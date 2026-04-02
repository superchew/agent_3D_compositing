import { useRef, useCallback, useEffect } from 'react'
import { Canvas, useThree, useFrame } from '@react-three/fiber'
import { OrbitControls, Grid, GizmoHelper, GizmoViewport } from '@react-three/drei'
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

function SceneObjects({ onSelectObject }) {
  const { objects, selectedId, mode, matteMode } = useSceneStore()

  return (
    <>
      {objects.map(obj => {
        const isSelected = obj.id === selectedId
        if (!obj.visible) return null
        if (obj.type === 'figure') {
          return (
            <group key={obj.id} onClick={(e) => { e.stopPropagation(); onSelectObject(obj.id) }}>
              <FigureModel object={obj} isSelected={isSelected} />
            </group>
          )
        }
        return (
          <group key={obj.id} onClick={(e) => { e.stopPropagation(); onSelectObject(obj.id) }}>
            <PropModel object={obj} isSelected={isSelected} matteMode={matteMode} />
          </group>
        )
      })}
    </>
  )
}

export default function SceneViewport({ canvasRef }) {
  const { selectObject, matteMode } = useSceneStore()
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
      style={{ background: matteMode ? '#000000' : '#12161f' }}
      shadows
    >
      {!matteMode && (
        <>
          <ambientLight intensity={0.6} />
          <directionalLight
            position={[5, 8, 5]}
            intensity={1.2}
            castShadow
            shadow-mapSize={[2048, 2048]}
          />
          <directionalLight position={[-3, 4, -3]} intensity={0.4} color="#8eb4ff" />
          <hemisphereLight args={['#b1e1ff', '#444444', 0.8]} />
        </>
      )}
      {matteMode && (
        <ambientLight intensity={10} />
      )}

      <SceneObjects onSelectObject={handleSelectObject} />
      <Backdrop />
      <ClickPlane onClickGround={handleClickGround} />

      {!matteMode && (
        <Grid
          position={[0, 0, 0]}
          args={[20, 20]}
          cellSize={0.5}
          cellThickness={0.4}
          cellColor="#1e3a5f"
          sectionSize={2}
          sectionThickness={0.8}
          sectionColor="#2d5a9e"
          fadeDistance={20}
          fadeStrength={1.5}
          infiniteGrid
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
    </Canvas>
  )
}
