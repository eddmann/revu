import { useState } from "react";
import { useGitStore } from "@/stores/gitStore";
import { Button } from "@/components/ui";

export function CommitPanel() {
  const { status, commit, isLoading, error, clearError } = useGitStore();
  const [message, setMessage] = useState("");
  const [commitError, setCommitError] = useState<string | null>(null);
  const [commitSuccess, setCommitSuccess] = useState<string | null>(null);

  const stagedCount = status?.stagedCount ?? 0;
  const canCommit = stagedCount > 0 && message.trim().length > 0;

  const handleCommit = async () => {
    if (!canCommit) return;

    setCommitError(null);
    setCommitSuccess(null);

    try {
      const oid = await commit(message.trim());
      setMessage("");
      setCommitSuccess(`Committed: ${oid.slice(0, 7)}`);
      setTimeout(() => setCommitSuccess(null), 3000);
    } catch (e) {
      setCommitError(String(e));
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      handleCommit();
    }
  };

  return (
    <div className="border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 p-3">
      <div className="flex flex-col gap-2">
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={
            stagedCount === 0
              ? "Stage files to commit"
              : `Commit message (${stagedCount} file${stagedCount !== 1 ? "s" : ""} staged)`
          }
          disabled={stagedCount === 0}
          className="w-full h-20 px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none disabled:opacity-50 disabled:cursor-not-allowed"
        />

        <div className="flex items-center justify-between">
          <span className="text-xs text-gray-500 dark:text-gray-400">
            {stagedCount > 0
              ? `${stagedCount} file${stagedCount !== 1 ? "s" : ""} staged`
              : "No files staged"}
          </span>

          <Button
            onClick={handleCommit}
            disabled={!canCommit || isLoading}
            size="sm"
          >
            {isLoading ? "Committing..." : "Commit"}
          </Button>
        </div>

        {commitError && (
          <div className="text-xs text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 px-2 py-1 rounded">
            {commitError}
          </div>
        )}

        {commitSuccess && (
          <div className="text-xs text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 px-2 py-1 rounded">
            {commitSuccess}
          </div>
        )}

        {error && (
          <div className="text-xs text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 px-2 py-1 rounded flex items-center justify-between">
            <span>{error}</span>
            <button
              onClick={clearError}
              className="hover:text-red-800 dark:hover:text-red-300"
            >
              <svg
                className="w-3 h-3"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
