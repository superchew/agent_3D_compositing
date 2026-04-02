use std::path::PathBuf;
use tauri::Manager;

fn get_models_dir(app: &tauri::AppHandle) -> Result<PathBuf, String> {
    let docs = app
        .path()
        .document_dir()
        .map_err(|e| format!("Cannot resolve Documents dir: {e}"))?;
    Ok(docs.join("TV Featuring Composer").join("models"))
}

#[tauri::command]
fn init_user_dir(app: tauri::AppHandle) -> Result<String, String> {
    let dir = get_models_dir(&app)?;
    std::fs::create_dir_all(&dir)
        .map_err(|e| format!("Cannot create models dir: {e}"))?;
    Ok(dir.to_string_lossy().into_owned())
}

#[tauri::command]
fn list_model_files(app: tauri::AppHandle) -> Result<Vec<String>, String> {
    let dir = get_models_dir(&app)?;
    if !dir.exists() {
        return Ok(vec![]);
    }
    let entries = std::fs::read_dir(&dir)
        .map_err(|e| format!("Cannot read models dir: {e}"))?;
    let files: Vec<String> = entries
        .filter_map(|e| e.ok())
        .filter_map(|e| {
            let path = e.path();
            if !path.is_file() { return None; }
            let ext = path.extension()?.to_str()?.to_lowercase();
            if ["glb", "fbx", "stl"].contains(&ext.as_str()) {
                Some(path.to_string_lossy().into_owned())
            } else {
                None
            }
        })
        .collect();
    Ok(files)
}

#[tauri::command]
fn read_model_file(path: String) -> Result<Vec<u8>, String> {
    std::fs::read(&path).map_err(|e| format!("Cannot read file {path}: {e}"))
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![
            init_user_dir,
            list_model_files,
            read_model_file,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
