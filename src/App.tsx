import { useEffect, useRef } from "react";
import { open } from "@tauri-apps/plugin-dialog";
import { listen } from "@tauri-apps/api/event";
import { useGitStore } from "@/stores/gitStore";
import { useCommentStore } from "@/stores/commentStore";
import { useUiStore } from "@/stores/uiStore";
import { ThemeProvider, ThemeToggle } from "@/features/theme";
import { FileList } from "@/features/files";
import { DiffViewer } from "@/features/diff";
import { CommentPopover, CommentList } from "@/features/comments";
import { CommitPanel } from "@/features/commit";
import { Button } from "@/components/ui";

export default function App() {
  const { repoPath, status, setRepoPath, refreshStatus } = useGitStore();
  const {
    draft,
    exportToMarkdown,
    setRepoPath: setCommentRepoPath,
    getAllComments,
  } = useCommentStore();
  const {
    showCommentsPanel,
    toggleCommentsPanel,
    setShowCommentsPanel,
    sidebarWidth,
  } = useUiStore();
  
  // Sync comment store's repo path with git store
  useEffect(() => {
    if (repoPath) {
      setCommentRepoPath(repoPath);
    }
  }, [repoPath, setCommentRepoPath]);

  // Listen for CLI-provided repo path from backend
  useEffect(() => {
    const unlisten = listen<string>("open-repo", (event) => {
      const path = event.payload;
      setRepoPath(path);
    });

    return () => {
      unlisten.then((fn) => fn());
    };
  }, [setRepoPath]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "c" && e.shiftKey) {
        e.preventDefault();
        const markdown = exportToMarkdown();
        if (markdown) {
          navigator.clipboard.writeText(markdown);
        }
      }

      if ((e.metaKey || e.ctrlKey) && e.key === "r" && !e.shiftKey) {
        e.preventDefault();
        refreshStatus();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [exportToMarkdown, refreshStatus]);

  // Auto-open comments panel when first comment is added
  const comments = getAllComments();
  const prevCommentCount = useRef(comments.length);

  useEffect(() => {
    const currentCount = comments.length;
    // Auto-open panel when going from 0 to 1+ comments
    if (
      currentCount > 0 &&
      prevCommentCount.current === 0 &&
      !showCommentsPanel
    ) {
      setShowCommentsPanel(true);
    }
    prevCommentCount.current = currentCount;
  }, [comments.length, showCommentsPanel, setShowCommentsPanel]);

  const handleBrowse = async () => {
    const selected = await open({
      directory: true,
      multiple: false,
      title: "Select Git Repository",
    });
    if (selected) {
      setRepoPath(selected);
    }
  };

  return (
    <ThemeProvider>
      <div className="h-full flex flex-col bg-white dark:bg-gray-900">
        {/* Header / Titlebar */}
        <header
          data-tauri-drag-region
          className="flex-shrink-0 flex items-center justify-end pl-20 pr-4 py-2 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800"
        >
          <div className="flex items-center gap-2">
            <button
              onClick={handleBrowse}
              className="flex items-center gap-2 px-3 py-1 text-sm rounded hover:bg-gray-200 dark:hover:bg-gray-700 select-none cursor-default"
            >
              {repoPath ? (
                <>
                  <span className="text-gray-900 dark:text-gray-100 font-medium">
                    {repoPath.split("/").pop()}
                  </span>
                  {status?.branch && (
                    <>
                      <span className="text-gray-400 dark:text-gray-500">/</span>
                      <svg
                        className="w-3.5 h-3.5 text-gray-500 dark:text-gray-400"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
                        />
                      </svg>
                      <span className="text-gray-600 dark:text-gray-400">
                        {status.branch}
                      </span>
                    </>
                  )}
                </>
              ) : (
                <span className="text-gray-400 dark:text-gray-500">
                  Open repository...
                </span>
              )}
            </button>
            <Button
              variant="ghost"
              size="sm"
              onClick={refreshStatus}
              title="Refresh (Cmd+R)"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
            </Button>
            <Button
              variant={showCommentsPanel ? "secondary" : "ghost"}
              size="sm"
              onClick={toggleCommentsPanel}
              title="Toggle comments panel"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z"
                />
              </svg>
            </Button>
            <ThemeToggle />
          </div>
        </header>

        {/* Main content */}
        <div className="flex-1 flex min-h-0">
          {/* Sidebar */}
          <aside
            className="flex-shrink-0 flex flex-col border-r border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900"
            style={{ width: sidebarWidth }}
          >
            <div className="flex-1 min-h-0 overflow-y-auto">
              <FileList />
            </div>
            <CommitPanel />
          </aside>

          {/* Diff viewer */}
          <main className="flex-1 min-w-0">
            <DiffViewer />
          </main>

          {/* Comments panel */}
          {showCommentsPanel && (
            <aside className="w-72 flex-shrink-0 border-l border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
              <CommentList />
            </aside>
          )}
        </div>

        {/* Comment popover */}
        {draft && <CommentPopover />}
      </div>
    </ThemeProvider>
  );
}
