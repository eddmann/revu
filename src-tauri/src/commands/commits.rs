use crate::error::AppError;
use crate::git::{repository::GitRepository, types::*};

#[tauri::command]
pub fn get_commit_log(
    repo_path: String,
    count: Option<usize>,
    skip: Option<usize>,
) -> Result<Vec<CommitInfo>, AppError> {
    let repo = GitRepository::open(&repo_path)?;
    repo.get_commit_log(count.unwrap_or(25), skip.unwrap_or(0))
}

#[tauri::command]
pub fn get_branch_log(repo_path: String) -> Result<Vec<CommitInfo>, AppError> {
    let repo = GitRepository::open(&repo_path)?;
    repo.get_branch_log()
}

#[tauri::command]
pub fn get_commit_files(repo_path: String, oid: String) -> Result<Vec<FileEntry>, AppError> {
    let repo = GitRepository::open(&repo_path)?;
    repo.get_commit_files(&oid)
}

#[tauri::command]
pub fn get_commit_file_diff(
    repo_path: String,
    oid: String,
    file_path: String,
    context_lines: Option<u32>,
    ignore_whitespace: Option<bool>,
) -> Result<FileDiff, AppError> {
    let repo = GitRepository::open(&repo_path)?;
    repo.get_commit_file_diff(
        &oid,
        &file_path,
        context_lines.unwrap_or(3),
        ignore_whitespace.unwrap_or(false),
    )
}
