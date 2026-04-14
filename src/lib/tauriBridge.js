// Wraps Tauri invoke calls. Falls back gracefully when running in browser (dev without Tauri).
const isTauri = () => typeof window !== 'undefined' && window.__TAURI_INTERNALS__ !== undefined

async function invokeOrNull(cmd, args) {
  if (!isTauri()) return null
  const { invoke } = await import('@tauri-apps/api/core')
  return invoke(cmd, args)
}

/**
 * Creates ~/Documents/TV Featuring Composer/models/ if it doesn't exist.
 * Returns the absolute path string, or null in browser mode.
 */
export async function initUserDir() {
  return invokeOrNull('init_user_dir')
}

/**
 * Returns array of absolute file paths for all GLB/FBX/STL files in models dir.
 * Returns [] in browser mode.
 */
export async function listModelFiles() {
  return invokeOrNull('list_model_files') ?? []
}

/**
 * Reads a file from disk and returns its contents as ArrayBuffer.
 * Returns null in browser mode.
 */
export async function readModelFile(path) {
  const bytes = await invokeOrNull('read_model_file', { path })
  if (!bytes) return null
  return new Uint8Array(bytes).buffer
}
