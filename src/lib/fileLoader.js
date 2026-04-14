import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader.js'
import { STLLoader } from 'three/examples/jsm/loaders/STLLoader.js'
import { applyClayMaterial } from './clayMaterial.js'

/**
 * Detects format from file path extension.
 * Returns 'glb' | 'fbx' | 'stl' | null
 */
export function detectFormat(filePath) {
  const ext = filePath.split('.').pop()?.toLowerCase()
  if (ext === 'glb' || ext === 'gltf') return 'glb'
  if (ext === 'fbx') return 'fbx'
  if (ext === 'stl') return 'stl'
  return null
}

/**
 * Loads a 3D model from an ArrayBuffer and returns a THREE.Object3D.
 * Applies clay material to all meshes.
 * @param {ArrayBuffer} buffer
 * @param {string} format — 'glb' | 'fbx' | 'stl'
 * @returns {Promise<THREE.Object3D>}
 */
export async function loadModelFromBuffer(buffer, format) {
  if (format === 'glb') {
    return loadGLB(buffer)
  } else if (format === 'fbx') {
    return loadFBX(buffer)
  } else if (format === 'stl') {
    return loadSTL(buffer)
  }
  throw new Error(`Unsupported format: ${format}`)
}

function loadGLB(buffer) {
  return new Promise((resolve, reject) => {
    const loader = new GLTFLoader()
    loader.parse(buffer, '', (gltf) => {
      applyClayMaterial(gltf.scene)
      resolve(gltf.scene)
    }, reject)
  })
}

function loadFBX(buffer) {
  return new Promise((resolve, reject) => {
    try {
      const loader = new FBXLoader()
      const object = loader.parse(buffer, '')
      applyClayMaterial(object)
      resolve(object)
    } catch (err) {
      reject(err)
    }
  })
}

function loadSTL(buffer) {
  return new Promise((resolve, reject) => {
    try {
      const loader = new STLLoader()
      const geometry = loader.parse(buffer)
      const mat = new THREE.MeshStandardMaterial({
        color: '#94a3b8',
        roughness: 0.75,
        metalness: 0.0,
      })
      const mesh = new THREE.Mesh(geometry, mat)
      mesh.castShadow = true
      mesh.receiveShadow = true
      const group = new THREE.Group()
      group.add(mesh)
      resolve(group)
    } catch (err) {
      reject(err)
    }
  })
}

/**
 * Loads an FBX animation file and returns the first AnimationClip.
 * Used for loading Mixamo animation-only FBX files.
 * @param {ArrayBuffer} buffer
 * @returns {THREE.AnimationClip | null}
 */
export function loadAnimationClip(buffer) {
  try {
    const loader = new FBXLoader()
    const fbx = loader.parse(buffer, '')
    return fbx.animations?.[0] ?? null
  } catch (err) {
    console.warn('Failed to load animation clip:', err)
    return null
  }
}
