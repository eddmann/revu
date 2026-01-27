use crate::error::AppError;
use crate::git::GitRepository;

#[tauri::command]
pub fn discard_file(repo_path: String, file_path: String) -> Result<(), AppError> {
    let repo = GitRepository::open(&repo_path)?;
    repo.discard_file(&file_path)
}

#[tauri::command]
pub fn discard_all(repo_path: String) -> Result<(), AppError> {
    let repo = GitRepository::open(&repo_path)?;
    repo.discard_all()
}
