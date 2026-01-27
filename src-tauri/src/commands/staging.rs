use crate::error::AppError;
use crate::git::GitRepository;

#[tauri::command]
pub fn stage_file(repo_path: String, file_path: String) -> Result<(), AppError> {
    let repo = GitRepository::open(&repo_path)?;
    repo.stage_file(&file_path)
}

#[tauri::command]
pub fn unstage_file(repo_path: String, file_path: String) -> Result<(), AppError> {
    let repo = GitRepository::open(&repo_path)?;
    repo.unstage_file(&file_path)
}

#[tauri::command]
pub fn stage_all(repo_path: String) -> Result<(), AppError> {
    let repo = GitRepository::open(&repo_path)?;
    repo.stage_all()
}

#[tauri::command]
pub fn unstage_all(repo_path: String) -> Result<(), AppError> {
    let repo = GitRepository::open(&repo_path)?;
    repo.unstage_all()
}
