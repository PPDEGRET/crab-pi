---
description: Break a plan/PRD into vertical-slice issues.
argument-hint: "[plan/prd]"
---
# To Issues

Break a plan, spec, or PRD into independently grabbable vertical-slice issues.

If a project issue tracker is configured, publish there after user approval. Otherwise draft the issues in the conversation or a user-approved file; do not invent a tracker.

## Process

1. Work from existing context. If given an issue/PRD/path, read it first.
2. Explore the codebase only as much as needed.
3. Draft tracer-bullet slices: each slice should deliver a narrow but complete path through the relevant layers.
4. Mark each slice as:
   - `AFK`: agent can implement without more human input;
   - `HITL`: needs a human decision, design review, credential, or external check.
5. Ask the user to approve granularity and dependencies before publishing.

## Slice rules

- A completed slice is demoable or verifiable on its own.
- Prefer many thin slices over a few thick ones.
- Avoid horizontal tickets like "build database layer" unless that layer is independently useful.

## Issue template

```md
# <title>

## Parent

<PRD/issue reference, if any>

## What to build

Concise end-to-end behavior for this slice.

Avoid file paths/code snippets unless they encode a durable decision better than prose.

## Acceptance criteria

- [ ] Criterion 1
- [ ] Criterion 2
- [ ] Criterion 3

## Blocked by

- None - can start immediately.
```

Do not close or modify parent issues unless explicitly asked.

## User arguments

$ARGUMENTS
