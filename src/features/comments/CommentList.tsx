import { useRef, useState, useEffect } from "react";
import { clsx } from "clsx";
import { invoke } from "@tauri-apps/api/core";
import { useCommentStore } from "@/stores/commentStore";
import { useGitStore } from "@/stores/gitStore";
import { useUiStore } from "@/stores/uiStore";
import { Button } from "@/components/ui";
import { HighlightedContent } from "@/features/diff/HighlightedContent";
import { getLanguageFromPath } from "@/lib/syntax";
import { stripIndent } from "@/lib/stripIndent";
import type { Comment, CommentCategory } from "@/types/comment";

const categoryStyles: Record<
  CommentCategory,
  { color: string; icon: string }
> = {
  suggestion: {
    color: "text-blue-500 dark:text-blue-400",
    icon: "M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z", // lightbulb
  },
  issue: {
    color: "text-red-500 dark:text-red-400",
    icon: "M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z", // warning triangle
  },
  question: {
    color: "text-purple-500 dark:text-purple-400",
    icon: "M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01", // question mark
  },
  nitpick: {
    color: "text-yellow-500 dark:text-yellow-400",
    icon: "M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z", // pencil
  },
  praise: {
    color: "text-green-500 dark:text-green-400",
    icon: "M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z", // smiley
  },
};

export function CommentList() {
  const {
    getAllComments,
    removeComment,
    exportToMarkdown,
    clearAllComments,
    setDraft,
  } = useCommentStore();
  const { repoPath, status, selectFile } = useGitStore();
  const { setScrollToLine } = useUiStore();
  const comments = getAllComments();
  const [sendStatus, setSendStatus] = useState<"idle" | "sending" | "sent">(
    "idle",
  );

  const handleNavigate = (comment: Comment) => {
    // Find the file in status and select it
    const file = status?.files.find((f) => f.path === comment.filePath);
    if (file) {
      selectFile(file);
      // Set the scroll target after selecting the file
      setScrollToLine({ line: comment.startLine, isOld: comment.isOld });
    }
  };

  const handleCopyMarkdown = async () => {
    const markdown = exportToMarkdown();
    if (markdown) {
      await navigator.clipboard.writeText(markdown);
    }
  };

  const handleSendToAgent = async () => {
    const markdown = exportToMarkdown();
    if (!markdown || !repoPath) return;

    setSendStatus("sending");
    try {
      await invoke("write_review_output", { repoPath, markdown });
      setSendStatus("sent");
      setTimeout(() => setSendStatus("idle"), 2000);
    } catch (err) {
      console.error("Failed to write review:", err);
      setSendStatus("idle");
    }
  };

  if (comments.length === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-gray-500 dark:text-gray-400 p-4">
        <p className="text-sm text-center">No comments yet.</p>
        <p className="text-xs text-center mt-1">
          Click on a line in the diff to add a comment.
        </p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <div className="flex-shrink-0 px-3 py-2 border-b border-gray-200 dark:border-gray-700 space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            {comments.length} Comment{comments.length !== 1 && "s"}
          </span>
          <div className="flex gap-1">
            <Button variant="ghost" size="sm" onClick={handleCopyMarkdown}>
              Copy
            </Button>
            <Button variant="ghost" size="sm" onClick={clearAllComments}>
              Clear
            </Button>
          </div>
        </div>
        <Button
          variant="primary"
          size="sm"
          onClick={handleSendToAgent}
          disabled={sendStatus !== "idle"}
          className="w-full"
        >
          {sendStatus === "sending"
            ? "Saving..."
            : sendStatus === "sent"
              ? "Saved!"
              : "Send to Agent"}
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto p-2 space-y-3">
        {comments.map((comment) => (
          <CommentCard
            key={comment.id}
            comment={comment}
            onDelete={() => removeComment(comment.filePath, comment.id)}
            onEdit={() =>
              setDraft({
                filePath: comment.filePath,
                startLine: comment.startLine,
                endLine: comment.endLine,
                codeSnippet: comment.codeSnippet,
                isOld: comment.isOld,
                editingId: comment.id,
                existingContent: comment.content,
                existingCategory: comment.category,
              })
            }
            onNavigate={() => handleNavigate(comment)}
          />
        ))}
      </div>
    </div>
  );
}

