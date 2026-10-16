import type { AgentResponse } from "@/types/comment";

export function parseResponses(
  review: string,
  commentIds: string[],
): Record<string, AgentResponse> {
  const responses: Record<string, AgentResponse> = {};
  for (const [, index, body] of review.matchAll(
    /<comment id="(\d+)">([\s\S]*?)<\/comment>/g,
  )) {
    const commentId = commentIds[Number(index) - 1];
    const response = body.match(
      /<response model="([^"]*)">([\s\S]*?)<\/response>/,
    );
    if (commentId && response) {
      responses[commentId] = {
        model: response[1].trim(),
        text: response[2].trim(),
      };
    }
  }
  return responses;
}
