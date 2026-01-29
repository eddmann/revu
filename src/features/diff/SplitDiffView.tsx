import { useRef, useMemo, useEffect } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { clsx } from "clsx";
import type { FileDiff, DiffLine as DiffLineType } from "@/types/git";
import type { Comment } from "@/types/comment";
import type { DiffSegment } from "@/lib/wordDiff";
import type { ScrollToLine } from "@/stores/uiStore";
import { computeWordDiff, mergeSegments } from "@/lib/wordDiff";
import { getLanguageFromPath } from "@/lib/syntax";
import { HighlightedContent } from "./HighlightedContent";

interface SplitDiffViewProps {
  diff: FileDiff;
  comments: Comment[];
  onLineClick: (
    lineNo: number,
    isOld: boolean,
    content: string,
    shiftKey: boolean,
  ) => void;
  onContentClick: (comment: Comment) => void;
  onLineHover: (lineNo: number | null) => void;
  rangeSelectionStart?: number | null;
  rangeSelectionIsOld?: boolean | null;
  hoveredLine?: number | null;
  scrollToLine?: ScrollToLine | null;
  onScrollComplete?: () => void;
}

interface SplitLine {
  left: DiffLineType | null;
  right: DiffLineType | null;
  isHunkHeader: boolean;
  hunkHeader?: string;
  leftDiffSegments?: DiffSegment[];
  rightDiffSegments?: DiffSegment[];
}

