use git2::{
    Delta, Diff, DiffOptions, IndexAddOption, Repository, ResetType, Signature, StatusOptions,
};
use std::path::Path;

use super::types::*;
use crate::error::AppError;

pub struct GitRepository {
    repo: Repository,
}

impl GitRepository {
    pub fn open(path: &str) -> Result<Self, AppError> {
        let repo =
            Repository::discover(path).map_err(|_| AppError::RepoNotFound(path.to_string()))?;
        Ok(Self { repo })
    }

    pub fn get_status(&self) -> Result<RepositoryStatus, AppError> {
        let path = self
            .repo
            .workdir()
            .map(|p| p.to_string_lossy().to_string())
            .unwrap_or_default();

        let branch = self
            .repo
            .head()
            .ok()
            .and_then(|h| h.shorthand().map(String::from));

        let mut opts = StatusOptions::new();
        opts.include_untracked(true)
            .include_ignored(false)
            .recurse_untracked_dirs(true);

        let statuses = self.repo.statuses(Some(&mut opts))?;
        let mut files = Vec::new();
        let mut staged_count = 0;
        let mut unstaged_count = 0;

        for entry in statuses.iter() {
            let status = entry.status();
            let path = entry.path().unwrap_or("").to_string();

            if status.is_index_new()
                || status.is_index_modified()
                || status.is_index_deleted()
                || status.is_index_renamed()
            {
                staged_count += 1;
                let file_status = if status.is_index_new() {
                    FileStatus::Added
                } else if status.is_index_deleted() {
                    FileStatus::Deleted
                } else if status.is_index_renamed() {
                    FileStatus::Renamed
                } else {
                    FileStatus::Modified
                };

                files.push(FileEntry {
                    path: path.clone(),
                    status: file_status,
                    staged: true,
                    old_path: entry
                        .head_to_index()
                        .and_then(|d| d.old_file().path())
                        .map(|p| p.to_string_lossy().to_string()),
                });
            }

            if status.is_wt_new()
                || status.is_wt_modified()
                || status.is_wt_deleted()
                || status.is_wt_renamed()
            {
                unstaged_count += 1;
                let file_status = if status.is_wt_new() {
                    FileStatus::Untracked
                } else if status.is_wt_deleted() {
                    FileStatus::Deleted
                } else if status.is_wt_renamed() {
                    FileStatus::Renamed
                } else {
                    FileStatus::Modified
                };

                let existing = files.iter_mut().find(|f| f.path == path && f.staged);
                if existing.is_none() {
                    files.push(FileEntry {
                        path: path.clone(),
                        status: file_status,
                        staged: false,
                        old_path: None,
                    });
                } else if let Some(f) = files.iter_mut().find(|f| f.path == path && !f.staged) {
                    f.status = file_status;
                } else {
                    files.push(FileEntry {
                        path,
                        status: file_status,
                        staged: false,
                        old_path: None,
                    });
                }
            }
        }

        files.sort_by(|a, b| a.path.cmp(&b.path));

        Ok(RepositoryStatus {
            path,
            branch,
            files,
            staged_count,
            unstaged_count,
        })
    }

    pub fn get_file_diff(
        &self,
        file_path: &str,
        staged: bool,
        context_lines: u32,
        ignore_whitespace: bool,
    ) -> Result<FileDiff, AppError> {
        let mut diff_opts = DiffOptions::new();
        diff_opts.pathspec(file_path);
        diff_opts.context_lines(context_lines);
        if ignore_whitespace {
            diff_opts.ignore_whitespace(true);
        }

        let diff = if staged {
            let head = self.repo.head()?.peel_to_tree()?;
            self.repo
                .diff_tree_to_index(Some(&head), None, Some(&mut diff_opts))?
        } else {
            self.repo
                .diff_index_to_workdir(None, Some(&mut diff_opts))?
        };

        let mut result = self.parse_diff(&diff, file_path)?;

        // Handle new files with empty hunks - read file content and create synthetic hunk
        // For untracked files, parse_diff returns Modified (no delta), so check git status
        if result.hunks.is_empty() && !result.is_binary {
            let actual_status = self.get_file_status(file_path, staged)?;
            if actual_status == FileStatus::Added || actual_status == FileStatus::Untracked {
                result = self.create_new_file_diff(file_path, actual_status)?;
            }
        }

        Ok(result)
    }

