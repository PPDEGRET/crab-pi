# Upstream projects and creator credits

**Public-source review date: 2026-07-14**

This is the human-readable credit roll for Crab's direct agent/extension dependencies and explicitly named ecosystem tools. It separates:

- a package's declared author;
- its npm maintainer/publisher handle;
- its repository owner;
- a historically documented creator;
- my integration work.

Those are not interchangeable. “Repository owned by” does not automatically mean “solely created by,” and an automated npm publisher is not an author.

## Credit summary

- **Mario Zechner** is credited as author in the exact Pi coding-agent package metadata, and the exact Pi repository license carries his 2025 copyright. **Earendil Works** is Pi's current repository home; the project historically lived at `badlogic/pi-mono`.
- **Nico Bailon** is the declared package author for `pi-interactive-shell`, `pi-mcp-adapter`, `pi-prompt-template-model`, `pi-subagents`, and `pi-web-access`. The public repository handle is `nicobailon`; the npm maintainer/publisher handle is `nicopreme`.
- **championswimmer** is the public repository owner and npm maintainer for `pi-context-prune` and `pi-context-usage`. Their exact package records do not declare an individual author, so I do not infer a legal name.
- **MasuRii** is the declared package author and repository owner for `pi-permission-system`.
- **narumiruna** is credited by copyright in the exact `pi-codex-usage` package license; its npm scope/maintainer is `narumitw`. The relationship between those public handles is not inferred beyond the evidence.
- **DietrichGebert** owns the referenced Ponytail repository; its exact checkpoint license credits DietrichGebert and declares MIT.
- **Jacob Moura** is the declared author of `remote-pi`; its repository is under `jacobaraujo7` and npm maintainer handle is `jacobmoura7`.
- **OpenAI**, **Microsoft**, **Upstash**, **Yuzutech**, and the **MCP project under LF Projects governance** are credited at organization/project level where official sources did not name an individual creator.

## Core direct dependencies

