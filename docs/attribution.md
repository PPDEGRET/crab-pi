# Attribution

Crab is my operating layer around Pi. I assembled the runtime, wrote the launcher and policy, patched a few integration seams, and built the verification around it. I did not create Pi or the extensions it loads.

## My work

- the `crab` command and isolated-state bootstrap;
- the operating profile and delegation rules;
- the selected prompt set and `/wayfinder` experiment;
- the default permission policy;
- the Windows structured-prompt and configured-subagent-entrypoint patches;
- the context-pruning isolation and failure-order patches;
- the subagent reasoning-level compatibility patch;
- the exact-match patch lifecycle;
- the runtime, package, and documentation tests;
- the architecture diagrams and written guides.

## Upstream projects

| Project | Public credit | What it provides | What I changed or configured |
|---|---|---|---|
| [Pi](https://github.com/earendil-works/pi) `@earendil-works/pi-coding-agent@0.80.6` and `@earendil-works/pi-ai@0.80.6` | Package metadata credits **Mario Zechner**; current home **Earendil Works** | The agent loop, TUI, tools, auth, sessions, package system, extension APIs, schemas and SDK/RPC surfaces | I pin it, isolate its state, append the Crab profile and load the package resources. |
| [OpenAI Codex CLI](https://github.com/openai/codex) `0.144.1` | **OpenAI** | A separate coding-agent CLI | I make it available for explicit escalation and keep its state under Crab. |
| [pi-subagents](https://github.com/nicobailon/pi-subagents) `0.34.0` | Declared author **Nico Bailon** | Built-in scout, reviewer, researcher, planner, worker and orchestration tools | I set the operating rules and patch compatibility for the pinned reasoning level and Crab's configured Node entrypoint. |
| [pi-context-prune](https://github.com/championswimmer/pi-context-prune) `1.2.0` | Repo/npm handle **championswimmer**; no individual author declared | Recoverable tool-output summarisation | I isolate its settings and make summariser batches stop after the first failure. |
| [pi-context-usage](https://github.com/championswimmer/pi-context-usage) `1.0.2` | Repo/npm handle **championswimmer** | Context visibility | I remove an unrelated package-maintainer release command from the operator surface. |
| [pi-interactive-shell](https://github.com/nicobailon/pi-interactive-shell) `0.13.0` | Declared author **Nico Bailon** | Supervised external-agent processes and terminal UI | I patch Windows prompt transport to preserve structured argv. |
| [pi-mcp-adapter](https://github.com/nicobailon/pi-mcp-adapter) `2.11.0` | Declared author **Nico Bailon** | Lazy MCP discovery and invocation | I load the adapter; `/mcp setup` remains the user's configuration boundary. |
| [Model Context Protocol](https://github.com/modelcontextprotocol/modelcontextprotocol) | Created by **David Soria Parra** and **Justin Spahr-Summers**; now under LF Projects governance | The protocol used by MCP adapters and servers | I use the protocol through upstream tools. |
| [pi-permission-system](https://github.com/MasuRii/pi-permission-system) `0.8.0` | Declared author **MasuRii** | Runtime allow/ask/deny enforcement | I ship a conservative default policy with yolo mode off. |
| [pi-prompt-template-model](https://github.com/nicobailon/pi-prompt-template-model) `0.10.0` | Declared author **Nico Bailon** | Per-prompt model, thinking and skill choices | I load it with the selected Crab prompts. |
| [pi-web-access](https://github.com/nicobailon/pi-web-access) `0.13.0` | Declared author **Nico Bailon** | Web search, fetch and video tools | I load it under the same evidence and permission rules. |
| [pi-codex-usage](https://github.com/narumiruna/pi-extensions/tree/main/extensions/pi-codex-usage) `0.13.1` | Exact license credits public handle **narumiruna**; npm scope `narumitw` | Codex quota/status visibility | I load it for operator visibility. |
| [Ponytail](https://github.com/DietrichGebert/ponytail) | **DietrichGebert** | Optional minimalism mode and skills | I load it but leave it off until explicitly enabled. |
| [remote-pi](https://github.com/jacobaraujo7/remote_pi) `0.5.4` | Declared author **Jacob Moura** | Remote/mobile control and agent-mesh features | I install it but only load it through `crab remote`. |
| [Context7](https://github.com/upstash/context7) | **Upstash** project | Current library documentation through CLI/MCP modes | I do not ship a private endpoint; users can add it through `/mcp setup`. |
| [Playwright](https://github.com/microsoft/playwright) | **Microsoft** project | Browser automation | The exact MCP server is user-configured rather than bundled as private config. |
| [Kroki](https://github.com/yuzutech/kroki) | **Yuzutech** project | Diagram rendering | I used it once to render my Mermaid diagrams to checked SVG fallbacks. |

The detailed repository checkpoints, package-author fields, maintainer-handle caveats and license evidence are in [upstream-projects.md](upstream-projects.md).

## The boundary

I claim the way these pieces are put together: the runner, routing, prompts, patches, permissions and verification. I do not claim authorship of the upstream engines, extensions, protocols or services.

My code is Apache-2.0. Upstream projects keep their own licenses, and this repository installs their packages instead of copying their source.
