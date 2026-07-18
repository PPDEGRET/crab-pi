---
description: Review repo/module structure and recommend useful file splits or reorganizations
argument-hint: "[scope]"
---
# Review: Repo Structure and Splits

Use for a repo-level maintainability review focused on whether files, modules, packages, and folders are organized around coherent responsibilities.

This is not just a large-file scan. Start from the architecture map, then decide whether size, coupling, naming, or mixed responsibilities suggest splitting or reorganizing.

## Process

1. Map the major directories, packages, and entrypoints relevant to the request.
2. Identify large or high-churn files. If exact token counts are unavailable, approximate tokens as characters / 4.
3. Treat these as review triggers, not automatic failures:
   - file over 5k tokens: split candidate;
   - file over 8k tokens: strong smell unless highly cohesive;
   - file over 12k tokens: presumptive reorganization candidate;
   - one change adds more than 1.5k tokens to a file: inspect for extractable seams.
4. For each candidate, inspect responsibilities, callers, tests, and nearby modules before recommending a split.
5. Prefer splits that improve locality and ownership, not arbitrary size reduction.

## Questions

- Which files or modules mix unrelated responsibilities?
- Which concepts require bouncing through too many files to understand?
- Are there god files, grab-bag utility folders, or package boundaries that no longer match ownership?
- Would extracting a focused module reduce caller knowledge?
- Would moving code to an existing canonical location be better than creating a new module?
- Are tests organized around the same boundaries as the code?

## Output

```md
## Repo structure findings

### <candidate file/module/folder>
Approx size: <tokens/lines if known>
Responsibilities mixed:
Evidence:
Recommended move:
Why this improves locality:
Split risk:
Recommendation strength: Strong / Worth exploring / Speculative
```

Do not recommend splitting solely because a file is large. Recommend it when the split creates a clearer owner, smaller interface, better test seam, or less cross-file navigation.

## User arguments

$ARGUMENTS
