# Architecture

These diagrams describe the operating layer, not a new model runtime. Solid paths are normal flow; decision diamonds are gates; all external effects end with a human.

## Rendered fallbacks

All six Mermaid sources rendered successfully on 2026-07-14. The generated SVGs contain accessible titles/descriptions and no scripts, event handlers, iframes, or external resource references. Use these if the publication platform does not render Mermaid natively:

- [Model routing SVG](../assets/diagrams/model-routing.svg)
- [Context pruning SVG](../assets/diagrams/context-pruning.svg)
- [Subagent boundaries SVG](../assets/diagrams/subagent-boundaries.svg)
- [Permissions SVG](../assets/diagrams/permissions.svg)
- [Windows prompt transport SVG](../assets/diagrams/windows-prompt-transport.svg)
- [Verification lifecycle SVG](../assets/diagrams/verification-lifecycle.svg)

The Mermaid blocks below remain the editable source of truth.

## Model routing

```mermaid
flowchart LR
accTitle: Crab model routing
accDescr: A human works through one primary writer, which may consult bounded scouts, reviewers, a pruner, local tools, or a supervised escalation path before returning evidence for a human decision.
    H["Human operator"] --> P["Primary model<br/>single writer and claim owner"]
    P -->|"focused read-only lane"| S["Bounded scout<br/>efficient model"]
    S -->|"evidence, uncertainty"| P
    P -->|"independent challenge"| R["Reviewer<br/>separate read-only pass"]
    R -->|"findings, not edits"| P
    P -->|"tool output grows"| T["Dedicated pruner<br/>summary role"]
    T -->|"summary + recovery ref"| P
    P -->|"exceptionally hard task"| C["Supervised Codex path<br/>explicit escalation"]
    C -->|"result for parent review"| P
    P <--> V["Local tools and verifier"]
    P -->|"evidence + recommendation"| H
```

The shipped profile separates the primary from advisory subagents and the supervised exceptional-task path. Crab does not hard-code a provider or model; Pi keeps that choice in the user's authenticated state and `/model` selection.

**Routing rule:** ordinary work stays on the primary. Delegation must buy an independent lane, parallel discovery, or a second opinion—not ceremony.

## Context pruning

```mermaid
flowchart TD
accTitle: Recoverable context-pruning flow
accDescr: Eligible outputs from one completed agent message are summarized by a dedicated pruner; valid summaries retain recovery references, while the first failure stops pruning and preserves originals.
    A["Completed agent message<br/>with tool outputs"] --> E{"Output eligible<br/>for pruning?"}
    E -->|"no"| K["Keep original output"]
    E -->|"yes"| B["Batch only inside<br/>this agent message"]
    B --> D["Direct-stream request<br/>to dedicated pruner"]
    D --> N{"Valid summary<br/>returned?"}
    N -->|"yes"| S["Store one merged summary<br/>plus recovery references"]
    S --> C["Continue with smaller context"]
    C --> Q["context_tree_query(ref)"]
    Q --> O["Recover exact original<br/>when needed"]
    N -->|"no"| F["Stop after first failure"]
    F --> P["Preserve remaining<br/>unpruned originals"]
```

The design favors recoverability over maximum compression. Isolation keeps pruning traffic from inheriting the active coding session's private auth/provider state; normalization handles response/session differences at the integration seam. The synthetic demo does not call a pruner; it only checks the published policy shape.

## Subagent boundaries

```mermaid
flowchart TB
accTitle: Parent and advisory subagent boundaries
accDescr: The parent owns planning, writes, synthesis, and final claims; scouts and reviewers can only inspect and return evidence and cannot write or delegate.
    U["Task from human"] --> P["Parent / primary<br/>owns plan, writes, synthesis, final claims"]

    subgraph Advisory["Advisory lanes"]
      S["Scout<br/>read / grep / find / ls<br/>bounded files and concurrency"]
      R["Reviewer<br/>read-only independent pass"]
    end

    P -->|"explicit scope + acceptance:none"| S
    P -->|"review question"| R
    S -->|"evidence, no changed-file claim"| P
    R -->|"findings, no edits"| P

    P --> W["Shared worktree writes"]
    S -. "cannot write or delegate" .-> X["Boundary enforced by policy"]
    R -. "cannot write or delegate" .-> X
    P --> H["Human decision"]
```

One shared worktree has one writer. Read-only advisory lanes explicitly use no changed-file acceptance evidence. Ordinary children are not orchestrators; nested delegation requires a concrete, separately bounded design rather than becoming the default.

## Permissions

