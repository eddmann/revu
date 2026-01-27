import { useState } from "react";
import { clsx } from "clsx";
import { invoke } from "@tauri-apps/api/core";
import { useCommentStore } from "@/stores/commentStore";
import { useGitStore } from "@/stores/gitStore";
import { Button } from "@/components/ui";
import { HighlightedContent } from "@/features/diff/HighlightedContent";
import { getLanguageFromPath } from "@/lib/syntax";
import type { Comment, CommentCategory } from "@/types/comment";

const categoryColors: Record<CommentCategory, string> = {
  suggestion:
    "bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300",
  issue: "bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300",
  question:
    "bg-purple-100 text-purple-800 dark:bg-purple-900/50 dark:text-purple-300",
  nitpick:
    "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300",
  praise:
    "bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300",
};

export function CommentList() {
  const {
    getAllComments,
    removeComment,
    exportToMarkdown,
    clearAllComments,
    setDraft,
  } = useCommentStore();
  const { repoPath } = useGitStore();
  const comments = getAllComments();
  const [sendStatus, setSendStatus] = useState<"idle" | "sending" | "sent">(
    "idle",
  );

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

      <div className="flex-1 overflow-y-auto p-2 space-y-2">
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
}

function CommentCard({ comment, onDelete, onEdit }: CommentCardProps) {
  const lineRef =
    comment.startLine === comment.endLine
      ? `Line ${comment.startLine}`
      : `Lines ${comment.startLine}-${comment.endLine}`;

  return (
    <div
      onClick={onEdit}
      className="bg-gray-50 dark:bg-gray-800 rounded-md p-3 text-sm cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-medium text-gray-900 dark:text-gray-100 truncate">
              {comment.filePath.split("/").pop()}
            </span>
            <span className="text-gray-500 dark:text-gray-400 text-xs">
              {lineRef}
            </span>
            <span
              className={clsx(
                "w-5 h-5 rounded flex items-center justify-center text-xs font-bold",
                comment.isOld
                  ? "bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300"
                  : "bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300",
              )}
            >
              {comment.isOld ? "−" : "+"}
            </span>
            <span
              className={clsx(
                "px-1.5 py-0.5 rounded text-xs font-medium",
                categoryColors[comment.category],
              )}
            >
              {comment.category}
            </span>
          </div>
          <p className="text-gray-500 dark:text-gray-400 text-xs truncate mt-0.5">
            {comment.filePath}
          </p>
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          className="flex-shrink-0 text-gray-400 hover:text-red-500 dark:hover:text-red-400"
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

      {comment.codeSnippet && (
        <div className="mt-2 bg-gray-100 dark:bg-gray-900 rounded px-2 py-1 font-mono text-xs overflow-x-auto">
          <code className="text-gray-700 dark:text-gray-300 whitespace-pre">
            <HighlightedContent
              content={
                comment.codeSnippet.slice(0, 100) +
                (comment.codeSnippet.length > 100 ? "..." : "")
              }
              language={getLanguageFromPath(comment.filePath)}
              isDark={document.documentElement.classList.contains("dark")}
            />
          </code>
        </div>
      )}

      <p className="mt-2 text-gray-700 dark:text-gray-300">{comment.content}</p>
    </div>
  );
}
