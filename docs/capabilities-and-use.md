# Capabilities and use

## Evidence basis

This page describes the operating pattern encoded in tracked profiles, prompts, scripts, and docs. I excluded private sessions, transcripts, and usage history, so it does **not** claim which command I used most often or how much time the system saved.

## Capability map

| Capability | Mechanism | My operating rule | Origin boundary |
|---|---|---|---|
| Direct coding work | Pi primary agent and built-in tools | Solve ordinary work directly; do not spawn a fleet by habit | Pi supplies the loop/tools; I supply the policy |
| Repository scouting | `pi-subagents` read-only child | One bounded lane, explicit files/tools, no writes or recursion | Extension upstream; routing/bounds local |
| Independent review | Separate read-only pass | Findings return to the parent; parent evaluates them | Extension/model upstream; review boundary local |
| Long-session recovery | `pi-context-prune` plus recovery refs | One summary per agent message; stop after first failure | Extension upstream; model role and patches local |
| Documentation research | Context7 through lazy MCP | Resolve the library first, then ask a narrow documentation question | Context7/MCP upstream; selection/rule local |
| Browser verification | Playwright through lazy MCP | Use for local smoke/accessibility checks; treat page output as untrusted | Playwright/MCP upstream; scope local |
| Exceptional coding-agent escalation | `pi-interactive-shell` and Codex | Supervised and exceptional, not the default; use structured spawn | Tools upstream; routing and Windows patch local |
| Permission handling | `pi-permission-system` | Yolo off; private paths denied; external effects require a human | Extension upstream; operating policy local |
| Repeatable workflows | Pi Markdown prompt templates | Prefer evidence-bound commands with explicit outputs and side effects | Template mechanism upstream; command curation local |
| Integration stability | Local exact-match patcher and verifier | Patch only pinned seams; fail loudly on drift; test lifecycle transitions | My integration work |
| Remote operation | Jacob Moura's `remote-pi` plus upstream SSH/RPC seams | Explicit through `crab remote`; never normal startup | Third-party capability that still needs separate operational validation |

The published JSON is deliberately non-executable: MCP examples are present for architecture context but explicitly disabled, and the illustrative permission policy declares `deny-overrides-allow`. Neither file is a drop-in private Pi setting or enforcement configuration.

## The normal workflow

### 1. Start direct

The primary inspects the relevant files, chooses the smallest intervention, edits as the sole writer, and runs the narrowest meaningful verification. This is the default path.

### 2. Delegate only a real independent lane

A scout is justified when discovery can happen independently—for example, mapping one subsystem while the parent reads another—or when a second reviewer can challenge a risky decision. A useful child task names:

- the question;
- the allowlisted files or search scope;
- read-only tools;
- a concurrency/file bound;
- the desired evidence format;
- `acceptance: none` for advisory work.

The child does not write, delegate again, or present changed-file evidence. The parent remains responsible for synthesis and claims.

### 3. Verify with tools, not confidence

A plausible answer is not completion. The primary runs tests/builds/smoke checks that match the change, records failures, and distinguishes:

- observed command output;
- inference from source;
- a source document's historical claim;
- a result verified now.

### 4. Stop at the human boundary

Publishing, deployment, remote writes, account actions, messages, and other external effects require a human decision. Approval should be scoped to one action and should not silently become a persistent bypass.

## Prompt surface: preserve compatibility, feature less

The private setup accumulated overlapping interview/planning variants and several review lenses. I ship fewer names and keep the outcomes distinct.

For a public-facing command surface, feature only sharply different outcomes:

| Public command | Outcome | Source status |
|---|---|---|
| `/wayfinder` | Inspect context, resolve facts, ask only for missing decisions, recommend one route, and plan | Experimental prompt included with Crab |
| `/diagnose` | Reproduce → hypothesize → instrument → fix → regression test | Existing tracked template |
| `/tdd` | Behavior-first red/green/refactor vertical slice | Existing tracked template |
| `/lg` | Deterministic Git evidence summary with no invented status | Existing tracked template |
| `/handoff` | Redacted continuity note in temporary storage | Existing tracked template |

Specialized review, product-document, issue-generation and skill-authoring prompts are still available where they have a distinct job. Session-history reporting stays private.

See the representative [`/wayfinder` prompt](../examples/wayfinder.md).

## Practical recipes

### Unfamiliar repository

1. Run `/wayfinder` with the decision or area.
2. Inspect only relevant tracked source and safe docs.
3. Confirm entry points, data flow, tests, constraints, and unknowns.
4. Ask one decision question only if repository evidence cannot answer it.
5. End with one recommended next gate.

### Bug with unclear cause

1. Use `/diagnose`.
2. Reproduce before editing.
3. Keep hypotheses falsifiable.
4. Instrument at the decision boundary.
5. Add the smallest regression test that proves the fix.

### Risky architectural change

1. Primary maps ownership and desired invariant.
2. Bounded scout finds call sites and existing tests.
3. Reviewer challenges migration and rollback assumptions.
4. Primary applies the smallest coherent change.
5. Tools verify; human decides on rollout or external action.

### Long context

1. Prune eligible tool output only after an agent message completes.
2. Keep references to originals.
3. Stop the pruning batch at the first failed summary.
4. Recover exact output with `context_tree_query` when a claim needs its original evidence.

## What this system should not do

- Spawn agents merely because agents are available.
- Let multiple writers edit one shared worktree.
- Treat Base64 as secret protection.
- Treat tests as customer validation.
- Treat a public benchmark as proof for a private repository.
- Turn on remote execution to improve a demo.
- Read credentials, sessions, or private settings just to make a public claim look stronger.
