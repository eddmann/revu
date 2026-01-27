export type FileStatus =
  | "modified"
  | "added"
  | "deleted"
  | "renamed"
  | "copied"
  | "untracked"
  | "ignored"
  | "conflicted";

export interface FileEntry {
  path: string;
  status: FileStatus;
  staged: boolean;
  oldPath?: string;
}

export type LineType = "context" | "addition" | "deletion" | "header";

export interface DiffLine {
  lineType: LineType;
  content: string;
  oldLineNo?: number;
  newLineNo?: number;
}

export interface DiffHunk {
  header: string;
  oldStart: number;
  oldLines: number;
  newStart: number;
  newLines: number;
  lines: DiffLine[];
}

export interface FileDiff {
  path: string;
  oldPath?: string;
  status: FileStatus;
  hunks: DiffHunk[];
  isBinary: boolean;
  language?: string;
}

export interface RepositoryStatus {
  path: string;
  branch?: string;
  files: FileEntry[];
  stagedCount: number;
  unstagedCount: number;
}
