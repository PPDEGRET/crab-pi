---
description: Create or improve a small Pi skill or reusable prompt.
argument-hint: "[skill idea]"
---
# Write A Pi Skill Or Prompt

Create a small reusable Pi OS prompt/skill with progressive disclosure.

## Process

1. Gather requirements:
   - What task/domain does it cover?
   - When should an agent use it?
   - Is it a reusable prompt, a Pi skill, or a deterministic script?
   - What reference material is needed?

2. Draft the smallest useful artifact:
   - reusable prompts go in `prompts/`;
   - durable Pi OS principles go in `context/`;
   - reports/evidence go in `reports/`;
   - Pi package skills should follow the package's `SKILL.md` format.

3. Review together:
   - Does this match the real use case?
   - Anything too broad, repeated, or unclear?
   - Should it be shorter?

## Prompt shape

Prefer one screen:

```md
# Name

What to do.

When to use it.

Rules/checklist.
```

## Skill shape

```text
skill-name/
  SKILL.md
  REFERENCE.md      # only if needed
  EXAMPLES.md       # only if needed
  scripts/          # deterministic helpers only
```

Keep `SKILL.md` short. Split files when the main file gets long or rare details would waste context.

## Checklist

- [ ] Clear trigger: when to use it.
- [ ] No broad project history.
- [ ] No raw transcripts/logs/secrets.
- [ ] No needless restatement.
- [ ] Uses Pi OS paths correctly.
- [ ] Includes validation only when useful.

## User arguments

$ARGUMENTS