export function SplitDiffView({
  diff,
  comments,
  onLineClick,
  onContentClick,
  onLineHover,
  rangeSelectionStart,
  rangeSelectionIsOld,
  hoveredLine,
  scrollToLine,
  onScrollComplete,
}: SplitDiffViewProps) {
  const parentRef = useRef<HTMLDivElement>(null);

  // Calculate max line width for horizontal scroll sizing
  // Absolutely positioned children don't contribute to parent intrinsic size,
  // so we need to calculate and set the width explicitly
  const maxContentWidth = useMemo(() => {
    let maxChars = 0;
    for (const hunk of diff.hunks) {
      for (const line of hunk.lines) {
        if (line.content.length > maxChars) {
          maxChars = line.content.length;
        }
      }
    }
    // Each side: line number (40px) + prefix (20px) + content + divider
    // Using ch units for accurate monospace width estimation
    // Multiply by 2 for split view (both sides need space)
    return maxChars > 0 ? `calc(${maxChars}ch + 150px)` : undefined;
  }, [diff.hunks]);

  const splitLines = useMemo(() => {
    const result: SplitLine[] = [];

    for (const hunk of diff.hunks) {
      result.push({
        left: null,
        right: null,
        isHunkHeader: true,
        hunkHeader: hunk.header,
      });

      const deletions: DiffLineType[] = [];
      const additions: DiffLineType[] = [];

      const flushQueues = () => {
        const maxLen = Math.max(deletions.length, additions.length);
        for (let i = 0; i < maxLen; i++) {
          const left = deletions[i] || null;
          const right = additions[i] || null;

          // Compute word-level diff when we have a paired deletion/addition
          let leftDiffSegments: DiffSegment[] | undefined;
          let rightDiffSegments: DiffSegment[] | undefined;

          if (left && right) {
            const { oldSegments, newSegments } = computeWordDiff(
              left.content,
              right.content,
            );
            leftDiffSegments = mergeSegments(oldSegments);
            rightDiffSegments = mergeSegments(newSegments);
          }

          result.push({
            left,
            right,
            isHunkHeader: false,
            leftDiffSegments,
            rightDiffSegments,
          });
        }
        deletions.length = 0;
        additions.length = 0;
      };

      for (const line of hunk.lines) {
        if (line.lineType === "deletion") {
          deletions.push(line);
        } else if (line.lineType === "addition") {
          additions.push(line);
        } else {
          flushQueues();
          result.push({
            left: line,
            right: line,
            isHunkHeader: false,
          });
        }
      }

      flushQueues();
    }

    return result;
  }, [diff.hunks]);

  const virtualizer = useVirtualizer({
    count: splitLines.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 24,
    overscan: 20,
  });

  const language = getLanguageFromPath(diff.path);

  // Scroll to target line when scrollToLine changes
  useEffect(() => {
    if (!scrollToLine) return;

    // Find the index in splitLines that matches the target
    const targetIndex = splitLines.findIndex((row) => {
      if (row.isHunkHeader) return false;
      if (scrollToLine.isOld) {
        // Look in left side (old/deletions)
        return row.left?.oldLineNo === scrollToLine.line;
      } else {
        // Look in right side (new/additions)
        return row.right?.newLineNo === scrollToLine.line;
      }
    });

    if (targetIndex !== -1) {
      virtualizer.scrollToIndex(targetIndex, { align: "center" });
    }

    onScrollComplete?.();
  }, [scrollToLine, splitLines, virtualizer, onScrollComplete]);

  const getLineComments = (lineNo: number | undefined, isOld: boolean) => {
    if (lineNo === undefined) return [];
    return comments.filter(
      (c) => c.isOld === isOld && c.startLine <= lineNo && c.endLine >= lineNo,
    );
  };

  if (diff.isBinary) {
    return (
      <div className="h-full flex items-center justify-center text-gray-500 dark:text-gray-400">
        <p className="text-sm">Binary file - cannot display diff</p>
      </div>
    );
  }

  if (diff.hunks.length === 0) {
    return (
      <div className="h-full flex items-center justify-center text-gray-500 dark:text-gray-400">
        <p className="text-sm">No changes in this file</p>
      </div>
    );
  }

  return (
    <div ref={parentRef} className="h-full overflow-auto">
      <div
        style={{
          height: `${virtualizer.getTotalSize()}px`,
          minWidth: maxContentWidth ?? "100%",
          position: "relative",
        }}
      >
        {virtualizer.getVirtualItems().map((virtualRow) => {
          const row = splitLines[virtualRow.index];

          if (row.isHunkHeader) {
            return (
              <div
                key={virtualRow.key}
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  width: "100%",
                  height: `${virtualRow.size}px`,
                  transform: `translateY(${virtualRow.start}px)`,
                }}
                className="bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 font-mono text-sm px-4 py-0.5 border-y border-blue-200 dark:border-blue-800"
              >
                {row.hunkHeader}
              </div>
            );
          }

          return (
            <div
              key={virtualRow.key}
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: "100%",
                height: `${virtualRow.size}px`,
                transform: `translateY(${virtualRow.start}px)`,
              }}
              className="flex"
            >
              <SplitSide
                line={row.left}
                isLeft={true}
                comments={getLineComments(row.left?.oldLineNo, true)}
                onLineClick={onLineClick}
                onContentClick={onContentClick}
                onLineHover={onLineHover}
                language={language}
                diffSegments={row.leftDiffSegments}
                isRangeSelectionStart={
                  rangeSelectionIsOld === true &&
                  row.left?.oldLineNo === rangeSelectionStart
                }
                isInRangePreview={
                  rangeSelectionIsOld === true &&
                  rangeSelectionStart != null &&
                  hoveredLine != null &&
                  row.left?.oldLineNo != null &&
                  row.left.oldLineNo >=
                    Math.min(rangeSelectionStart, hoveredLine) &&
                  row.left.oldLineNo <=
                    Math.max(rangeSelectionStart, hoveredLine)
                }
              />
              <div className="w-px bg-gray-200 dark:bg-gray-700" />
              <SplitSide
                line={row.right}
                isLeft={false}
                comments={getLineComments(row.right?.newLineNo, false)}
                onLineClick={onLineClick}
                onContentClick={onContentClick}
                onLineHover={onLineHover}
                language={language}
                diffSegments={row.rightDiffSegments}
                isRangeSelectionStart={
                  rangeSelectionIsOld === false &&
                  row.right?.newLineNo === rangeSelectionStart
                }
                isInRangePreview={
                  rangeSelectionIsOld === false &&
                  rangeSelectionStart != null &&
                  hoveredLine != null &&
                  row.right?.newLineNo != null &&
                  row.right.newLineNo >=
                    Math.min(rangeSelectionStart, hoveredLine) &&
                  row.right.newLineNo <=
                    Math.max(rangeSelectionStart, hoveredLine)
                }
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}

interface SplitSideProps {
  line: DiffLineType | null;
  isLeft: boolean;
  comments: Comment[];
  onLineClick: (
    lineNo: number,
    isOld: boolean,
    content: string,
    shiftKey: boolean,
  ) => void;
  onContentClick: (comment: Comment) => void;
  onLineHover: (lineNo: number | null) => void;
  language: ReturnType<typeof getLanguageFromPath>;
  diffSegments?: DiffSegment[];
  isRangeSelectionStart?: boolean;
  isInRangePreview?: boolean;
}

function SplitSide({
  line,
  isLeft,
  comments,
  onLineClick,
  onContentClick,
  onLineHover,
  language,
  diffSegments,
  isRangeSelectionStart = false,
  isInRangePreview = false,
}: SplitSideProps) {
  // Detect dark mode
  const isDark = document.documentElement.classList.contains("dark");

  if (!line) {
    return <div className="w-1/2 bg-gray-50 dark:bg-gray-800/50" />;
  }

  const hasComments = comments.length > 0;
  const lineNo = isLeft ? line.oldLineNo : line.newLineNo;

  const handleClick = (e: React.MouseEvent) => {
    if (lineNo !== undefined) {
      onLineClick(lineNo, isLeft, line.content, e.shiftKey);
    }
  };

  const handleContentClick = () => {
    // Don't trigger if text is being selected
    const selection = window.getSelection();
    if (selection && selection.toString().length > 0) {
      return;
    }

    if (hasComments) {
      // Find the most recent comment by createdAt
      const latestComment = comments.reduce((latest, comment) =>
        comment.createdAt > latest.createdAt ? comment : latest,
      );
      onContentClick(latestComment);
    }
  };

  const bgColor =
    line.lineType === "addition"
      ? "bg-green-100 dark:bg-green-900/30"
      : line.lineType === "deletion"
        ? "bg-red-100 dark:bg-red-900/30"
        : "";

  const lineNoBg =
    line.lineType === "addition"
      ? "bg-green-200 dark:bg-green-900/50"
      : line.lineType === "deletion"
        ? "bg-red-200 dark:bg-red-900/50"
        : "bg-gray-50 dark:bg-gray-800";

  return (
    <div
      className={clsx(
        "w-1/2 flex font-mono text-sm leading-6 group",
        bgColor,
        hasComments && "ring-1 ring-inset ring-yellow-400 dark:ring-yellow-600",
      )}
    >
      {/* Clickable gutter container */}
      <div
        className={clsx(
          "flex-shrink-0 cursor-pointer group/gutter",
          isInRangePreview ? "bg-blue-200 dark:bg-blue-700" : lineNoBg,
          "hover:bg-blue-200 dark:hover:bg-blue-700 active:bg-blue-300 dark:active:bg-blue-600",
          "transition-colors",
          isRangeSelectionStart &&
            "ring-2 ring-purple-400 dark:ring-purple-600",
        )}
        onClick={handleClick}
        onMouseEnter={() => onLineHover(lineNo ?? null)}
        onMouseLeave={() => onLineHover(null)}
      >
        <span
          className={clsx(
            "w-10 inline-block text-right pr-1 text-gray-500 dark:text-gray-500 select-none relative",
          )}
        >
          {lineNo ?? ""}
          {/* Plus icon on hover */}
          <svg
            className="w-4 h-4 absolute right-1 top-1/2 -translate-y-1/2 text-blue-700 dark:text-blue-200 opacity-0 group-hover/gutter:opacity-100 transition-opacity"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2.5}
              d="M12 4v16m8-8H4"
            />
          </svg>
        </span>
      </div>

      {/* Non-clickable content - allows text selection */}
      <span
        className={clsx(
          "w-5 flex-shrink-0 text-center select-none",
          line.lineType === "addition" && "text-green-600 dark:text-green-400",
          line.lineType === "deletion" && "text-red-600 dark:text-red-400",
        )}
      >
        {line.lineType === "addition"
          ? "+"
          : line.lineType === "deletion"
            ? "-"
            : " "}
      </span>
      <span
        className={clsx("flex-1 whitespace-pre", hasComments && "cursor-pointer")}
        onClick={handleContentClick}
      >
        <HighlightedContent
          content={line.content}
          language={language}
          diffSegments={diffSegments}
          isDark={isDark}
        />
      </span>
      {hasComments && (
        <span className="w-5 flex-shrink-0 text-center text-yellow-600 dark:text-yellow-400 text-xs">
          {comments.length}
        </span>
      )}
    </div>
  );
}
