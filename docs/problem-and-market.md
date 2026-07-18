# Why Crab exists

I wanted something between autocomplete and an autonomous software factory.

Pi already gives me a strong agent loop. The missing part was the operating discipline around it: when to delegate, who gets to write, how to keep evidence recoverable, what happens on Windows, and where the human boundary sits.

## The failures I care about

| Failure | Why it matters |
|---|---|
| One unconstrained agent | Tool scope and external effects become implicit. |
| Multi-agent by default | Ordinary work gets slower, noisier and more expensive. |
| Several writers in one worktree | Coordination bugs become code bugs. |
| Model routing by reputation | The harness, task, tool protocol and budget get ignored. |
| Silent monkey-patching | An upstream upgrade changes the seam and the failure appears later. |
| Aggressive summarisation | Context gets smaller by destroying the evidence I still need. |
| Shell-built Windows prompts | Quotes and newlines arrive as the wrong arguments. |
| Demo-first permissions | Safety gets weakened to make the happy path look smoother. |

## My thesis

The useful version is conservative:

1. One capable primary agent handles normal work.
2. Specialists get bounded, independent lanes.
3. One writer owns a shared worktree.
4. The parent owns synthesis and the final claim.
5. Pruned output stays recoverable.
6. Local patches are exact-match and tested.
7. Publishing, deployment, remote control and account actions stop at a human decision.

## What Crab adds

Crab combines:

- an isolated Pi state directory;
- a real global `crab` command;
- a direct-first operating profile;
- built-in scouts, reviewers, workers and researchers;
- selected prompts and skills;
- lazy MCP discovery;
- permission defaults;
- recoverable context pruning;
- Windows-safe prompt transport;
- package, runtime and clean-install verification.

Pi and the extensions supply the mechanisms. I supply the way they are put together and the rules they run under.

## What works now

- `npm install -g https://codeload.github.com/PPDEGRET/crab-pi/tar.gz/main` installs the runner and pinned dependencies.
- `crab` starts the real Pi CLI, not the demo.
- A fresh state creates no auth file and points me to Pi's normal `/login` flow.
- Runtime inspection confirms the profile prompts and extension commands load.
- Windows multiline prompt and subagent-spawn tests pass.
- The npm package check rejects private state and generated dependencies.

## What I am not claiming

I have not measured productivity gains, customer adoption or universal reliability. I have not benchmarked every model under the same harness. Remote control is opt-in and still needs its own operational validation.

The next useful evidence is repeated real work across different repositories, with failures recorded rather than edited out of the story.
