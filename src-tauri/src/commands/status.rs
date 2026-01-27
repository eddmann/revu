use crate::error::AppError;
use crate::git::{GitRepository, RepositoryStatus};

#[tauri::command]
pub fn get_status(repo_path: String) -> Result<RepositoryStatus, AppError> {
    let repo = GitRepository::open(&repo_path)?;
    repo.get_status()
}
