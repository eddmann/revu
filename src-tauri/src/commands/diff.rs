use crate::error::AppError;
use crate::git::{FileDiff, GitRepository};

#[tauri::command]
pub fn get_file_diff(
    repo_path: String,
    file_path: String,
    staged: bool,
    context_lines: Option<u32>,
    ignore_whitespace: Option<bool>,
) -> Result<FileDiff, AppError> {
    let repo = GitRepository::open(&repo_path)?;
    let context = context_lines.unwrap_or(3);
    let ignore_ws = ignore_whitespace.unwrap_or(false);
    repo.get_file_diff(&file_path, staged, context, ignore_ws)
}

#[tauri::command]
pub fn get_combined_diff(repo_path: String) -> Result<Vec<FileDiff>, AppError> {
    let repo = GitRepository::open(&repo_path)?;
    repo.get_combined_diff()
}
