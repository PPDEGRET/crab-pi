---
description: Review for structural simplification and code-judo opportunities
argument-hint: "[scope]"
---
# Review: Code Judo

Use when a change works but may be carrying too much incidental complexity.

Review only for structural simplification. Look for reframings that preserve behavior while deleting branches, helpers, modes, state, wrappers, or layers.

## Questions

- Is there a simpler model that makes the implementation feel inevitable?
- Can whole conditionals, options, helpers, or orchestration steps disappear?
- Is a refactor merely moving complexity around instead of deleting it?
- Is the change fighting the existing architecture instead of using it?
- Would changing the ownership boundary make the feature natural?

## Flag

- complicated flows where a simpler reframing is visible;
- state models that force repeated special cases;
- abstractions that exist only because the current model is awkward;
- sequencing or partial updates that could become simpler with a different structure.

## Output

For each finding, give the current shape, the simpler reframing, what complexity it deletes, and the risk of the recommendation.

## User arguments

$ARGUMENTS