    pub fn get_combined_diff(&self) -> Result<Vec<FileDiff>, AppError> {
        let mut diff_opts = DiffOptions::new();
        diff_opts.context_lines(3);

        let head_tree = self.repo.head().ok().and_then(|h| h.peel_to_tree().ok());

        let staged_diff =
            self.repo
                .diff_tree_to_index(head_tree.as_ref(), None, Some(&mut diff_opts))?;

        let workdir_diff = self
            .repo
            .diff_index_to_workdir(None, Some(&mut diff_opts))?;

        let mut diffs = Vec::new();

        for delta in staged_diff.deltas() {
            let path = delta
                .new_file()
                .path()
                .or_else(|| delta.old_file().path())
                .map(|p| p.to_string_lossy().to_string())
                .unwrap_or_default();

            if let Ok(diff) = self.parse_diff(&staged_diff, &path) {
                diffs.push(diff);
            }
        }

        for delta in workdir_diff.deltas() {
            let path = delta
                .new_file()
                .path()
                .or_else(|| delta.old_file().path())
                .map(|p| p.to_string_lossy().to_string())
                .unwrap_or_default();

            if !diffs.iter().any(|d| d.path == path) {
                if let Ok(diff) = self.parse_diff(&workdir_diff, &path) {
                    diffs.push(diff);
                }
            }
        }

        Ok(diffs)
    }

    fn get_file_status(&self, file_path: &str, staged: bool) -> Result<FileStatus, AppError> {
        let status = self.repo.status_file(Path::new(file_path))?;

        if staged {
            if status.is_index_new() {
                Ok(FileStatus::Added)
            } else if status.is_index_deleted() {
                Ok(FileStatus::Deleted)
            } else {
                Ok(FileStatus::Modified)
            }
        } else if status.is_wt_new() {
            Ok(FileStatus::Untracked)
        } else if status.is_wt_deleted() {
            Ok(FileStatus::Deleted)
        } else {
            Ok(FileStatus::Modified)
        }
    }

    fn create_new_file_diff(
        &self,
        file_path: &str,
        status: FileStatus,
    ) -> Result<FileDiff, AppError> {
        let workdir = self
            .repo
            .workdir()
            .ok_or_else(|| AppError::Custom("No working directory".to_string()))?;

        let full_path = workdir.join(file_path);
        let content = std::fs::read_to_string(&full_path)
            .map_err(|e| AppError::Custom(format!("Failed to read file: {}", e)))?;

        let lines: Vec<DiffLine> = content
            .lines()
            .enumerate()
            .map(|(i, line)| DiffLine {
                line_type: LineType::Addition,
                content: format!("{}\n", line),
                old_line_no: None,
                new_line_no: Some((i + 1) as u32),
            })
            .collect();

        let line_count = lines.len() as u32;

        let hunk = DiffHunk {
            header: format!("@@ -0,0 +1,{} @@", line_count),
            old_start: 0,
            old_lines: 0,
            new_start: 1,
            new_lines: line_count,
            lines,
        };

        Ok(FileDiff {
            path: file_path.to_string(),
            old_path: None,
            status,
            hunks: vec![hunk],
            is_binary: false,
            language: detect_language(file_path),
        })
    }

