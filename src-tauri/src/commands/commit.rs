use crate::error::AppError;
use crate::git::GitRepository;

#[tauri::command]
pub fn commit(repo_path: String, message: String) -> Result<String, AppError> {
    let repo = GitRepository::open(&repo_path)?;
    repo.commit(&message)
}
