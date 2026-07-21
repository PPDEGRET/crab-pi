# Design scope

Crab should be useful before it is impressive.

The basic contract is simple:

```text
npm install -g https://codeload.github.com/PPDEGRET/crab-pi/tar.gz/main
crab
```

That should start the real Pi TUI in the current directory, using an isolated Crab state directory. On a fresh machine Pi should have no copied credentials; I run `/login`, choose a provider, and continue with a working setup.

## What ships

- the pinned Pi and extension dependencies;
- a real `crab` npm bin command and experimental `crabtest` lean-tool command;
- an isolated per-user state directory;
- the Crab operating profile;
- the useful prompt templates;
- bounded subagents and permission defaults;
- context-pruning, MCP, shell, web, and prompt extensions;
- the exact local integration patches;
- Windows prompt/subagent spawn tests;
- a doctor command and package-level verifier;
- documentation, architecture, and credits.

## What does not ship

- credentials or copied OAuth state;
- API keys;
- sessions, transcripts, caches, logs, or browser state;
- private MCP endpoints or private settings;
- `node_modules` or generated runtime data;
- an automatic remote relay. `remote-pi` is explicit through `crab remote`.

## Operating rules

1. Start with one primary agent.
2. Use subagents for real independent work, not ceremony.
3. Keep one writer in a shared worktree.
4. Return evidence to the parent for synthesis.
5. Preserve recoverable context.
6. Verify before claiming success.
7. Stop for a human decision before external effects.

## Installation behavior

- Node.js 22.19 or newer is required by the pinned dependency graph.
- npm creates the cross-platform `crab` and `crabtest` commands from their tracked launchers.
- The launchers call Pi through Node and argv arrays. They never shell through `pi.cmd`.
- State defaults to `%LOCALAPPDATA%\Crab` on Windows and `~/.crab` (or `$XDG_STATE_HOME/crab`) elsewhere.
- `PI_CODING_AGENT_DIR`, sessions, and `CODEX_HOME` stay inside that state root.
- The launcher creates only public defaults and registers the installed Crab package in Pi settings.
- Existing settings are preserved, while obsolete installed or source-checkout Crab package roots are removed. Auth files are never created, read, or copied by the installer.
- If no provider is configured, Crab explains that Pi will open and that `/login` starts the normal OAuth flow.

## Commands

| Command | Result |
|---|---|
| `crab` | Start the real Pi TUI |
| `crabtest` | Start Pi with optional tool groups hidden until requested |
| `crab <pi args>` | Pass arguments to Pi |
| `crab setup` | Start Pi with first-run guidance |
| `crab doctor` | Check the install and state |
| `crab state` | Print the state directory |
| `crab remote` | Explicitly load `remote-pi` |

## Definition of done

- `crab --version` and `crabtest --version` return the pinned Pi version.
- A clean state contains settings and public policy, but no auth file.
- Package resources load through Pi's supported package manifest.
- Patches are exact-match, idempotent, and tested.
- The packed npm file list contains no private/runtime state.
- A clean-prefix global install creates working `crab` and `crabtest` commands on Windows.
- The full verifier passes before release.
