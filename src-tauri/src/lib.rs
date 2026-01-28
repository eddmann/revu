mod commands;
mod error;
mod git;

use commands::*;
use std::env;
use tauri::Emitter;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    // Collect CLI arguments - first arg after binary name is the repo path
    let args: Vec<String> = env::args().collect();
    let initial_repo_path = args.get(1).cloned();

    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_dialog::init())
        .setup(move |app| {
            // If a repo path was provided via CLI, emit it to the frontend
            if let Some(ref path) = initial_repo_path {
                // Resolve relative paths (like ".") to absolute paths
                let resolved_path = std::fs::canonicalize(path)
                    .map(|p| p.to_string_lossy().to_string())
                    .unwrap_or_else(|_| path.clone());
                let handle = app.handle().clone();
                // Emit after a short delay to ensure frontend is ready
                std::thread::spawn(move || {
                    std::thread::sleep(std::time::Duration::from_millis(500));
                    let _ = handle.emit("open-repo", resolved_path);
                });
            }
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            get_status,
            get_file_diff,
            get_combined_diff,
            stage_file,
            unstage_file,
            stage_all,
            unstage_all,
            commit,
            discard_file,
            discard_all,
            write_review_output,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
