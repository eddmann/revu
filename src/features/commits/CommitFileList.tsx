import { clsx } from "clsx";
import { useGitStore } from "@/stores/gitStore";
import { useCommentCountByFile } from "@/lib/useCommentCountByFile";
import type { FileEntry, FileStatus } from "@/types/git";

const statusConfig: Record<FileStatus, { label: string; color: string }> = {
  modified: { label: "M", color: "text-yellow-600 dark:text-yellow-400" },
  added: { label: "A", color: "text-green-600 dark:text-green-400" },
  deleted: { label: "D", color: "text-red-600 dark:text-red-400" },
  renamed: { label: "R", color: "text-blue-600 dark:text-blue-400" },
  copied: { label: "C", color: "text-purple-600 dark:text-purple-400" },
  untracked: { label: "U", color: "text-gray-500 dark:text-gray-400" },
  ignored: { label: "I", color: "text-gray-400 dark:text-gray-500" },
  conflicted: { label: "!", color: "text-red-600 dark:text-red-400" },
};

function CommitFileItem({
  file,
  isSelected,
  commentCount,
  onSelect,
}: {
  file: FileEntry;
  isSelected: boolean;
  commentCount: number;
  onSelect: () => void;
}) {
  const { label, color } = statusConfig[file.status];
  const parts = file.path.split("/");
  const filename = parts.pop() || file.path;
  const dir = parts.join("/");

  return (
    <button
      onClick={onSelect}
      className={clsx(
        "w-full text-left px-3 py-1.5 flex items-center gap-2 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-default",
        isSelected && "bg-blue-50 dark:bg-blue-900/30",
      )}
    >
      <span className={clsx("font-mono text-xs font-medium w-3 flex-shrink-0", color)}>
        {label}
      </span>
      <span className="flex-1 min-w-0 text-xs">
        <span className="text-gray-900 dark:text-gray-100 truncate block">{filename}</span>
        {dir && (
          <span className="text-gray-400 dark:text-gray-500 truncate block">{dir}</span>
        )}
      </span>
      {commentCount > 0 && (
        <span className="flex-shrink-0 text-xs bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded-full px-1.5 py-0.5 leading-none">
          {commentCount}
        </span>
      )}
    </button>
  );
}

export function CommitFileList() {
  const { commitFiles, selectedFile, selectFile, selectedCommit } = useGitStore();
  const commentCountByFile = useCommentCountByFile();

  if (!selectedCommit) return null;

  if (commitFiles.length === 0) {
    return (
      <div className="flex items-center justify-center h-12 text-xs text-gray-400 dark:text-gray-500">
        No files changed
      </div>
    );
  }

  return (
    <div>
      <div className="px-3 py-1.5 text-xs font-medium text-gray-500 dark:text-gray-400 border-t border-gray-200 dark:border-gray-700">
        {commitFiles.length} file{commitFiles.length !== 1 ? "s" : ""} changed
      </div>
      {commitFiles.map((file) => (
        <CommitFileItem
          key={file.path}
          file={file}
          isSelected={selectedFile?.path === file.path}
          commentCount={commentCountByFile[file.path] || 0}
          onSelect={() => selectFile(file)}
        />
      ))}
    </div>
  );
}