```mermaid
flowchart TD
accTitle: Permission and human-approval flow
accDescr: Common local tools may proceed, ordinary shell and MCP operations ask, external directories ask, repeated doom loops are denied, and external effects remain human decisions.
    I["Requested tool or action"] --> C{"Classify effect"}
    C -->|"known local file tool"| L["Proceed within workspace"]
    C -->|"git status / diff / log"| L
    C -->|"other shell or MCP call"| Ask["Ask human"]
    C -->|"path outside workspace"| Ask
    C -->|"repeated doom loop"| D["Deny"]
    C -->|"publish, deploy, message,<br/>account or remote write"| H["Human approval gate"]
    H -->|"reject / defer"| D
    H -->|"single-use approval"| G["Execute the bounded action,<br/>then report the result"]
```

The shipped policy lives at [`runtime/default-permissions.jsonc`](../runtime/default-permissions.jsonc). It starts with yolo mode off, allows common local coding tools, asks for unknown shell/MCP work and outside-workspace paths, and denies doom loops. The profile separately tells the agent not to inspect or disclose credentials and requires a human decision for external effects. [`permissions.sample.json`](../config/permissions.sample.json) remains an illustrative stricter design, not the runtime policy.

## Windows prompt transport

```mermaid
flowchart LR
accTitle: Windows structured-prompt transport
accDescr: An executable and argument array are serialized and Base64URL encoded into one token, then decoded and type-checked before an argv-based child spawn and round-trip test.
    S["Structured spawn request<br/>{ executable, args[] }"] --> J["JSON serialize"]
    J --> U["UTF-8 bytes"]
    U --> B["Base64 encode"]
    B --> O["One opaque argv token"]
    O --> R["Node runner"]
    R --> D["Decode + JSON parse"]
    D --> V{"Validate executable<br/>and every argument"}
    V -->|"invalid"| F["Fail closed"]
    V -->|"valid"| X["cross-spawn<br/>(executable, args[])"]
    X --> C["Child CLI receives<br/>one intact prompt argument"]
    C --> T["Round-trip test:<br/>spaces, newlines, single/double quotes"]
```

The workaround avoids constructing a quoted shell command from a multiline prompt. Base64 is transport encoding, **not encryption**. It preserves bytes through Windows argument parsing; permissions and secret handling remain separate concerns.

## Verification lifecycle

```mermaid
flowchart TD
accTitle: Crab verification lifecycle
accDescr: Crab checks pinned patches, launcher tests, isolated startup, command discovery, Windows transport, package contents, documentation, and a clean global installation before release.
    P["Pinned dependency versions"] --> A["Apply exact-match<br/>idempotent patches"]
    A --> M{"Expected upstream<br/>seam still matches?"}
    M -->|"no"| Stop["Stop loudly;<br/>review upstream drift"]
    M -->|"yes / already patched"| U["Launcher and state tests"]
    U --> R["Isolated Pi startup<br/>and command discovery"]
    R --> W["Windows prompt and<br/>subagent spawn tests"]
    W --> K["Safe npm package check"]
    K --> G["Clean-prefix global install"]
    G --> H["Record pass, failure,<br/>and remaining limits"]

    subgraph Explain["Separate explanation checks"]
      D["Deterministic trace"] --> N["Node tests"]
      N --> V["Artifact, link, diagram,<br/>and privacy-pattern verifier"]
    end
```

`npm run verify:release` runs both lanes and installs the packed tarball under a temporary global prefix. Authentication remains a manual Pi flow and is never created by the verifier.

## Trust boundaries

| Boundary | Inside | Outside / gated |
|---|---|---|
| Workspace | Project source, tests, local tools | `.git`, installed dependencies, user state |
| Agent roles | Primary writer; read-only scout/reviewer | Nested or competing writers |
| Context | Summaries plus recoverable refs | Silent deletion after failed pruning |
| Process transport | Structured argv array | Shell-interpolated multiline prompt |
| Network | Disabled in the demo; lazy documentation/browser tools in real use | Remote write, deployment, publishing, account actions |
| Evidence | Commands actually run and files actually inspected | Usage, productivity, adoption, or model-superiority inference |

## Evidence status

| Element | Status |
|---|---|
| Routing and delegation policy | Shipped in `profiles/crab.md` |
| Windows transport and patch lifecycle | Tested against the pinned installed packages |
| Context-pruning commands and patches | Loaded through Pi RPC discovery; patch seams verified |
| Permission defaults | Shipped with yolo mode off; user changes are preserved |
| MCP configuration | Adapter ships; endpoints remain user-configured through `/mcp setup` |
| Package installation | Packed tarball installed under a clean temporary global prefix |
| End-to-end role trace | Deterministic synthetic explanation, not a live agent transcript |
