export function stripIndent(text: string): string {
  const lines = text.split("\n");
  const indents = lines
    .filter((l) => l.trim().length > 0)
    .map((l) => l.match(/^(\s*)/)?.[1].length ?? 0);
  const min = Math.min(...indents);
  if (min === 0) return text;
  return lines.map((l) => l.slice(min)).join("\n");
}
