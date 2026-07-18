# Patch notes

## Why local patches exist

Crab pins its dependency versions but still encounters integration seams that upstream packages do not cover in this exact combination: isolated state, a new reasoning label, Windows multiline prompts, pruning-session transport, failure ordering, and an unrelated maintainer command.

My patcher does not perform fuzzy search or silently continue. Each replacement has:

1. an exact target file;
2. an exact expected “before” block;
3. an exact “after” block;
4. an already-applied check;
5. a hard failure when neither block matches.

That makes upstream drift visible during install/launch instead of turning it into a latent runtime bug.

## Representative patch: Windows structured prompt transport

### Failure

An external coding agent was launched through a shell command assembled from an executable plus quoted arguments. On Windows, a structured multiline prompt containing spaces and mixed quotes could be reparsed by the shell and arrive as multiple or altered arguments.

### Intervention

The local patch changes only the Windows transport path:

```text
{ executable, args[] }
        │
        ▼
JSON → UTF-8 → Base64URL → one opaque argv token
        │
        ▼
small Node runner → decode → type-check → cross-spawn(executable, args[])
```

Conceptual pseudodiff:

```diff
- build one shell command from executable + individually quoted prompt strings
+ if Windows:
+   encode JSON({ executable, args }) as one Base64URL token
+   invoke a small runner with that token
+   decode and validate executable:string and args:string[]
+   spawn the child with an argv array
+ otherwise keep the upstream path
```

This is transport encoding, not encryption. It prevents shell re-tokenization; it does not make a prompt safe to disclose or grant permission to run it.

### Verification

The shipped Windows test sends one prompt containing:

- spaces;
- a newline;
- double quotes;
- single quotes.

A temporary child process records its received arguments. The test asserts that the prompt survives as one exact argument and that trailing flags remain separate. A second Windows test verifies that Pi subagents use the local Node entrypoint instead of a `.cmd` shim that produced `EINVAL` in the observed environment.

## Patch inventory in this release

| Integration seam | Local change | Failure behavior |
|---|---|---|
| `pi-context-prune` state path | Honor Pi's isolated agent-directory environment instead of a fixed home-directory path | Exact-match install failure |
| `pi-context-prune` request transport | Add a pruning-specific session identifier and normal Pi SSE request path | Verification checks expected markers |
| `pi-context-prune` batch order | Summarize sequentially and fill remaining results with null after the first failure | Stops extra calls; originals remain available |
| `pi-interactive-shell` Windows spawn | Add structured Base64URL argv runner | Round-trip test fails on any argument change |
| `pi-subagents` model metadata | Recognize, map, pass, and label the `max` reasoning level | Static marker and child-spawn checks |
| `pi-context-usage` command registry | Omit the package-maintainer release workflow from the operator runtime | Exact-match install failure |

The patch bundle contains multiple exact replacements across these seams plus the generated Windows runner. I ship the patch instructions, not a copied fork of the upstream dependency source.

## Patch lifecycle

```text
pinned install
   → apply patch
      → already applied? continue
      → exact upstream block found? replace
      → neither? stop and review upstream change
   → run static markers
   → run focused transport/runtime tests
   → only then use the profile
```

`npm install` applies the patch set in `postinstall`. The launcher checks it again before starting Pi, and `npm run verify:runtime` runs the idempotence and Windows transport tests. If an upstream file no longer matches the pinned seam, installation or startup stops with an actionable error.

## Risks and next gate

- Exact blocks are intentionally brittle: every dependency update requires review.
- A local patch can mask an upstream fix if it is retained too long.
- Generated helpers become part of the trusted computing base.
- Marker checks prove presence, not complete semantic correctness.
- Windows behavior must be retested on supported shells and Node versions.

Before changing a dependency version, I need to re-run the clean-prefix global install, runtime discovery, Windows transport and subagent-spawn tests, then remove or upstream any patch that is no longer needed.
