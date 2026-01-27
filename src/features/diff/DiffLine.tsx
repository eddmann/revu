import { clsx } from "clsx";
import type { Language } from "prism-react-renderer";
import type { DiffLine as DiffLineType, LineType } from "@/types/git";
import type { Comment } from "@/types/comment";
import type { DiffSegment } from "@/lib/wordDiff";
import { HighlightedContent } from "./HighlightedContent";

interface DiffLineProps {
  line: DiffLineType;
  lineIndex: number;
  comments: Comment[];
  onLineClick: (
    lineNo: number,
    isOld: boolean,
    content: string,
    shiftKey: boolean,
  ) => void;
  onLineHover?: (lineNo: number | null) => void;
  showOldLineNo?: boolean;
  showNewLineNo?: boolean;
  language: Language;
  diffSegments?: DiffSegment[];
  isRangeSelectionStart?: boolean;
  isInRangePreview?: boolean;
}

const lineTypeStyles: Record<LineType, string> = {
  addition:
    "bg-green-100 dark:bg-green-900/30 text-green-900 dark:text-green-100",
  deletion: "bg-red-100 dark:bg-red-900/30 text-red-900 dark:text-red-100",
  context: "bg-transparent",
  header:
    "bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 font-medium",
};

const lineNoPrefixStyles: Record<LineType, string> = {
  addition: "bg-green-200 dark:bg-green-900/50",
  deletion: "bg-red-200 dark:bg-red-900/50",
  context: "bg-gray-50 dark:bg-gray-800",
  header: "bg-blue-100 dark:bg-blue-900/30",
};

export function DiffLine({
  line,
  comments,
  onLineClick,
  onLineHover,
  showOldLineNo = true,
  showNewLineNo = true,
  language,
  diffSegments,
  isRangeSelectionStart = false,
  isInRangePreview = false,
}: DiffLineProps) {
  // Detect dark mode
  const isDark = document.documentElement.classList.contains("dark");

  const hasComments = comments.length > 0;
  const lineNo = line.newLineNo ?? line.oldLineNo;
  const isOld = line.lineType === "deletion";

  const handleClick = (e: React.MouseEvent) => {
    if (lineNo !== undefined) {
      onLineClick(lineNo, isOld, line.content, e.shiftKey);
    }
  };

  const prefix =
    line.lineType === "addition"
      ? "+"
      : line.lineType === "deletion"
        ? "-"
        : " ";

  return (
    <div
      className={clsx(
        "flex font-mono text-sm leading-6 group h-full",
        lineTypeStyles[line.lineType],
        hasComments && "ring-1 ring-inset ring-yellow-400 dark:ring-yellow-600",
      )}
    >
      {/* Clickable gutter container */}
      <div
        className={clsx(
          "flex flex-shrink-0 cursor-pointer group/gutter",
          isInRangePreview
            ? "bg-blue-200 dark:bg-blue-700"
            : lineNoPrefixStyles[line.lineType],
          "hover:bg-blue-200 dark:hover:bg-blue-700 active:bg-blue-300 dark:active:bg-blue-600",
          "transition-colors",
          isRangeSelectionStart &&
            "ring-2 ring-purple-400 dark:ring-purple-600",
        )}
        onClick={handleClick}
        onMouseEnter={() => onLineHover?.(lineNo ?? null)}
        onMouseLeave={() => onLineHover?.(null)}
      >
        {showOldLineNo && (
          <span
            className={clsx(
              "w-12 flex-shrink-0 text-right pr-2 text-gray-500 dark:text-gray-500 select-none",
            )}
          >
            {line.oldLineNo ?? ""}
          </span>
        )}
        {showNewLineNo && (
          <span
            className={clsx(
              "w-12 flex-shrink-0 text-right pr-1 text-gray-500 dark:text-gray-500 select-none relative",
            )}
          >
            {line.newLineNo ?? ""}
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
        )}
      </div>

      {/* Non-clickable content - allows text selection */}
      <span
        className={clsx(
          "w-6 flex-shrink-0 text-center select-none",
          line.lineType === "addition" && "text-green-600 dark:text-green-400",
          line.lineType === "deletion" && "text-red-600 dark:text-red-400",
        )}
      >
        {prefix}
      </span>
      <span className="flex-1 whitespace-pre">
        <HighlightedContent
          content={line.content}
          language={language}
          diffSegments={diffSegments}
          isDark={isDark}
        />
      </span>
      {hasComments && (
        <span className="w-6 flex-shrink-0 text-center text-yellow-600 dark:text-yellow-400">
          {comments.length}
        </span>
      )}
    </div>
  );
}
