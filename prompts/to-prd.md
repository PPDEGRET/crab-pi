---
description: Turn aligned context into a concise PRD.
argument-hint: "[feature/idea]"
---
# To PRD

Turn the current conversation and codebase understanding into a concise PRD. Do not interview the user unless a blocking product decision is missing; use `grill-me` first when alignment is not ready.

If a project issue tracker is configured, publish there. Otherwise draft the PRD in the conversation or a user-approved file; do not invent a tracker.

## Process

1. Explore the repo enough to understand current behavior and vocabulary.
2. Sketch the major modules or areas that may change.
3. Check with the user only on important product/module/testing choices.
4. Write the PRD.

## Template

```md
# PRD: <title>

## Problem Statement

The problem from the user's perspective.

## Solution

The solution from the user's perspective.

## User Stories

1. As an <actor>, I want <feature>, so that <benefit>.

## Implementation Decisions

- Modules/areas to build or modify.
- Interface/API/schema decisions.
- Technical clarifications.

Avoid specific file paths or code snippets unless a prototype produced a decision-rich snippet that is clearer than prose.

## Testing Decisions

- What behavior should be tested.
- Which modules/interfaces need tests.
- Similar tests already in the codebase.

## Out Of Scope

- Things this PRD deliberately excludes.

## Further Notes

- Anything useful that does not belong above.
```

## User arguments

$ARGUMENTS
