---
description: Debug with a reproduce/hypothesise/instrument/fix loop.
argument-hint: "<bug/symptom>"
---
# Diagnose

Use a disciplined diagnosis loop for hard bugs and regressions: feedback loop -> reproduce -> hypothesise -> instrument -> fix -> regression-test.

## 1. Build a feedback loop

Find or create a fast, deterministic, agent-runnable pass/fail signal for the bug.

Try, in order:

1. failing test;
2. curl/HTTP script;
3. CLI invocation with fixture input;
4. headless browser script;
5. replayed trace or captured payload;
6. throwaway harness;
7. property/fuzz loop;
8. bisection harness;
9. differential loop;
10. structured human-in-the-loop script as last resort.

If no loop is possible, say what you tried and ask for the missing artifact or environment. Do not keep guessing.

## 2. Reproduce

Confirm the loop shows the user's failure, not a nearby failure. Capture the exact symptom.

## 3. Hypothesise

Generate 3-5 ranked, falsifiable hypotheses before testing. For each, state what observation would confirm or falsify it.

## 4. Instrument

Map each probe to a hypothesis. Change one variable at a time. Prefer debugger/REPL, then targeted logs. Tag temporary logs with a unique `[DEBUG-...]` prefix.

For performance regressions: measure baseline first, then bisect or profile.

## 5. Fix and regression-test

If there is a correct test seam, turn the minimized repro into a failing regression test before fixing. If no correct seam exists, document that as an architecture finding.

## 6. Cleanup

Before declaring done:

- original repro no longer reproduces;
- regression test passes, or missing seam is documented;
- temporary debug instrumentation is removed;
- throwaway harnesses are deleted or clearly marked;
- the actual cause is stated plainly.

If the bug exposed architectural friction, suggest an architecture review after the fix.

## User arguments

$ARGUMENTS
