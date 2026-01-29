import { useMemo } from "react";
import { useGitStore } from "@/stores/gitStore";
import { useCommentStore } from "@/stores/commentStore";
import { Button } from "@/components/ui";
import { FileItem } from "./FileItem";

export function FileList() {
  const {
    status,
    selectedFile,
    selectFile,
    stageFile,
    unstageFile,
    stageAll,
    unstageAll,
  } = useGitStore();
  const comments = useCommentStore((state) => state.comments);
  const currentRepoPath = useCommentStore((state) => state.currentRepoPath);

  const { stagedFiles, unstagedFiles } = useMemo(() => {
    if (!status) return { stagedFiles: [], unstagedFiles: [] };

    const staged = status.files.filter((f) => f.staged);
    const unstaged = status.files.filter((f) => !f.staged);

    return { stagedFiles: staged, unstagedFiles: unstaged };
  }, [status]);

  const commentCountByFile = useMemo(() => {
    const counts: Record<string, number> = {};
    if (!currentRepoPath) return counts;
    const repoComments = comments[currentRepoPath] || {};
    for (const [filePath, fileComments] of Object.entries(repoComments)) {
      counts[filePath] = fileComments.length;
    }
    return counts;
  }, [comments, currentRepoPath]);

  const handleStageToggle = (file: (typeof stagedFiles)[0]) => {
    if (file.staged) {
      unstageFile(file.path);
    } else {
      stageFile(file.path);
    }
  };

  if (!status) {
    return (
      <div className="h-full flex items-center justify-center text-gray-500 dark:text-gray-400">
        <p className="text-sm">No repository loaded</p>
      </div>
    );
  }

  if (status.files.length === 0) {
    return (
      <div className="h-full flex items-center justify-center text-gray-500 dark:text-gray-400">
        <p className="text-sm">No changes</p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {stagedFiles.length > 0 && (
        <div className="flex-shrink-0">
          <div className="flex items-center justify-between px-2 py-1.5 bg-gray-50 dark:bg-gray-800/50">
            <span className="text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wide">
              Staged ({stagedFiles.length})
            </span>
            <Button variant="ghost" size="sm" onClick={unstageAll}>
              Unstage All
            </Button>
          </div>
          <div className="py-1">
            {stagedFiles.map((file) => (
              <FileItem
                key={`staged-${file.path}`}
                file={file}
                isSelected={
                  selectedFile?.path === file.path &&
                  selectedFile?.staged === file.staged
                }
                onSelect={() => selectFile(file)}
                onStageToggle={() => handleStageToggle(file)}
                commentCount={commentCountByFile[file.path] || 0}
              />
            ))}
          </div>
        </div>
      )}

      {unstagedFiles.length > 0 && (
        <div className="flex-1 min-h-0 flex flex-col">
          <div className="flex items-center justify-between px-2 py-1.5 bg-gray-50 dark:bg-gray-800/50">
            <span className="text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wide">
              Changes ({unstagedFiles.length})
            </span>
            <Button variant="ghost" size="sm" onClick={stageAll}>
              Stage All
            </Button>
          </div>
          <div className="flex-1 overflow-y-auto py-1">
            {unstagedFiles.map((file) => (
              <FileItem
                key={`unstaged-${file.path}`}
                file={file}
                isSelected={
                  selectedFile?.path === file.path &&
                  selectedFile?.staged === file.staged
                }
                onSelect={() => selectFile(file)}
                onStageToggle={() => handleStageToggle(file)}
                commentCount={commentCountByFile[file.path] || 0}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
