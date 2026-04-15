import { useMemo } from "react";
import { useCommentStore } from "@/stores/commentStore";

export function useCommentCountByFile(): Record<string, number> {
  const comments = useCommentStore((state) => state.comments);
  const currentRepoPath = useCommentStore((state) => state.currentRepoPath);
  const reviewContext = useCommentStore((state) => state.reviewContext);

  return useMemo(() => {
    const counts: Record<string, number> = {};
    if (!currentRepoPath) return counts;
    const contextComments = comments[currentRepoPath]?.[reviewContext] || {};
    for (const [filePath, fileComments] of Object.entries(contextComments)) {
      counts[filePath] = fileComments.length;
    }
    return counts;
  }, [comments, currentRepoPath, reviewContext]);
}
