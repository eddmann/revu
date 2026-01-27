import { useRef, useMemo } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import type { FileDiff } from "@/types/git";
import type { Comment } from "@/types/comment";
import type { DiffSegment } from "@/lib/wordDiff";
import { computeWordDiff, mergeSegments } from "@/lib/wordDiff";
import { getLanguageFromPath } from "@/lib/syntax";
import { DiffLine } from "./DiffLine";

interface UnifiedDiffViewProps {
  diff: FileDiff;
  comments: Comment[];
  onLineClick: (
    lineNo: number,
    isOld: boolean,
    content: string,
    shiftKey: boolean,
  ) => void;
  onLineHover: (lineNo: number | null) => void;
  rangeSelectionStart?: number | null;
  rangeSelectionIsOld?: boolean | null;
  hoveredLine?: number | null;
}

interface FlatLine {
  type: "hunk-header" | "line";
  content: string;
  line?: FileDiff["hunks"][0]["lines"][0];
  hunkIndex?: number;
  lineIndex?: number;
  diffSegments?: DiffSegment[];
}

export function UnifiedDiffView({
  diff,
  comments,
  onLineClick,
  onLineHover,
  rangeSelectionStart,
  rangeSelectionIsOld,
  hoveredLine,
}: UnifiedDiffViewProps) {
  const parentRef = useRef<HTMLDivElement>(null);
  const language = getLanguageFromPath(diff.path);

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
    // Line numbers (2 × 48px) + prefix (24px) + content + padding
    // Using ch units for accurate monospace width estimation
    return maxChars > 0 ? `calc(${maxChars}ch + 150px)` : undefined;
  }, [diff.hunks]);

  const flatLines = useMemo(() => {
    const lines: FlatLine[] = [];

    diff.hunks.forEach((hunk, hunkIndex) => {
      lines.push({
        type: "hunk-header",
        content: hunk.header,
        hunkIndex,
      });

      // First pass: collect lines
      const hunkLines: FlatLine[] = hunk.lines.map((line, lineIndex) => ({
        type: "line" as const,
        content: line.content,
        line,
        hunkIndex,
        lineIndex,
      }));

      // Second pass: compute word-level diff for adjacent deletion→addition pairs
      for (let i = 0; i < hunkLines.length - 1; i++) {
        const current = hunkLines[i];
        const next = hunkLines[i + 1];

        if (
          current.line?.lineType === "deletion" &&
          next.line?.lineType === "addition"
        ) {
          const { oldSegments, newSegments } = computeWordDiff(
            current.line.content,
            next.line.content,
          );
          current.diffSegments = mergeSegments(oldSegments);
          next.diffSegments = mergeSegments(newSegments);
          i++; // Skip the next line since we've already processed it
        }
      }

      lines.push(...hunkLines);
    });

    return lines;
  }, [diff.hunks]);

  const virtualizer = useVirtualizer({
    count: flatLines.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 24,
    overscan: 20,
  });

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
          const item = flatLines[virtualRow.index];

          if (item.type === "hunk-header") {
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
                {item.content}
              </div>
            );
          }

          const line = item.line!;
          const isOld = line.lineType === "deletion";
          const lineNo = isOld ? line.oldLineNo : line.newLineNo;
          const lineComments = getLineComments(lineNo, isOld);

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
            >
              <DiffLine
                line={line}
                lineIndex={virtualRow.index}
                comments={lineComments}
                onLineClick={onLineClick}
                onLineHover={onLineHover}
                language={language}
                diffSegments={item.diffSegments}
                isRangeSelectionStart={
                  rangeSelectionIsOld === isOld &&
                  lineNo === rangeSelectionStart
                }
                isInRangePreview={
                  rangeSelectionIsOld === isOld &&
                  rangeSelectionStart != null &&
                  hoveredLine != null &&
                  lineNo != null &&
                  lineNo >= Math.min(rangeSelectionStart, hoveredLine) &&
                  lineNo <= Math.max(rangeSelectionStart, hoveredLine)
                }
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