| Component | Exact public source | Public credit | License evidence | Role and my boundary |
|---|---|---|---|---|
| **Pi coding-agent harness** `@earendil-works/pi-coding-agent@0.80.6` | [`earendil-works/pi`, `packages/coding-agent`, commit `2b3fda9…`](https://github.com/earendil-works/pi/commit/2b3fda9921b5590f285165287bd442a25817f17b) · [registry](https://registry.npmjs.org/@earendil-works%2Fpi-coding-agent/0.80.6) | Package metadata: **Mario Zechner**; current repository home: **Earendil Works**; npm maintainer handles include `mitsuhiko`, `badlogic`, and `rwachtler` | MIT in registry and exact root [`LICENSE`](https://raw.githubusercontent.com/earendil-works/pi/2b3fda9921b5590f285165287bd442a25817f17b/LICENSE) | Supplies the agent harness. I selected, isolated, configured, locally integration-patched, and verified it; I did not author Pi. |
| **OpenAI Codex CLI** `@openai/codex@0.144.1` | [`openai/codex`](https://github.com/openai/codex) · [registry](https://registry.npmjs.org/@openai%2Fcodex/0.144.1) | **OpenAI** project; no individual creator established by the reviewed official source | Apache-2.0 declared by registry/current repository; exact `0.144.1` Git commit is not exposed in registry metadata | Supplies a separate coding-agent CLI. I designed the supervised escalation and Windows-safe transport policy. |
| **pi-subagents** `0.34.0` | [`nicobailon/pi-subagents`, commit `12a157d…`](https://github.com/nicobailon/pi-subagents/commit/12a157d2a70b2f4cbc004c020c5f9213b6d8eea8) · [registry](https://registry.npmjs.org/pi-subagents/0.34.0) | Declared author **Nico Bailon**; repo `nicobailon`; npm handle `nicopreme` | MIT declared in package metadata; no root LICENSE was found at the exact checkpoint | Supplies child-agent orchestration. I configured bounded advisory lanes and patched the local integration for the reasoning label. |
| **pi-context-prune** `1.2.0` | [`championswimmer/pi-context-prune`, commit `97fd1ed…`](https://github.com/championswimmer/pi-context-prune/commit/97fd1ed6490bfefdc627f250dbae14b5675dccb6) · [registry](https://registry.npmjs.org/pi-context-prune/1.2.0) | Repo owner/npm maintainer **`championswimmer`**; no individual author declared | MIT declared in registry; no root LICENSE was found at the exact checkpoint | Supplies pruning/recovery mechanics. I assigned the role and added isolation, normalization, ordering, and fail-fast integration patches. |
| **pi-context-usage** `1.0.2` | [`championswimmer/pi-context-usage`, commit `aa1a015…`](https://github.com/championswimmer/pi-context-usage/commit/aa1a0150c2d5420f7c64c5e177630baab70e927a) · [registry](https://registry.npmjs.org/pi-context-usage/1.0.2) | Repo owner/npm maintainer **`championswimmer`**; package author field is explicitly empty | ISC declared in registry; no root LICENSE was found at the exact checkpoint | Supplies context visibility. I selected it and removed an unrelated maintainer command from my local operator surface. |
| **pi-interactive-shell** `0.13.0` | [`nicobailon/pi-interactive-shell`, commit `df4771e…`](https://github.com/nicobailon/pi-interactive-shell/commit/df4771e9105d29bde9b8f32858df6139c1c90605) · [registry](https://registry.npmjs.org/pi-interactive-shell/0.13.0) | Declared author **Nico Bailon**; repo `nicobailon`; npm handle `nicopreme` | MIT declared in package metadata; no root LICENSE was found at the exact checkpoint | Supplies supervised external-agent spawning. I added the Windows structured-argv integration patch and escalation policy. |
| **pi-mcp-adapter** `2.11.0` | [`nicobailon/pi-mcp-adapter`, commit `82724dc…`](https://github.com/nicobailon/pi-mcp-adapter/commit/82724dccc13a49310530898f922bafff12b7f3fe) · [registry](https://registry.npmjs.org/pi-mcp-adapter/2.11.0) | Declared author and exact-license copyright: **Nico Bailon** | MIT in package metadata and exact [`LICENSE`](https://raw.githubusercontent.com/nicobailon/pi-mcp-adapter/82724dccc13a49310530898f922bafff12b7f3fe/LICENSE) | Supplies lazy MCP server discovery/invocation. I selected the adapter and bounded its operating role; private commands/endpoints remain excluded. |
| **pi-permission-system** `0.8.0` | [`MasuRii/pi-permission-system`, commit `9affcc9…`](https://github.com/MasuRii/pi-permission-system/commit/9affcc9d1b52cd79b8bb7da2bebb761ac7e5b1d8) · [registry](https://registry.npmjs.org/pi-permission-system/0.8.0) | Declared author/repo owner **MasuRii**; npm handle `masurii` | MIT in registry and exact [`LICENSE`](https://raw.githubusercontent.com/MasuRii/pi-permission-system/9affcc9d1b52cd79b8bb7da2bebb761ac7e5b1d8/LICENSE) | Supplies permission enforcement. I enabled non-yolo operation and defined the public default policy; detailed private rules are excluded. |
| **pi-prompt-template-model** `0.10.0` | [`nicobailon/pi-prompt-template-model`, commit `ab60d66…`](https://github.com/nicobailon/pi-prompt-template-model/commit/ab60d66af05c4a2196111dc7a2c468b1566481e1) · [registry](https://registry.npmjs.org/pi-prompt-template-model/0.10.0) | Declared author and exact-license copyright: **Nico Bailon** | MIT in package metadata and exact [`LICENSE`](https://raw.githubusercontent.com/nicobailon/pi-prompt-template-model/ab60d66af05c4a2196111dc7a2c468b1566481e1/LICENSE) | Supplies per-template model/skill/thinking selection. I curated the prompt workflows and role choices. |
| **pi-web-access** `0.13.0` | [`nicobailon/pi-web-access`, commit `7bdc30a…`](https://github.com/nicobailon/pi-web-access/commit/7bdc30a65cf77273eb9c0034647b373bda4060d7) · [registry](https://registry.npmjs.org/pi-web-access/0.13.0) | Declared author and exact-license copyright: **Nico Bailon** | MIT in registry and exact [`LICENSE`](https://raw.githubusercontent.com/nicobailon/pi-web-access/7bdc30a65cf77273eb9c0034647b373bda4060d7/LICENSE) | Supplies web search/fetch/video tooling. I integrated it under privacy and evidence rules. |

## Dependencies added before the installable release

These entries appeared after the first documentation snapshot and are now part of the installable Crab package. I keep the timing here so the history stays honest.

| Current package entry | Exact public source and credit | License evidence | Current status |
|---|---|---|---|
| **Codex usage display** `@narumitw/pi-codex-usage@0.13.1` | [`narumiruna/pi-extensions`, `extensions/pi-codex-usage`, commit `b76b1d1…`](https://github.com/narumiruna/pi-extensions/commit/b76b1d15fc2948ad2ff73346c6ffa0ea5dca5d00) · [registry](https://registry.npmjs.org/@narumitw%2Fpi-codex-usage/0.13.1). Exact license credits public handle **narumiruna**; npm scope/maintainer is `narumitw`; no legal-name mapping is inferred. | MIT in registry, package README, and exact package [`LICENSE`](https://raw.githubusercontent.com/narumiruna/pi-extensions/b76b1d15fc2948ad2ff73346c6ffa0ea5dca5d00/extensions/pi-codex-usage/LICENSE) | Ships with Crab; `/codex-status` is present in runtime command discovery. |
| **Ponytail** direct checkpoint | [`DietrichGebert/ponytail`, commit `dedc97c…`](https://github.com/DietrichGebert/ponytail/commit/dedc97ca7c8a1e7463ac5b36f7fe4b28c3c435a2). Exact package/license credits **DietrichGebert**. | MIT in exact `package.json` and [`LICENSE`](https://raw.githubusercontent.com/DietrichGebert/ponytail/dedc97ca7c8a1e7463ac5b36f7fe4b28c3c435a2/LICENSE) | The identity is resolved; my contribution is only the default-off activation policy. |
| **remote-pi** `0.5.4` | [`jacobaraujo7/remote_pi`, `pi-extension`, commit `fea91df…`](https://github.com/jacobaraujo7/remote_pi/commit/fea91dfba33ea28387745a43bfa47450afca3760) · [registry](https://registry.npmjs.org/remote-pi/0.5.4). Declared author **Jacob Moura**; repo `jacobaraujo7`; npm handle `jacobmoura7`. | MIT declared in registry/package metadata; no root LICENSE was found at the exact checkpoint | Installed but loaded only by `crab remote`; its operational security is not claimed as verified. |

## Named ecosystem projects that are not direct demonstrated artifacts

| Project | Official source and public credit | License/source boundary | Crab relationship |
|---|---|---|---|
| **Model Context Protocol (MCP)** | [`modelcontextprotocol/modelcontextprotocol`](https://github.com/modelcontextprotocol/modelcontextprotocol). Official sources name **David Soria Parra** and **Justin Spahr-Summers** as creators; current lead maintainers include **David Soria Parra** and **Den Delimarsky** under LF Projects governance. | Repository states MIT; [governance](https://modelcontextprotocol.io/community/governance) separately describes Apache-2.0 for new code/spec contributions and CC BY 4.0 for documentation outside specifications | Crab integrates MCP through an adapter; I did not create the protocol, SDKs, adapter, or servers. |
| **Context7** | [`upstash/context7`](https://github.com/upstash/context7), an **Upstash** project; no individual creator established by reviewed official sources | Repository states MIT. Hosted API/backend components are not all present in the public repository. | Crab's docs describe a Context7 documentation capability. Exact MCP package/version, local vs hosted server, and endpoint are not established because private config is excluded. |
| **Microsoft Playwright** | [`microsoft/playwright`](https://github.com/microsoft/playwright), a **Microsoft** project; no individual creator established here | Apache-2.0 project-level evidence | Supplies browser automation as a project. The distinct [`microsoft/playwright-mcp`](https://github.com/microsoft/playwright-mcp) artifact was not tied to an exact private configuration/version. |
| **Kroki** | [`yuzutech/kroki`](https://github.com/yuzutech/kroki), under the **Yuzutech** repository; no individual creator established here | MIT project-level evidence; the public `kroki.io` service has separately described infrastructure | Used once to render my Mermaid sources to checked SVG fallbacks. No Kroki code is bundled. |

## What I claim

I can claim that I:

- chose and integrated these upstream components;
- designed Crab's routing, delegation, permissions, pruning, human gates, and prompt operating policy;
- authored the repository-local launcher, patch application, Windows transport adaptation, verification orchestration, and public release files, subject to the authorship caveats in `PROVENANCE.md`;
- tested the specific integration seams documented in this release.

I do not claim that I created Pi, Codex, any extension above, MCP, Context7, Playwright, Kroki, Ponytail, or remote-pi.

## Scope and evidence limits

- This inventory covers direct dependencies and explicitly named ecosystem tools—not every transitive npm dependency.
- I used the safe private-source manifest only to establish the dependency inventory. I did not inspect its settings, MCP endpoints, sessions, installed dependencies, or lockfile contents.
- npm `author`, `maintainers`, `_npmUser`, repository ownership, and copyright are reported as distinct facts.
- Registry license declarations are not substitutes for exact artifact legal review. Dependency code is fetched by npm and is not checked into this repository.
