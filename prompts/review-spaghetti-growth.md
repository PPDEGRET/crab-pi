---
description: Review for scattered conditionals, special cases, and feature leakage
argument-hint: "[scope]"
---
# Review: Spaghetti Growth

Use when a diff may have added scattered conditionals, special cases, flags, or feature leakage into existing flows.

Review for branching complexity, locality, and whether new behavior belongs behind a clearer abstraction.

## Questions

- Did the change add weird `if` statements in unrelated places?
- Are feature checks, mode flags, nullable states, or one-off booleans spreading?
- Are edge cases being handled inside already-busy functions?
- Are repeated conditionals signaling a missing model, helper, dispatcher, policy object, or module?
- Did shared/general-purpose code gain feature-specific knowledge?

## Preferred fixes

- isolate feature-specific behavior behind a dedicated abstraction;
- replace condition chains with an explicit typed model or dispatcher;
- move logic to the owning layer/module;
- collapse duplicate branches into one clearer flow;
- turn special cases into a simpler default path with fewer exceptions.

## Output

Prioritize places where the code became harder to reason about even if behavior is correct. Include file/line, why the branching is risky, and the smallest structural move that restores locality.

## User arguments

$ARGUMENTS
