export type CommentCategory =
  | "suggestion"
  | "issue"
  | "question"
  | "nitpick"
  | "praise";

export interface Comment {
  id: string;
  filePath: string;
  startLine: number;
  endLine: number;
  content: string;
  category: CommentCategory;
  codeSnippet: string;
  createdAt: number;
  isOld: boolean; // true = old/deletion side, false = new/addition side
}

export interface AgentResponse {
  model: string;
  text: string;
}

export interface ReviewExport {
  path: string;
  commentIds: string[]; // index in the export (comment id - 1) -> Comment.id
}

export interface CommentDraft {
  filePath: string;
  startLine: number;
  endLine: number;
  codeSnippet: string;
  isOld: boolean; // true = old/deletion side, false = new/addition side
  // Edit mode fields
  editingId?: string;
  existingContent?: string;
  existingCategory?: CommentCategory;
}
