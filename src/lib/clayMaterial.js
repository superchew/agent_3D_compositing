import * as THREE from 'three'

const CLAY_COLOR = '#94a3b8'
const CLAY_ROUGHNESS = 0.75
const CLAY_METALNESS = 0.0

/**
 * Traverses an Object3D and replaces every mesh's material with
 * a uniform grey clay MeshStandardMaterial. Also enables shadows.
 * Disposes old materials and textures to prevent dark artifacts.
 */
export function applyClayMaterial(object) {
  object.traverse((child) => {
    if (child.isMesh || child.isSkinnedMesh) {
      // Dispose old material(s) and their textures
      const oldMats = Array.isArray(child.material) ? child.material : [child.material]
      oldMats.forEach(m => {
        if (m) {
          // Remove any texture maps that could darken the surface
          if (m.map) { m.map.dispose(); m.map = null }
          if (m.normalMap) { m.normalMap.dispose(); m.normalMap = null }
          if (m.roughnessMap) { m.roughnessMap.dispose(); m.roughnessMap = null }
          if (m.metalnessMap) { m.metalnessMap.dispose(); m.metalnessMap = null }
          if (m.aoMap) { m.aoMap.dispose(); m.aoMap = null }
          if (m.emissiveMap) { m.emissiveMap.dispose(); m.emissiveMap = null }
          m.dispose()
        }
      })
      // Create a fresh material per mesh (needed for SkinnedMesh)
      child.material = new THREE.MeshStandardMaterial({
        color: CLAY_COLOR,
        roughness: CLAY_ROUGHNESS,
        metalness: CLAY_METALNESS,
      })
      child.castShadow = true
      child.receiveShadow = true
    }
  })
}
