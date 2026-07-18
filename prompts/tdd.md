---
description: Use behavior-focused red-green-refactor TDD.
argument-hint: "[feature/behavior]"
---
# TDD

Use test-driven development with a red-green-refactor loop.

Core rule: tests should verify behavior through public interfaces, not implementation details.

## Avoid horizontal slicing

Do not write all tests first, then all implementation.

Use vertical slices:

```text
RED: write one test for one behavior -> it fails
GREEN: write minimal code to pass -> it passes
REFACTOR: improve while tests stay green
```

## Planning

Before coding:

- identify the public interface or user-visible behavior;
- list the most important behaviors to test;
- prefer tests that survive internal refactors;
- use the project's glossary vocabulary when one exists;
- ask the user if behavior or interface choices are unclear.

## Per-cycle checklist

- [ ] Test describes behavior, not implementation.
- [ ] Test uses a public interface or realistic seam.
- [ ] Test fails for the expected reason.
- [ ] Code is minimal for this test.
- [ ] Tests pass before refactoring.
- [ ] No speculative features added.

## User arguments

$ARGUMENTS
