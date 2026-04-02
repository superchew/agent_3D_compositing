import * as THREE from 'three'

const CLAY_COLOR = '#94a3b8'
const CLAY_ROUGHNESS = 0.75
const CLAY_METALNESS = 0.0

/**
 * Traverses an Object3D and replaces every mesh's material with
 * a uniform grey clay MeshStandardMaterial. Also enables shadows.
 */
export function applyClayMaterial(object) {
  const mat = new THREE.MeshStandardMaterial({
    color: CLAY_COLOR,
    roughness: CLAY_ROUGHNESS,
    metalness: CLAY_METALNESS,
  })
  object.traverse((child) => {
    if (child.isMesh || child.isSkinnedMesh) {
      child.material = mat
      child.castShadow = true
      child.receiveShadow = true
    }
  })
}
