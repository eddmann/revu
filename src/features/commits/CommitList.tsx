import { clsx } from "clsx";
import { useGitStore } from "@/stores/gitStore";
import type { CommitInfo } from "@/types/git";

function formatRelativeTime(timestamp: number): string {
  const now = Math.floor(Date.now() / 1000);
  const diff = now - timestamp;

  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 2592000) return `${Math.floor(diff / 86400)}d ago`;
  return new Date(timestamp * 1000).toLocaleDateString();
}

function CommitItem({
  commit,
  isSelected,
  onSelect,
}: {
  commit: CommitInfo;
  isSelected: boolean;
  onSelect: () => void;
}) {
  const firstLine = commit.message.split("\n")[0].trim();
  const shortOid = commit.oid.slice(0, 7);

  return (
    <button
      onClick={onSelect}
      className={clsx(
        "w-full text-left px-3 py-2 border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-default",
        isSelected && "bg-blue-50 dark:bg-blue-900/30",
      )}
    >
      <div className="flex items-center gap-2 mb-0.5">
        <span className="font-mono text-xs text-gray-400 dark:text-gray-500 flex-shrink-0">
          {shortOid}
        </span>
        <span className="text-xs text-gray-400 dark:text-gray-500 ml-auto flex-shrink-0">
          {formatRelativeTime(commit.timestamp)}
        </span>
      </div>
      <div className="text-xs text-gray-800 dark:text-gray-200 truncate leading-snug">
        {firstLine}
      </div>
      <div className="text-xs text-gray-400 dark:text-gray-500 truncate mt-0.5">
        {commit.authorName}
      </div>
    </button>
  );
}

export function CommitList() {
  const { commits, selectedCommit, selectCommit, isLoading, commitsPaginated, loadMoreCommits } =
    useGitStore();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-16 text-sm text-gray-500 dark:text-gray-400">
        Loading...
      </div>
    );
  }

  if (commits.length === 0) {
    return (
      <div className="flex items-center justify-center h-16 text-sm text-gray-500 dark:text-gray-400">
        No commits found
      </div>
    );
  }

  return (
    <div>
      {commits.map((commit) => (
        <CommitItem
          key={commit.oid}
          commit={commit}
          isSelected={selectedCommit?.oid === commit.oid}
          onSelect={() => selectCommit(commit)}
        />
      ))}
      {commitsPaginated && (
        <button
          onClick={loadMoreCommits}
          className="w-full py-2 text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-default border-t border-gray-100 dark:border-gray-800"
        >
          Load more
        </button>
      )}
    </div>
  );
}
