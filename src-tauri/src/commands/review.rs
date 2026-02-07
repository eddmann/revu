use crate::error::AppError;
use std::fs;
use std::path::Path;
use std::time::{SystemTime, UNIX_EPOCH};

/// Exports the review markdown to ~/.revu/{repo-name}-{epoch}.md and returns the absolute path.
#[tauri::command]
pub async fn export_review(repo_path: String, markdown: String) -> Result<String, AppError> {
    let home = std::env::var("HOME").map_err(|_| {
        std::io::Error::new(
            std::io::ErrorKind::NotFound,
            "HOME environment variable not set",
        )
    })?;

    let revu_dir = Path::new(&home).join(".revu");
    fs::create_dir_all(&revu_dir)?;

    let repo_name = Path::new(&repo_path)
        .file_name()
        .map(|n| n.to_string_lossy().to_string())
        .unwrap_or_else(|| "unknown".to_string());

    let epoch = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap_or_default()
        .as_secs();

    let filename = format!("{}-{}.md", repo_name, epoch);
    let output_path = revu_dir.join(filename);
    fs::write(&output_path, &markdown)?;

    Ok(output_path.to_string_lossy().to_string())
}
