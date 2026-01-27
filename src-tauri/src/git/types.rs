use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "lowercase")]
pub enum FileStatus {
    Modified,
    Added,
    Deleted,
    Renamed,
    Copied,
    Untracked,
    Ignored,
    Conflicted,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct FileEntry {
    pub path: String,
    pub status: FileStatus,
    pub staged: bool,
    pub old_path: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "lowercase")]
pub enum LineType {
    Context,
    Addition,
    Deletion,
    Header,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct DiffLine {
    pub line_type: LineType,
    pub content: String,
    pub old_line_no: Option<u32>,
    pub new_line_no: Option<u32>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct DiffHunk {
    pub header: String,
    pub old_start: u32,
    pub old_lines: u32,
    pub new_start: u32,
    pub new_lines: u32,
    pub lines: Vec<DiffLine>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct FileDiff {
    pub path: String,
    pub old_path: Option<String>,
    pub status: FileStatus,
    pub hunks: Vec<DiffHunk>,
    pub is_binary: bool,
    pub language: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct RepositoryStatus {
    pub path: String,
    pub branch: Option<String>,
    pub files: Vec<FileEntry>,
    pub staged_count: usize,
    pub unstaged_count: usize,
}
