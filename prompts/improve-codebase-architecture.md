---
description: Find architectural friction and refactoring opportunities.
argument-hint: "[area/goal]"
---
# Improve Codebase Architecture

Find architectural friction and propose deepening opportunities: changes that put more behavior behind simpler, more stable interfaces so the code becomes easier to test, change, and navigate.

Use when the user asks to improve architecture, reduce coupling, find refactoring opportunities, or make a codebase easier for agents to work in.

## Vocabulary

- Module: anything with an interface and implementation.
- Interface: everything a caller must know to use the module.
- Implementation: the code inside.
- Deep module: lots of useful behavior behind a small interface.
- Shallow module: interface nearly as complex as implementation.
- Seam: where behavior can be changed or swapped without editing callers in place.
- Adapter: concrete thing satisfying an interface at a seam.
- Locality: related change/bugs/knowledge concentrated in one place.
- Leverage: what callers get from the module's depth.

## Process

1. Read the repo glossary and relevant ADRs if they exist.
2. Zoom out over the relevant code. Use subagents for large independent areas.
3. Look for friction:
   - understanding one concept requires bouncing through many files;
   - modules are pass-through or shallow;
   - tests exist only by extracting tiny pure functions;
   - real bugs hide in caller interactions;
   - seams are claimed but only one adapter exists;
   - local rules or glossary terms are missing.
4. Apply the deletion test: if deleting the module only moves complexity to callers, it was probably shallow.
5. Present candidates before proposing detailed interfaces.

## Candidate format

```md
## <candidate>

Files/modules:
Problem:
Proposed direction:
Benefits:
Testing impact:
Recommendation strength: Strong / Worth exploring / Speculative
```

If a candidate conflicts with an ADR, say so only when the friction is real enough to revisit the ADR.

After the user picks a candidate, switch to a grilling conversation before design or implementation.

## User arguments

$ARGUMENTS