    fn parse_diff(&self, diff: &Diff, file_path: &str) -> Result<FileDiff, AppError> {
        let mut hunks = Vec::new();
        let mut status = FileStatus::Modified;
        let mut old_path = None;
        let mut is_binary = false;

        for delta in diff.deltas() {
            let delta_path = delta
                .new_file()
                .path()
                .or_else(|| delta.old_file().path())
                .map(|p| p.to_string_lossy().to_string())
                .unwrap_or_default();

            if delta_path != file_path {
                continue;
            }

            is_binary = delta.flags().is_binary();
            status = match delta.status() {
                Delta::Added => FileStatus::Added,
                Delta::Deleted => FileStatus::Deleted,
                Delta::Modified => FileStatus::Modified,
                Delta::Renamed => {
                    old_path = delta
                        .old_file()
                        .path()
                        .map(|p| p.to_string_lossy().to_string());
                    FileStatus::Renamed
                }
                Delta::Copied => FileStatus::Copied,
                _ => FileStatus::Modified,
            };
        }

        if is_binary {
            return Ok(FileDiff {
                path: file_path.to_string(),
                old_path,
                status,
                hunks: vec![],
                is_binary: true,
                language: detect_language(file_path),
            });
        }

        let mut current_hunk_lines: Vec<DiffLine> = Vec::new();
        let mut current_hunk_header = String::new();
        let mut hunk_old_start = 0u32;
        let mut hunk_old_lines = 0u32;
        let mut hunk_new_start = 0u32;
        let mut hunk_new_lines = 0u32;
        let mut last_hunk_id: Option<(u32, u32)> = None;

        diff.print(git2::DiffFormat::Patch, |delta, hunk, line| {
            let delta_path = delta
                .new_file()
                .path()
                .or_else(|| delta.old_file().path())
                .map(|p| p.to_string_lossy().to_string())
                .unwrap_or_default();

            if delta_path != file_path {
                return true;
            }

            if let Some(h) = hunk {
                let hunk_id = (h.old_start(), h.new_start());

                // Only start a new hunk if the hunk actually changed
                if last_hunk_id != Some(hunk_id) {
                    if !current_hunk_lines.is_empty() {
                        hunks.push(DiffHunk {
                            header: current_hunk_header.clone(),
                            old_start: hunk_old_start,
                            old_lines: hunk_old_lines,
                            new_start: hunk_new_start,
                            new_lines: hunk_new_lines,
                            lines: std::mem::take(&mut current_hunk_lines),
                        });
                    }

                    current_hunk_header = String::from_utf8_lossy(h.header()).trim().to_string();
                    hunk_old_start = h.old_start();
                    hunk_old_lines = h.old_lines();
                    hunk_new_start = h.new_start();
                    hunk_new_lines = h.new_lines();
                    last_hunk_id = Some(hunk_id);
                }
            }

            let content = String::from_utf8_lossy(line.content()).to_string();
            let (line_type, old_line_no, new_line_no) = match line.origin() {
                '+' => (LineType::Addition, None, line.new_lineno()),
                '-' => (LineType::Deletion, line.old_lineno(), None),
                ' ' => (LineType::Context, line.old_lineno(), line.new_lineno()),
                _ => return true,
            };

            current_hunk_lines.push(DiffLine {
                line_type,
                content,
                old_line_no,
                new_line_no,
            });

            true
        })?;

        if !current_hunk_lines.is_empty() {
            hunks.push(DiffHunk {
                header: current_hunk_header,
                old_start: hunk_old_start,
                old_lines: hunk_old_lines,
                new_start: hunk_new_start,
                new_lines: hunk_new_lines,
                lines: current_hunk_lines,
            });
        }

        Ok(FileDiff {
            path: file_path.to_string(),
            old_path,
            status,
            hunks,
            is_binary,
            language: detect_language(file_path),
        })
    }

    pub fn stage_file(&self, file_path: &str) -> Result<(), AppError> {
        let mut index = self.repo.index()?;
        let workdir = self
            .repo
            .workdir()
            .ok_or_else(|| AppError::Custom("No working directory".to_string()))?;

        let full_path = workdir.join(file_path);

        if full_path.exists() {
            index.add_path(Path::new(file_path))?;
        } else {
            index.remove_path(Path::new(file_path))?;
        }

        index.write()?;
        Ok(())
    }

    pub fn unstage_file(&self, file_path: &str) -> Result<(), AppError> {
        let head = self.repo.head()?.peel_to_commit()?;
        self.repo
            .reset_default(Some(&head.into_object()), [Path::new(file_path)])?;
        Ok(())
    }

