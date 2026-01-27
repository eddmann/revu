use crate::error::AppError;
use std::fs;
use std::path::Path;

/// Writes the review markdown output to a file for code agent integration.
/// The file is written to .revu in the repository directory.
#[tauri::command]
pub async fn write_review_output(repo_path: String, markdown: String) -> Result<String, AppError> {
    let repo = Path::new(&repo_path);
    let output_path = repo.join(".revu");
    fs::write(&output_path, &markdown)?;

    Ok(output_path.to_string_lossy().to_string())
}
