import { describe, expect, test } from "bun:test";
import { parseResponses } from "../src/lib/agentResponses";

const review = (comments: string) => `<revu-review>
<responding>
Insert a <response model="MODEL">your reply</response> element directly before that comment's closing </comment> tag.
</responding>

${comments}
</revu-review>`;

describe("parseResponses", () => {
  test("maps each reply to the comment at that export position", () => {
    const responses = parseResponses(
      review(`<comment id="1">
<text>First</text>
<response model="Claude Opus 5.5">  Fixed it.
Second line.  </response>
</comment>

<comment id="2">
<text>Second</text>
<response model="Claude Sonnet 5.5">Explained.</response>
</comment>`),
      ["comment-a", "comment-b"],
    );

    expect(responses).toEqual({
      "comment-a": { model: "Claude Opus 5.5", text: "Fixed it.\nSecond line." },
      "comment-b": { model: "Claude Sonnet 5.5", text: "Explained." },
    });
  });

  test("skips comments without a reply", () => {
    const responses = parseResponses(
      review(`<comment id="1">
<text>No reply yet</text>
</comment>`),
      ["comment-a"],
    );

    expect(responses).toEqual({});
  });

  test("ignores replies to comment numbers that were not exported", () => {
    const responses = parseResponses(
      review(`<comment id="3">
<response model="Claude Opus 5.5">Orphan</response>
</comment>`),
      ["comment-a"],
    );

    expect(responses).toEqual({});
  });

  test("does not read the example in the instructions as a reply", () => {
    expect(parseResponses(review(""), ["comment-a"])).toEqual({});
  });
});
