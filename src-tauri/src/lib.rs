mod commands;
mod error;
mod git;

use clap::Parser;
use commands::*;
use std::env;
use std::path::PathBuf;
use tauri::Emitter;

#[derive(Parser, Debug)]
#[command(name = "revu")]
#[command(about = "Desktop Git diff reviewer for AI coding agents")]
#[command(version)]
struct Args {
    /// Path to a Git repository (defaults to current directory)
    #[arg(value_name = "PATH")]
    path: Option<PathBuf>,
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let args = Args::parse();

    // Use provided path or default to current working directory
    let repo_path = args
        .path
        .or_else(|| env::current_dir().ok())
        .and_then(|p| p.canonicalize().ok())
        .map(|p| p.to_string_lossy().to_string());

    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_dialog::init())
        .setup(move |app| {
            // Always emit repo path (either provided or current directory)
            if let Some(ref path) = repo_path {
                let path_clone = path.clone();
                let handle = app.handle().clone();
                // Emit after a short delay to ensure frontend is ready
                std::thread::spawn(move || {
                    std::thread::sleep(std::time::Duration::from_millis(500));
                    let _ = handle.emit("open-repo", path_clone);
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
