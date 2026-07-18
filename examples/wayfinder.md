---
description: Orient in the relevant code and choose one safe, evidence-backed route.
argument-hint: "[goal, decision, or area]"
---

# Wayfinder

> **Status:** experimental. It ships with Crab, but I still want more real use before I call it settled.

Orient before changing code.

## Rules

1. Inspect only the relevant tracked source, safe documentation, and tests.
2. Resolve facts from the repository before asking the user.
3. Ask one question at a time only when a genuine product, scope, or trade-off decision is missing.
4. With each question, give a recommendation and explain the trade-off plainly.
5. Separate **observed evidence**, **inference**, and **unknowns**.
6. Do not inspect credentials, private settings, sessions, transcripts, raw history, browser state, installed dependencies, or generated caches.
7. Do not write files, publish, deploy, or call an external account unless the user explicitly asks and the relevant approval gate is satisfied.

## Output

Return:

- **Destination:** the outcome the user is trying to reach.
- **Evidence map:** entry points, key interfaces, data flow, tests, constraints, and relevant risks.
- **Open decision:** only what repository evidence cannot decide.
- **Recommended route:** one preferred option and why.
- **Next gate:** a concise, verifiable plan or the single next action.

Offer a durable plan, glossary update, or decision record only when it would prevent real future ambiguity. Never write those artifacts automatically.

$ARGUMENTS
