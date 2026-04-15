import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Comment, CommentCategory, CommentDraft } from "@/types/comment";
import { getLanguageFromPath } from "@/lib/syntax";

interface CommentState {
  currentRepoPath: string | null;
  reviewContext: string; // "working" for changes mode, commit oid for commit mode
  comments: Record<string, Record<string, Record<string, Comment[]>>>; // repoPath -> reviewContext -> filePath -> comments
  draft: CommentDraft | null;

  setRepoPath: (repoPath: string) => void;
  setReviewContext: (context: string) => void;
  addComment: (
    filePath: string,
    startLine: number,
    endLine: number,
    content: string,
    category: CommentCategory,
    codeSnippet: string,
    isOld: boolean,
  ) => void;
  removeComment: (filePath: string, commentId: string) => void;
  updateComment: (
    filePath: string,
    commentId: string,
    content: string,
    category: CommentCategory,
  ) => void;
  getFileComments: (filePath: string) => Comment[];
  getAllComments: () => Comment[];
  setDraft: (draft: CommentDraft | null) => void;
  clearAllComments: () => void;
  exportToMarkdown: (commitOid?: string) => string;
  // Demo mode - accepts pre-built comments
  initDemoComments: (repoPath: string, comments: Record<string, Comment[]>) => void;
}

export const useCommentStore = create<CommentState>()(
  persist(
    (set, get) => ({
      currentRepoPath: null,
      reviewContext: "working",
      comments: {},
      draft: null,

      setRepoPath: (repoPath) => set({ currentRepoPath: repoPath }),

      setReviewContext: (context) => set({ reviewContext: context }),

      addComment: (
        filePath,
        startLine,
        endLine,
        content,
        category,
        codeSnippet,
        isOld,
      ) => {
        const { currentRepoPath, reviewContext } = get();
        if (!currentRepoPath) return;

        const comment: Comment = {
          id: crypto.randomUUID(),
          filePath,
          startLine,
          endLine,
          content,
          category,
          codeSnippet,
          createdAt: Date.now(),
          isOld,
        };

        set((state) => ({
          comments: {
            ...state.comments,
            [currentRepoPath]: {
              ...(state.comments[currentRepoPath] || {}),
              [reviewContext]: {
                ...(state.comments[currentRepoPath]?.[reviewContext] || {}),
                [filePath]: [
                  ...(state.comments[currentRepoPath]?.[reviewContext]?.[filePath] || []),
                  comment,
                ],
              },
            },
          },
          draft: null,
        }));
      },

      removeComment: (filePath, commentId) => {
        const { currentRepoPath, reviewContext } = get();
        if (!currentRepoPath) return;

        set((state) => ({
          comments: {
            ...state.comments,
            [currentRepoPath]: {
              ...(state.comments[currentRepoPath] || {}),
              [reviewContext]: {
                ...(state.comments[currentRepoPath]?.[reviewContext] || {}),
                [filePath]: (
                  state.comments[currentRepoPath]?.[reviewContext]?.[filePath] || []
                ).filter((c) => c.id !== commentId),
              },
            },
          },
        }));
      },

      updateComment: (filePath, commentId, content, category) => {
        const { currentRepoPath, reviewContext } = get();
        if (!currentRepoPath) return;

        set((state) => ({
          comments: {
            ...state.comments,
            [currentRepoPath]: {
              ...(state.comments[currentRepoPath] || {}),
              [reviewContext]: {
                ...(state.comments[currentRepoPath]?.[reviewContext] || {}),
                [filePath]: (
                  state.comments[currentRepoPath]?.[reviewContext]?.[filePath] || []
                ).map((c) =>
                  c.id === commentId ? { ...c, content, category } : c,
                ),
              },
            },
          },
        }));
      },

      getFileComments: (filePath) => {
        const { currentRepoPath, reviewContext, comments } = get();
        if (!currentRepoPath) return [];
        return comments[currentRepoPath]?.[reviewContext]?.[filePath] || [];
      },

      getAllComments: () => {
        const { currentRepoPath, reviewContext, comments } = get();
        if (!currentRepoPath) return [];
        const contextComments = comments[currentRepoPath]?.[reviewContext] || {};
        return Object.values(contextComments)
          .flat()
          .sort((a, b) => {
            if (a.filePath !== b.filePath)
              return a.filePath.localeCompare(b.filePath);
            return a.startLine - b.startLine;
          });
      },

      setDraft: (draft) => set({ draft }),

      clearAllComments: () => {
        const { currentRepoPath, reviewContext } = get();
        if (!currentRepoPath) return;

        set((state) => ({
          comments: {
            ...state.comments,
            [currentRepoPath]: {
              ...(state.comments[currentRepoPath] || {}),
              [reviewContext]: {},
            },
          },
        }));
      },

      initDemoComments: (repoPath: string, comments: Record<string, Comment[]>) => {
        set({
          currentRepoPath: repoPath,
          reviewContext: "working",
          comments: {
            [repoPath]: { working: comments },
          },
        });
      },

      exportToMarkdown: (commitOid?: string) => {
        const allComments = get().getAllComments();
        if (allComments.length === 0) return "";

        // Group by category
        const byCategory: Record<CommentCategory, Comment[]> = {
          issue: [],
          suggestion: [],
          question: [],
          nitpick: [],
          praise: [],
        };

        for (const comment of allComments) {
          byCategory[comment.category].push(comment);
        }

        const actionRequired =
          byCategory.issue.length + byCategory.suggestion.length;
        const s = (n: number) => (n !== 1 ? "s" : "");

        // Build XML-structured output
        let output = `<revu-review>
The user has reviewed code changes and left ${allComments.length} comment${s(allComments.length)}. Process each comment according to its category.

<review-categories>
- ISSUE: Bug or error — must be fixed
- SUGGESTION: Improvement — implement unless problematic
- QUESTION: Clarification needed — explain your reasoning
- NITPICK: Minor preference — fix if easy
- PRAISE: Positive feedback — no change needed
</review-categories>

<review-summary>
Total: ${allComments.length} comment${s(allComments.length)}
Action required: ${actionRequired}${actionRequired > 0 ? ` (${byCategory.issue.length} issue${s(byCategory.issue.length)}, ${byCategory.suggestion.length} suggestion${s(byCategory.suggestion.length)})` : ""}
Questions: ${byCategory.question.length}
</review-summary>

`;

        // Add each comment as structured XML
        allComments.forEach((comment, index) => {
          const lang = getLanguageFromPath(comment.filePath);
          const side = comment.isOld ? "old" : "new";
          const lineRef =
            comment.startLine === comment.endLine
              ? comment.startLine.toString()
              : `${comment.startLine}-${comment.endLine}`;

          output += `<comment id="${index + 1}">
<file>${comment.filePath}</file>
<line>${lineRef}</line>
<side>${side}</side>
<category>${comment.category}</category>
${commitOid ? `<commit>${commitOid}</commit>\n` : ""}${
  comment.codeSnippet
    ? `<code language="${lang}">
${comment.codeSnippet}</code>
`
    : ""
}<text>${comment.content}</text>
</comment>

`;
        });

        output += `</revu-review>`;
        return output.trim();
      },
    }),
    {
      name: "revu-comments-v2",
      partialize: (state) => ({ comments: state.comments }),
    },
  ),
);
