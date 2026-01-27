import { Highlight, themes } from "prism-react-renderer";
import { clsx } from "clsx";
import type { Language } from "prism-react-renderer";
import type { DiffSegment } from "@/lib/wordDiff";

interface HighlightedContentProps {
  content: string;
  language: Language;
  diffSegments?: DiffSegment[];
  isDark?: boolean;
}

/**
 * Renders syntax-highlighted code content with optional word-level diff highlighting
 */
export function HighlightedContent({
  content,
  language,
  diffSegments,
  isDark = false,
}: HighlightedContentProps) {
  const theme = isDark ? themes.vsDark : themes.vsLight;

  // If we have diff segments, we need to highlight within the diff context
  if (diffSegments && diffSegments.length > 0) {
    return (
      <Highlight theme={theme} code={content} language={language}>
        {({ tokens, getTokenProps }) => {
          // We need to map syntax tokens onto diff segments
          // Build a character-level mapping
          return (
            <span>
              {renderWithDiffHighlight(
                tokens[0] || [],
                getTokenProps,
                diffSegments,
              )}
            </span>
          );
        }}
      </Highlight>
    );
  }

  // Simple syntax highlighting without diff
  return (
    <Highlight theme={theme} code={content} language={language}>
      {({ tokens, getTokenProps }) => (
        <span>
          {(tokens[0] || []).map((token, i) => (
            <span key={i} {...getTokenProps({ token })} />
          ))}
        </span>
      )}
    </Highlight>
  );
}

/**
 * Render tokens with diff highlighting overlaid
 * This maps syntax highlighting tokens onto diff segments
 */
function renderWithDiffHighlight(
  tokens: Array<{ content: string; types: string[] }>,
  getTokenProps: (opts: {
    token: { content: string; types: string[] };
  }) => Record<string, unknown>,
  diffSegments: DiffSegment[],
): React.ReactNode[] {
  const result: React.ReactNode[] = [];

  // Build a flat string of the content with character positions
  let charIndex = 0;
  const segmentRanges: Array<{
    start: number;
    end: number;
    type: DiffSegment["type"];
  }> = [];

  for (const seg of diffSegments) {
    segmentRanges.push({
      start: charIndex,
      end: charIndex + seg.text.length,
      type: seg.type,
    });
    charIndex += seg.text.length;
  }

  // Now render each token, splitting it if it crosses diff segment boundaries
  let currentPos = 0;

  for (let tokenIdx = 0; tokenIdx < tokens.length; tokenIdx++) {
    const token = tokens[tokenIdx];
    const tokenStart = currentPos;
    const tokenEnd = currentPos + token.content.length;
    const baseProps = getTokenProps({ token });

    // Find all segments that overlap with this token
    const overlappingSegments = segmentRanges.filter(
      (seg) => seg.start < tokenEnd && seg.end > tokenStart,
    );

    if (overlappingSegments.length <= 1) {
      // Token is entirely within one segment (or no segments)
      const segment = overlappingSegments[0];
      const diffClass = segment ? getDiffClass(segment.type) : undefined;

      result.push(
        <span
          key={`${tokenIdx}`}
          {...baseProps}
          className={clsx(baseProps.className as string, diffClass)}
        />,
      );
    } else {
      // Token spans multiple diff segments - split it
      let pos = tokenStart;
      let partIdx = 0;

      for (const segment of overlappingSegments) {
        const overlapStart = Math.max(segment.start, tokenStart);
        const overlapEnd = Math.min(segment.end, tokenEnd);

        if (overlapStart > pos) {
          // Gap before this segment (shouldn't happen, but handle it)
          const gapText = token.content.slice(
            pos - tokenStart,
            overlapStart - tokenStart,
          );
          result.push(
            <span key={`${tokenIdx}-gap-${partIdx}`} {...baseProps}>
              {gapText}
            </span>,
          );
          partIdx++;
        }

        const partText = token.content.slice(
          overlapStart - tokenStart,
          overlapEnd - tokenStart,
        );
        const diffClass = getDiffClass(segment.type);

        result.push(
          <span
            key={`${tokenIdx}-${partIdx}`}
            {...baseProps}
            className={clsx(baseProps.className as string, diffClass)}
          >
            {partText}
          </span>,
        );
        partIdx++;
        pos = overlapEnd;
      }

      // Any remaining part after last segment
      if (pos < tokenEnd) {
        const remainingText = token.content.slice(pos - tokenStart);
        result.push(
          <span key={`${tokenIdx}-end`} {...baseProps}>
            {remainingText}
          </span>,
        );
      }
    }

    currentPos = tokenEnd;
  }

  return result;
}

function getDiffClass(type: DiffSegment["type"]): string | undefined {
  switch (type) {
    case "added":
      return "bg-green-300/50 dark:bg-green-600/40 rounded-sm";
    case "removed":
      return "bg-red-300/50 dark:bg-red-600/40 rounded-sm";
    default:
      return undefined;
  }
}
