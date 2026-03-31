import { useRef, useMemo } from 'react'
import * as THREE from 'three'
import { useSceneStore, MATTE_COLORS } from '../../store/sceneStore'

const deg = (d) => (d * Math.PI) / 180

function JointMesh({ color, geometry, size = [0.08, 0.08, 0.08] }) {
  return (
    <mesh>
      <boxGeometry args={size} />
      <meshStandardMaterial color={color} roughness={0.6} metalness={0.1} />
    </mesh>
  )
}

function Limb({ length, radius, color }) {
  return (
    <mesh position={[0, -length / 2, 0]}>
      <capsuleGeometry args={[radius, length, 4, 8]} />
      <meshStandardMaterial color={color} roughness={0.6} metalness={0.1} />
    </mesh>
  )
}

export default function HumanoidFigure({ figure, isSelected, matteMode }) {
  const { pose, position, rotation, scale, matteColor } = figure

  const matteEntry = MATTE_COLORS.find(m => m.id === matteColor)
  const baseColor = matteMode && matteEntry?.rgb
    ? new THREE.Color(...matteEntry.rgb)
    : isSelected
      ? new THREE.Color('#60a5fa')
      : new THREE.Color('#c8a882')

  const skinColor = matteMode && matteEntry?.rgb
    ? new THREE.Color(...matteEntry.rgb)
    : new THREE.Color('#c8a882')

  const clothColor = matteMode && matteEntry?.rgb
    ? new THREE.Color(...matteEntry.rgb)
    : new THREE.Color('#2d4a7a')

  const r = (joint, axis) => deg(pose[joint]?.[axis] ?? 0)

  const matProps = matteMode
    ? { roughness: 1, metalness: 0, emissive: baseColor, emissiveIntensity: 1 }
    : { roughness: 0.6, metalness: 0.1 }

  const SkinMat = () => <meshStandardMaterial color={skinColor} {...matProps} />
  const ClothMat = () => <meshStandardMaterial color={clothColor} {...matProps} />

  return (
    <group
      position={position}
      rotation={rotation.map(deg)}
      scale={scale}
    >
      {/* Hips */}
      <group rotation={[r('hips','x'), r('hips','y'), r('hips','z')]}>
        {/* Pelvis */}
        <mesh position={[0, 0, 0]}>
          <boxGeometry args={[0.35, 0.2, 0.22]} />
          <ClothMat />
        </mesh>

        {/* Left upper leg */}
        <group position={[-0.12, -0.1, 0]} rotation={[r('leftUpperLeg','x'), r('leftUpperLeg','y'), r('leftUpperLeg','z')]}>
          <mesh position={[0, -0.22, 0]}>
            <capsuleGeometry args={[0.07, 0.35, 4, 8]} />
            <ClothMat />
          </mesh>
          {/* Left lower leg */}
          <group position={[0, -0.44, 0]} rotation={[r('leftLowerLeg','x'), r('leftLowerLeg','y'), r('leftLowerLeg','z')]}>
            <mesh position={[0, -0.2, 0]}>
              <capsuleGeometry args={[0.055, 0.33, 4, 8]} />
              <SkinMat />
            </mesh>
            {/* Left foot */}
            <group position={[0, -0.4, 0]} rotation={[r('leftFoot','x'), r('leftFoot','y'), r('leftFoot','z')]}>
              <mesh position={[0, -0.03, 0.06]}>
                <boxGeometry args={[0.1, 0.07, 0.22]} />
                <ClothMat />
              </mesh>
            </group>
          </group>
        </group>

        {/* Right upper leg */}
        <group position={[0.12, -0.1, 0]} rotation={[r('rightUpperLeg','x'), r('rightUpperLeg','y'), r('rightUpperLeg','z')]}>
          <mesh position={[0, -0.22, 0]}>
            <capsuleGeometry args={[0.07, 0.35, 4, 8]} />
            <ClothMat />
          </mesh>
          {/* Right lower leg */}
          <group position={[0, -0.44, 0]} rotation={[r('rightLowerLeg','x'), r('rightLowerLeg','y'), r('rightLowerLeg','z')]}>
            <mesh position={[0, -0.2, 0]}>
              <capsuleGeometry args={[0.055, 0.33, 4, 8]} />
              <SkinMat />
            </mesh>
            {/* Right foot */}
            <group position={[0, -0.4, 0]} rotation={[r('rightFoot','x'), r('rightFoot','y'), r('rightFoot','z')]}>
              <mesh position={[0, -0.03, 0.06]}>
                <boxGeometry args={[0.1, 0.07, 0.22]} />
                <ClothMat />
              </mesh>
            </group>
          </group>
        </group>

        {/* Spine */}
        <group position={[0, 0.1, 0]} rotation={[r('spine','x'), r('spine','y'), r('spine','z')]}>
          {/* Torso lower */}
          <mesh position={[0, 0.18, 0]}>
            <boxGeometry args={[0.32, 0.28, 0.2]} />
            <ClothMat />
          </mesh>

          {/* Chest */}
          <group position={[0, 0.3, 0]} rotation={[r('chest','x'), r('chest','y'), r('chest','z')]}>
            <mesh position={[0, 0.15, 0]}>
              <boxGeometry args={[0.36, 0.26, 0.22]} />
              <ClothMat />
            </mesh>

            {/* Neck */}
            <group position={[0, 0.3, 0]} rotation={[r('neck','x'), r('neck','y'), r('neck','z')]}>
              <mesh position={[0, 0.06, 0]}>
                <capsuleGeometry args={[0.045, 0.08, 4, 8]} />
                <SkinMat />
              </mesh>

              {/* Head */}
              <group position={[0, 0.13, 0]} rotation={[r('head','x'), r('head','y'), r('head','z')]}>
                <mesh position={[0, 0.11, 0]}>
                  <sphereGeometry args={[0.12, 16, 12]} />
                  <SkinMat />
                </mesh>
                {/* Eyes */}
                {!matteMode && <>
                  <mesh position={[-0.045, 0.135, 0.11]}>
                    <sphereGeometry args={[0.018, 8, 6]} />
                    <meshStandardMaterial color="#1a1a2e" />
                  </mesh>
                  <mesh position={[0.045, 0.135, 0.11]}>
                    <sphereGeometry args={[0.018, 8, 6]} />
                    <meshStandardMaterial color="#1a1a2e" />
                  </mesh>
                </>}
              </group>
            </group>

            {/* Left shoulder */}
            <group position={[-0.2, 0.12, 0]} rotation={[r('leftShoulder','x'), r('leftShoulder','y'), r('leftShoulder','z')]}>
              {/* Left upper arm */}
              <group rotation={[r('leftUpperArm','x'), r('leftUpperArm','y'), r('leftUpperArm','z')]}>
                <mesh position={[0, -0.16, 0]}>
                  <capsuleGeometry args={[0.055, 0.22, 4, 8]} />
                  <ClothMat />
                </mesh>
                {/* Left forearm */}
                <group position={[0, -0.32, 0]} rotation={[r('leftForearm','x'), r('leftForearm','y'), r('leftForearm','z')]}>
                  <mesh position={[0, -0.14, 0]}>
                    <capsuleGeometry args={[0.04, 0.22, 4, 8]} />
                    <SkinMat />
                  </mesh>
                  {/* Left hand */}
                  <group position={[0, -0.28, 0]} rotation={[r('leftHand','x'), r('leftHand','y'), r('leftHand','z')]}>
                    <mesh position={[0, -0.05, 0]}>
                      <boxGeometry args={[0.09, 0.1, 0.04]} />
                      <SkinMat />
                    </mesh>
                  </group>
                </group>
              </group>
            </group>

            {/* Right shoulder */}
            <group position={[0.2, 0.12, 0]} rotation={[r('rightShoulder','x'), r('rightShoulder','y'), r('rightShoulder','z')]}>
              {/* Right upper arm */}
              <group rotation={[r('rightUpperArm','x'), r('rightUpperArm','y'), r('rightUpperArm','z')]}>
                <mesh position={[0, -0.16, 0]}>
                  <capsuleGeometry args={[0.055, 0.22, 4, 8]} />
                  <ClothMat />
                </mesh>
                {/* Right forearm */}
                <group position={[0, -0.32, 0]} rotation={[r('rightForearm','x'), r('rightForearm','y'), r('rightForearm','z')]}>
                  <mesh position={[0, -0.14, 0]}>
                    <capsuleGeometry args={[0.04, 0.22, 4, 8]} />
                    <SkinMat />
                  </mesh>
                  {/* Right hand */}
                  <group position={[0, -0.28, 0]} rotation={[r('rightHand','x'), r('rightHand','y'), r('rightHand','z')]}>
                    <mesh position={[0, -0.05, 0]}>
                      <boxGeometry args={[0.09, 0.1, 0.04]} />
                      <SkinMat />
                    </mesh>
                  </group>
                </group>
              </group>
            </group>

          </group>{/* end chest */}
        </group>{/* end spine */}
      </group>{/* end hips */}

      {/* Selection indicator */}
      {isSelected && !matteMode && (
        <mesh position={[0, 0, 0]}>
          <ringGeometry args={[0.35, 0.38, 32]} />
          <meshBasicMaterial color="#3b82f6" side={THREE.DoubleSide} transparent opacity={0.7} />
        </mesh>
      )}
    </group>
  )
}
