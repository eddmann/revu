import { useCallback, useEffect, useState } from "react";
import { useGitStore } from "@/stores/gitStore";
import { useCommentStore } from "@/stores/commentStore";
import { useUiStore } from "@/stores/uiStore";
import { UnifiedDiffView } from "./UnifiedDiffView";
import { SplitDiffView } from "./SplitDiffView";
import type { Comment } from "@/types/comment";

export function DiffViewer() {
  const { currentDiff, selectedFile, fetchDiff } = useGitStore();
  const { getFileComments, setDraft } = useCommentStore();
  const {
    diffViewMode,
    setDiffViewMode,
    showFullFileContext,
    setShowFullFileContext,
    ignoreWhitespace,
    setIgnoreWhitespace,
    scrollToLine,
    setScrollToLine,
  } = useUiStore();
  const [rangeStart, setRangeStart] = useState<{
    lineNo: number;
    content: string;
    isOld: boolean;
  } | null>(null);
  const [hoveredLine, setHoveredLine] = useState<number | null>(null);

  const comments = currentDiff ? getFileComments(currentDiff.path) : [];

  useEffect(() => {
    if (selectedFile) {
      fetchDiff(showFullFileContext, ignoreWhitespace);
    }
  }, [showFullFileContext, ignoreWhitespace, fetchDiff, selectedFile]);

  const handleLineClick = useCallback(
    (lineNo: number, isOld: boolean, content: string, shiftKey: boolean) => {
      if (!currentDiff) return;

      if (shiftKey) {
        // Shift+click for range selection
        if (rangeStart) {
          // Second shift+click - complete the range
          const startLine = Math.min(rangeStart.lineNo, lineNo);
          const endLine = Math.max(rangeStart.lineNo, lineNo);

          // Build snippet from ONLY the selected side
          const snippetLines: string[] = [];
          for (const hunk of currentDiff.hunks) {
            for (const line of hunk.lines) {
              if (rangeStart.isOld) {
                // Old side: include deletions + context where oldLineNo is in range
                if (
                  line.oldLineNo !== undefined &&
                  line.oldLineNo >= startLine &&
                  line.oldLineNo <= endLine &&
                  (line.lineType === "deletion" || line.lineType === "context")
                ) {
                  snippetLines.push(line.content);
                }
              } else {
                // New side: include additions + context where newLineNo is in range
                if (
                  line.newLineNo !== undefined &&
                  line.newLineNo >= startLine &&
                  line.newLineNo <= endLine &&
                  (line.lineType === "addition" || line.lineType === "context")
                ) {
                  snippetLines.push(line.content);
                }
              }
            }
          }

          setDraft({
            filePath: currentDiff.path,
            startLine,
            endLine,
            codeSnippet: snippetLines.join("\n"),
            isOld: rangeStart.isOld,
          });
          setRangeStart(null);
        } else {
          // First shift+click - start the range
          setRangeStart({ lineNo, content, isOld });
        }
      } else {
        // Regular click - single line comment
        setRangeStart(null);
        setDraft({
          filePath: currentDiff.path,
          startLine: lineNo,
          endLine: lineNo,
          codeSnippet: content,
          isOld,
        });
      }
    },
    [currentDiff, setDraft, rangeStart],
  );

  const handleLineHover = useCallback((lineNo: number | null) => {
    setHoveredLine(lineNo);
  }, []);

  const handleContentClick = useCallback(
    (comment: Comment) => {
      setDraft({
        filePath: comment.filePath,
        startLine: comment.startLine,
        endLine: comment.endLine,
        codeSnippet: comment.codeSnippet,
        isOld: comment.isOld,
        editingId: comment.id,
        existingContent: comment.content,
        existingCategory: comment.category,
      });
    },
    [setDraft],
  );

  if (!currentDiff || !selectedFile) {
    return (
      <div className="h-full flex items-center justify-center text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-900">
        <p className="text-sm">Select a file to view diff</p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-white dark:bg-gray-900">
      <div className="flex-shrink-0 flex items-center justify-between px-4 py-2 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-2">
          <span className="font-medium text-sm text-gray-900 dark:text-gray-100">
            {currentDiff.path}
          </span>
          {currentDiff.oldPath && (
            <span className="text-xs text-gray-500 dark:text-gray-400">
              (renamed from {currentDiff.oldPath})
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {rangeStart && (
            <span className="px-2 py-0.5 text-xs bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300 rounded">
              Range: {rangeStart.isOld ? "old" : "new"} line {rangeStart.lineNo}{" "}
              → Shift+click to end
            </span>
          )}
          <div className="flex rounded-md overflow-hidden border border-gray-300 dark:border-gray-600">
            <button
              onClick={() => setDiffViewMode("unified")}
              className={`px-2 py-1 text-xs ${
                diffViewMode === "unified"
                  ? "bg-blue-600 text-white"
                  : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
              }`}
            >
              Unified
            </button>
            <button
              onClick={() => setDiffViewMode("split")}
              className={`px-2 py-1 text-xs ${
                diffViewMode === "split"
                  ? "bg-blue-600 text-white"
                  : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
              }`}
            >
              Split
            </button>
          </div>
          <div className="border-l border-gray-300 dark:border-gray-600 h-4 mx-1" />
          <button
            onClick={() => setShowFullFileContext(!showFullFileContext)}
            className={`p-1.5 rounded ${
              showFullFileContext
                ? "bg-blue-600 text-white"
                : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
            }`}
            title="Show full file context"
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
                d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4"
              />
            </svg>
          </button>
          <button
            onClick={() => setIgnoreWhitespace(!ignoreWhitespace)}
            className={`p-1.5 rounded ${
              ignoreWhitespace
                ? "bg-blue-600 text-white"
                : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
            }`}
            title="Ignore whitespace changes"
          >
            <svg
              className="w-4 h-4"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6h16M4 12h16M4 18h7"
              />
              <path
                strokeLinecap="round"
                strokeWidth={2}
                d="M5 21l14-14"
                className="text-current"
              />
            </svg>
          </button>
        </div>
      </div>

      <div className="flex-1 min-h-0">
        {diffViewMode === "unified" ? (
          <UnifiedDiffView
            diff={currentDiff}
            comments={comments}
            onLineClick={handleLineClick}
            onContentClick={handleContentClick}
            onLineHover={handleLineHover}
            rangeSelectionStart={rangeStart?.lineNo ?? null}
            rangeSelectionIsOld={rangeStart?.isOld ?? null}
            hoveredLine={rangeStart ? hoveredLine : null}
            scrollToLine={scrollToLine}
            onScrollComplete={() => setScrollToLine(null)}
          />
        ) : (
          <SplitDiffView
            diff={currentDiff}
            comments={comments}
            onLineClick={handleLineClick}
            onContentClick={handleContentClick}
            onLineHover={handleLineHover}
            rangeSelectionStart={rangeStart?.lineNo ?? null}
            rangeSelectionIsOld={rangeStart?.isOld ?? null}
            hoveredLine={rangeStart ? hoveredLine : null}
            scrollToLine={scrollToLine}
            onScrollComplete={() => setScrollToLine(null)}
          />
        )}
      </div>
    </div>
  );
}