    pub fn stage_all(&self) -> Result<(), AppError> {
        let mut index = self.repo.index()?;
        index.add_all(["*"].iter(), IndexAddOption::DEFAULT, None)?;
        index.write()?;
        Ok(())
    }

    pub fn unstage_all(&self) -> Result<(), AppError> {
        let head = self.repo.head();

        match head {
            Ok(reference) => {
                let commit = reference.peel_to_commit()?;
                self.repo
                    .reset(&commit.into_object(), ResetType::Mixed, None)?;
            }
            Err(_) => {
                let mut index = self.repo.index()?;
                index.clear()?;
                index.write()?;
            }
        }

        Ok(())
    }

    pub fn commit(&self, message: &str) -> Result<String, AppError> {
        let mut index = self.repo.index()?;
        let tree_id = index.write_tree()?;
        let tree = self.repo.find_tree(tree_id)?;

        let signature = self
            .repo
            .signature()
            .or_else(|_| Signature::now("revu", "revu@local"))?;

        let parent = self.repo.head().ok().and_then(|h| h.peel_to_commit().ok());

        let parents: Vec<&git2::Commit> = parent.as_ref().map(|p| vec![p]).unwrap_or_default();

        let oid = self.repo.commit(
            Some("HEAD"),
            &signature,
            &signature,
            message,
            &tree,
            &parents,
        )?;

        Ok(oid.to_string())
    }

    pub fn discard_file(&self, file_path: &str) -> Result<(), AppError> {
        let workdir = self
            .repo
            .workdir()
            .ok_or_else(|| AppError::Custom("No working directory".to_string()))?;

        let mut opts = git2::build::CheckoutBuilder::new();
        opts.path(file_path);
        opts.force();

        self.repo.checkout_head(Some(&mut opts))?;

        let full_path = workdir.join(file_path);
        if full_path.exists() {
            let statuses = self.repo.statuses(None)?;
            for entry in statuses.iter() {
                if entry.path() == Some(file_path) && entry.status().is_wt_new() {
                    std::fs::remove_file(&full_path)?;
                    break;
                }
            }
        }

        Ok(())
    }

    pub fn discard_all(&self) -> Result<(), AppError> {
        let mut opts = git2::build::CheckoutBuilder::new();
        opts.force();
        self.repo.checkout_head(Some(&mut opts))?;

        let workdir = self
            .repo
            .workdir()
            .ok_or_else(|| AppError::Custom("No working directory".to_string()))?;

        let statuses = self.repo.statuses(None)?;
        for entry in statuses.iter() {
            if entry.status().is_wt_new() {
                if let Some(path) = entry.path() {
                    let full_path = workdir.join(path);
                    if full_path.is_file() {
                        let _ = std::fs::remove_file(&full_path);
                    } else if full_path.is_dir() {
                        let _ = std::fs::remove_dir_all(&full_path);
                    }
                }
            }
        }

        Ok(())
    }
}

fn detect_language(path: &str) -> Option<String> {
    let ext = Path::new(path).extension()?.to_str()?;
    let lang = match ext.to_lowercase().as_str() {
        "rs" => "rust",
        "js" | "mjs" | "cjs" => "javascript",
        "ts" | "mts" | "cts" => "typescript",
        "tsx" => "tsx",
        "jsx" => "jsx",
        "py" => "python",
        "rb" => "ruby",
        "go" => "go",
        "java" => "java",
        "c" | "h" => "c",
        "cpp" | "cc" | "cxx" | "hpp" => "cpp",
        "cs" => "csharp",
        "swift" => "swift",
        "kt" | "kts" => "kotlin",
        "php" => "php",
        "html" | "htm" => "html",
        "css" => "css",
        "scss" | "sass" => "scss",
        "json" => "json",
        "yaml" | "yml" => "yaml",
        "toml" => "toml",
        "xml" => "xml",
        "md" | "markdown" => "markdown",
        "sql" => "sql",
        "sh" | "bash" | "zsh" => "bash",
        "dockerfile" => "dockerfile",
        _ => return None,
    };
    Some(lang.to_string())
}