interface CommentCardProps {
  comment: Comment;
  onDelete: () => void;
  onEdit: () => void;
  onNavigate: () => void;
}

function CommentCard({ comment, onDelete, onEdit, onNavigate }: CommentCardProps) {
  const lineRef =
    comment.startLine === comment.endLine
      ? `:${comment.startLine}`
      : `:${comment.startLine}-${comment.endLine}`;
  const bodyRef = useRef<HTMLDivElement>(null);
  const [isOverflowing, setIsOverflowing] = useState(false);

  useEffect(() => {
    const el = bodyRef.current;
    if (el) setIsOverflowing(el.scrollHeight > el.clientHeight);
  }, [comment.content]);

  return (
    <div
      onClick={onEdit}
      className="group bg-gray-50 dark:bg-gray-800 rounded-lg ring-1 ring-gray-200/80 dark:ring-gray-700/80 p-3 text-sm cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 min-w-0">
          <svg
            className={clsx("w-4 h-4 shrink-0", categoryStyles[comment.category].color)}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <title>{comment.category}</title>
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d={categoryStyles[comment.category].icon}
            />
          </svg>
          <span
            className="font-medium text-gray-900 dark:text-gray-100 text-xs truncate"
            title={comment.filePath}
          >
            {comment.filePath.split("/").pop()}
            <span className="text-gray-400 dark:text-gray-500 font-normal ml-0.5">{lineRef}</span>
          </span>
          <span
            className={clsx(
              "w-4 h-4 rounded flex items-center justify-center text-[10px] font-bold shrink-0",
              comment.isOld
                ? "bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300"
                : "bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300",
            )}
          >
            {comment.isOld ? "−" : "+"}
          </span>
        </div>
        <div className="flex-shrink-0 flex gap-1">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onNavigate();
            }}
            className="text-gray-400 hover:text-blue-500 dark:hover:text-blue-400"
            title="Go to line"
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
                d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
              />
            </svg>
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            className="text-gray-400 hover:text-red-500 dark:hover:text-red-400"
            title="Delete comment"
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
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>
      </div>

      {/* Divider + content */}
      <div className="mt-2 pt-2 border-t border-gray-200/60 dark:border-gray-700/60">
        {comment.codeSnippet && (
          <div className="relative bg-gray-100 dark:bg-gray-900 rounded px-2 py-1.5 font-mono text-xs overflow-hidden">
            <div className="pointer-events-none absolute inset-y-0 right-0 w-12 bg-gradient-to-r from-transparent to-gray-100 dark:to-gray-900" />
            <code className="text-gray-700 dark:text-gray-300 whitespace-pre">
              <HighlightedContent
                content={(() => {
                  const trimmed = stripIndent(comment.codeSnippet);
                  return (
                    trimmed.slice(0, 100) +
                    (trimmed.length > 100 ? "..." : "")
                  );
                })()}
                language={getLanguageFromPath(comment.filePath)}
                isDark={document.documentElement.classList.contains("dark")}
              />
            </code>
          </div>
        )}

        <div
          ref={bodyRef}
          className={clsx(
            "relative max-h-[6em] overflow-hidden",
            comment.codeSnippet && "mt-2.5",
          )}
        >
          <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
            {comment.content}
          </p>
          {isOverflowing && (
            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-6 bg-gradient-to-t from-gray-50 group-hover:from-gray-100 dark:from-gray-800 dark:group-hover:from-gray-700 transition-colors" />
          )}
        </div>
      </div>
    </div>
  );
}
