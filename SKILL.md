---
name: revu
description: Open revu to review code changes and get feedback
---

# Code Review with revu

This skill opens the revu application for interactive code review of the current working directory.

## How it works

1. Opens revu with the current repository
2. You review the code changes and add comments
3. Click "Send to Agent" in revu to export your review
4. The review comments are saved to `.revu` in the project

## Launching revu

Opening revu for review:

!`[ -s .revu ] || open -a revu --args "$PWD" 2>/dev/null`

## Getting Review Output

!`cat .revu 2>/dev/null || echo "No review comments yet. Open revu, add comments, and click 'Send to Agent'."`

## Instructions for the agent

When the user invokes this skill:

1. If there's review content above, incorporate it into your response
2. If no review content exists yet, tell the user revu is opening and they should add comments and click "Send to Agent", then run `/revu` again
