export interface DiffSegment {
  text: string;
  type: "unchanged" | "added" | "removed";
}

/**
 * Tokenize a string into words and whitespace/punctuation
 * Preserves all characters so we can reconstruct the line
 */
function tokenize(str: string): string[] {
  const tokens: string[] = [];
  let current = "";
  let inWord = false;

  for (const char of str) {
    const isWordChar = /\w/.test(char);

    if (isWordChar !== inWord && current) {
      tokens.push(current);
      current = "";
    }

    current += char;
    inWord = isWordChar;
  }

  if (current) {
    tokens.push(current);
  }

  return tokens;
}

/**
 * Compute longest common subsequence of two arrays
 * Returns indices of matching elements
 */
function lcs<T>(a: T[], b: T[]): Array<[number, number]> {
  const m = a.length;
  const n = b.length;

  // Build LCS length table
  const dp: number[][] = Array.from({ length: m + 1 }, () =>
    Array(n + 1).fill(0),
  );

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (a[i - 1] === b[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1] + 1;
      } else {
        dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
      }
    }
  }

  // Backtrack to find matching pairs
  const result: Array<[number, number]> = [];
  let i = m;
  let j = n;

  while (i > 0 && j > 0) {
    if (a[i - 1] === b[j - 1]) {
      result.unshift([i - 1, j - 1]);
      i--;
      j--;
    } else if (dp[i - 1][j] > dp[i][j - 1]) {
      i--;
    } else {
      j--;
    }
  }

  return result;
}

/**
 * Compute word-level diff between old and new lines
 * Returns segments for both old (with removals) and new (with additions)
 */
export function computeWordDiff(
  oldLine: string,
  newLine: string,
): { oldSegments: DiffSegment[]; newSegments: DiffSegment[] } {
  const oldTokens = tokenize(oldLine);
  const newTokens = tokenize(newLine);

  const matches = lcs(oldTokens, newTokens);

  // Build old line segments
  const oldSegments: DiffSegment[] = [];
  let oldIdx = 0;
  for (const [oldMatchIdx] of matches) {
    // Everything before the match is removed
    while (oldIdx < oldMatchIdx) {
      oldSegments.push({ text: oldTokens[oldIdx], type: "removed" });
      oldIdx++;
    }
    // The match itself is unchanged
    oldSegments.push({ text: oldTokens[oldIdx], type: "unchanged" });
    oldIdx++;
  }
  // Remaining tokens are removed
  while (oldIdx < oldTokens.length) {
    oldSegments.push({ text: oldTokens[oldIdx], type: "removed" });
    oldIdx++;
  }

  // Build new line segments
  const newSegments: DiffSegment[] = [];
  let newIdx = 0;
  for (const [, newMatchIdx] of matches) {
    // Everything before the match is added
    while (newIdx < newMatchIdx) {
      newSegments.push({ text: newTokens[newIdx], type: "added" });
      newIdx++;
    }
    // The match itself is unchanged
    newSegments.push({ text: newTokens[newIdx], type: "unchanged" });
    newIdx++;
  }
  // Remaining tokens are added
  while (newIdx < newTokens.length) {
    newSegments.push({ text: newTokens[newIdx], type: "added" });
    newIdx++;
  }

  return { oldSegments, newSegments };
}

/**
 * Merge consecutive segments of the same type for cleaner rendering
 */
export function mergeSegments(segments: DiffSegment[]): DiffSegment[] {
  if (segments.length === 0) return [];

  const merged: DiffSegment[] = [];
  let current = { ...segments[0] };

  for (let i = 1; i < segments.length; i++) {
    if (segments[i].type === current.type) {
      current.text += segments[i].text;
    } else {
      merged.push(current);
      current = { ...segments[i] };
    }
  }

  merged.push(current);
  return merged;
}
