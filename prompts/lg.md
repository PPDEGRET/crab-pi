---
description: Summarize the current git status and diff concisely
argument-hint: optional focus
---
Inspect the current repository with read-only git commands, including `git status --short`, `git diff --stat`, `git diff`, and `git diff --cached` when staged changes exist.

Respond with only:

1. `Summary:` one or two sentences describing the change.
2. `Files:` bullets grouped as modified/added/deleted/renamed when relevant.
3. `Notable diffs:` up to five concise bullets focused on behavior, interfaces, config, and risks.
4. `Tests/verification seen:` only evidence present in the command output or current session.
5. `Uncommitted/attention:` warnings for an unstaged/staged split, generated or lockfile-heavy diffs, secrets-looking content, or missing verification.

Keep it short. Prefer concrete file names and observed facts. Do not invent intent. If the user provided a focus argument, use it only as emphasis: `$ARGUMENTS`.
