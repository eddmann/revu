import type { Language } from "prism-react-renderer";

const extensionToLanguage: Record<string, Language> = {
  // JavaScript/TypeScript
  js: "javascript",
  jsx: "jsx",
  ts: "typescript",
  tsx: "tsx",
  mjs: "javascript",
  cjs: "javascript",

  // Web
  html: "markup",
  htm: "markup",
  xml: "markup",
  svg: "markup",
  css: "css",
  scss: "css",
  less: "css",

  // Data formats
  json: "json",
  yaml: "yaml",
  yml: "yaml",
  toml: "toml",

  // Systems
  rs: "rust",
  go: "go",
  c: "c",
  h: "c",
  cpp: "cpp",
  cc: "cpp",
  hpp: "cpp",
  swift: "swift",
  m: "objectivec",
  mm: "objectivec",

  // Scripting
  py: "python",
  rb: "ruby",
  php: "php",
  sh: "bash",
  bash: "bash",
  zsh: "bash",

  // JVM
  java: "java",
  kt: "kotlin",
  scala: "scala",

  // Other
  sql: "sql",
  md: "markdown",
  markdown: "markdown",
  graphql: "graphql",
  gql: "graphql",
  diff: "diff",
};

export function getLanguageFromPath(filePath: string): Language {
  const ext = filePath.split(".").pop()?.toLowerCase() || "";
  return extensionToLanguage[ext] || "plain";
}
