import React, { useState } from "react";
import { clsx } from "clsx";
import { useCommentStore } from "@/stores/commentStore";
import { Button } from "@/components/ui";
import { HighlightedContent } from "@/features/diff/HighlightedContent";
import { getLanguageFromPath } from "@/lib/syntax";
import { stripIndent } from "@/lib/stripIndent";
import type { CommentCategory } from "@/types/comment";

const categories: { value: CommentCategory; label: string; color: string }[] = [
  { value: "suggestion", label: "Suggestion", color: "bg-blue-500" },
  { value: "issue", label: "Issue", color: "bg-red-500" },
  { value: "question", label: "Question", color: "bg-purple-500" },
  { value: "nitpick", label: "Nitpick", color: "bg-yellow-500" },
  { value: "praise", label: "Praise", color: "bg-green-500" },
];

export function CommentPopover() {
  const { draft, setDraft, addComment, updateComment } = useCommentStore();
  const [content, setContent] = useState("");
  const [category, setCategory] = useState<CommentCategory>("suggestion");

  // Initialize state from draft when editing
  const isEditing = draft?.editingId !== undefined;
  const initializedRef = React.useRef(false);

  React.useEffect(() => {
    if (draft && !initializedRef.current) {
      if (draft.existingContent) setContent(draft.existingContent);
      if (draft.existingCategory) setCategory(draft.existingCategory);
      initializedRef.current = true;
    }
    if (!draft) {
      initializedRef.current = false;
    }
  }, [draft]);

  if (!draft) return null;

  const handleSubmit = () => {
    if (!content.trim()) return;

    if (draft.editingId) {
      // Edit existing comment
      updateComment(draft.filePath, draft.editingId, content.trim(), category);
      setDraft(null);
    } else {
      // Create new comment
      addComment(
        draft.filePath,
        draft.startLine,
        draft.endLine,
        content.trim(),
        category,
        draft.codeSnippet,
        draft.isOld,
      );
    }
    setContent("");
    setCategory("suggestion");
  };

  const handleCancel = () => {
    setDraft(null);
    setContent("");
    setCategory("suggestion");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 dark:bg-black/40">
      <div className="w-full max-w-lg bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700">
        <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
          <h3 className="font-medium text-gray-900 dark:text-gray-100">
            {isEditing ? "Edit Comment" : "Add Comment"}
          </h3>
          <div className="flex items-center gap-2 mt-1">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {draft.filePath}:{draft.startLine}
              {draft.endLine !== draft.startLine && `-${draft.endLine}`}
            </p>
            <span
              className={clsx(
                "w-5 h-5 rounded flex items-center justify-center text-xs font-bold",
                draft.isOld
                  ? "bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300"
                  : "bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300",
              )}
            >
              {draft.isOld ? "−" : "+"}
            </span>
          </div>
        </div>

        <div className="p-4 space-y-4">
          {draft.codeSnippet && (
            <div className="relative bg-gray-50 dark:bg-gray-900 rounded-md p-2 font-mono text-sm overflow-hidden">
              <div className="pointer-events-none absolute inset-y-0 right-0 w-12 bg-gradient-to-r from-transparent to-gray-50 dark:to-gray-900" />
              <code className="text-gray-800 dark:text-gray-200 whitespace-pre">
                <HighlightedContent
                  content={stripIndent(draft.codeSnippet)}
                  language={getLanguageFromPath(draft.filePath)}
                  isDark={document.documentElement.classList.contains("dark")}
                />
              </code>
            </div>
          )}

          <div className="flex flex-wrap gap-2">
            {categories.map((cat) => (
              <button
                key={cat.value}
                onClick={() => setCategory(cat.value)}
                className={clsx(
                  "px-3 py-1 rounded-full text-sm font-medium transition-colors",
                  category === cat.value
                    ? `${cat.color} text-white`
                    : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600",
                )}
              >
                {cat.label}
              </button>
            ))}
          </div>

          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Write your comment..."
            className="w-full h-32 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            autoFocus
          />
        </div>

        <div className="px-4 py-3 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-2">
          <Button variant="secondary" onClick={handleCancel}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={!content.trim()}>
            {isEditing ? "Save Changes" : "Add Comment"}
          </Button>
        </div>
      </div>
    </div>
  );
}
