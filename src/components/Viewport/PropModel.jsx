import * as THREE from 'three'
import { MATTE_COLORS } from '../../store/sceneStore'

const deg = (d) => (d * Math.PI) / 180

function Chair({ color }) {
  return (
    <group>
      {/* Seat */}
      <mesh position={[0, 0.45, 0]}><boxGeometry args={[0.5, 0.05, 0.5]} /><meshStandardMaterial color={color} roughness={0.8} /></mesh>
      {/* Back */}
      <mesh position={[0, 0.75, -0.23]}><boxGeometry args={[0.5, 0.6, 0.05]} /><meshStandardMaterial color={color} roughness={0.8} /></mesh>
      {/* Legs */}
      {[[-0.22, -0.22], [-0.22, 0.22], [0.22, -0.22], [0.22, 0.22]].map(([x, z], i) => (
        <mesh key={i} position={[x, 0.22, z]}><boxGeometry args={[0.05, 0.44, 0.05]} /><meshStandardMaterial color={color} roughness={0.8} /></mesh>
      ))}
    </group>
  )
}

function Table({ color }) {
  return (
    <group>
      <mesh position={[0, 0.74, 0]}><boxGeometry args={[1.2, 0.06, 0.7]} /><meshStandardMaterial color={color} roughness={0.7} /></mesh>
      {[[-0.52, -0.28], [-0.52, 0.28], [0.52, -0.28], [0.52, 0.28]].map(([x, z], i) => (
        <mesh key={i} position={[x, 0.36, z]}><boxGeometry args={[0.06, 0.72, 0.06]} /><meshStandardMaterial color={color} roughness={0.7} /></mesh>
      ))}
    </group>
  )
}

function Box({ color }) {
  return (
    <mesh>
      <boxGeometry args={[0.5, 0.5, 0.5]} />
      <meshStandardMaterial color={color} roughness={0.7} />
    </mesh>
  )
}

function Sphere({ color }) {
  return (
    <mesh position={[0, 0.25, 0]}>
      <sphereGeometry args={[0.25, 16, 12]} />
      <meshStandardMaterial color={color} roughness={0.4} metalness={0.2} />
    </mesh>
  )
}

function Cylinder({ color }) {
  return (
    <mesh position={[0, 0.4, 0]}>
      <cylinderGeometry args={[0.2, 0.2, 0.8, 16]} />
      <meshStandardMaterial color={color} roughness={0.5} />
    </mesh>
  )
}

function Plane({ color }) {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.001, 0]}>
      <planeGeometry args={[2, 2]} />
      <meshStandardMaterial color={color} roughness={0.9} side={THREE.DoubleSide} />
    </mesh>
  )
}

function Wall({ color }) {
  return (
    <mesh position={[0, 1.2, 0]}>
      <boxGeometry args={[3, 2.4, 0.1]} />
      <meshStandardMaterial color={color} roughness={0.9} />
    </mesh>
  )
}

function Camera3D({ color }) {
  return (
    <group>
      <mesh position={[0, 0.1, 0]}>
        <boxGeometry args={[0.25, 0.18, 0.12]} />
        <meshStandardMaterial color={color} roughness={0.3} metalness={0.6} />
      </mesh>
      <mesh position={[0, 0.1, 0.1]}>
        <cylinderGeometry args={[0.05, 0.06, 0.12, 12]} rotation={[Math.PI/2, 0, 0]} />
        <meshStandardMaterial color="#1a1a2e" roughness={0.2} metalness={0.8} />
      </mesh>
    </group>
  )
}

function Light3D({ color }) {
  return (
    <group>
      <mesh position={[0, 0.3, 0]}>
        <cylinderGeometry args={[0.06, 0.06, 0.6, 8]} />
        <meshStandardMaterial color="#334155" roughness={0.5} />
      </mesh>
      <mesh position={[0, 0.65, 0]}>
        <boxGeometry args={[0.3, 0.15, 0.3]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.3} />
      </mesh>
    </group>
  )
}

function Car({ color }) {
  return (
    <group>
      <mesh position={[0, 0.25, 0]}><boxGeometry args={[1.8, 0.5, 0.9]} /><meshStandardMaterial color={color} roughness={0.2} metalness={0.7} /></mesh>
      <mesh position={[0, 0.62, 0.05]}><boxGeometry args={[1.1, 0.38, 0.85]} /><meshStandardMaterial color={color} roughness={0.2} metalness={0.7} /></mesh>
      {[[-0.6, -0.38], [-0.6, 0.38], [0.6, -0.38], [0.6, 0.38]].map(([x, z], i) => (
        <mesh key={i} position={[x, 0.15, z]} rotation={[Math.PI/2, 0, 0]}>
          <torusGeometry args={[0.15, 0.06, 8, 16]} />
          <meshStandardMaterial color="#1a1a2e" roughness={0.9} />
        </mesh>
      ))}
    </group>
  )
}

const MODEL_MAP = {
  chair: Chair,
  table: Table,
  box: Box,
  sphere: Sphere,
  cylinder: Cylinder,
  plane: Plane,
  wall: Wall,
  camera_prop: Camera3D,
  light_stand: Light3D,
  car: Car,
}

export default function PropModel({ object, isSelected, matteMode }) {
  const { modelType, position, rotation, scale, matteColor } = object
  const matteEntry = MATTE_COLORS.find(m => m.id === matteColor)

  const color = matteMode && matteEntry?.rgb
    ? `rgb(${matteEntry.rgb.map(v => Math.round(v * 255)).join(',')})`
    : '#94a3b8'

  const Component = MODEL_MAP[modelType] || Box

  return (
    <group
      position={position}
      rotation={rotation.map(deg)}
      scale={scale}
    >
      <Component color={color} />
      {isSelected && !matteMode && (
        <mesh>
          <boxGeometry args={[0.02, 0.02, 0.02]} />
          <meshBasicMaterial color="#3b82f6" />
        </mesh>
      )}
    </group>
  )
}
