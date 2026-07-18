# Provenance

## Where this came from

I built this public Crab package from my private `PICRABSETUP` repository.

| Field | Value |
|---|---|
| Public source label | `PICRABSETUP` |
| Git branch | `main` |
| Source commit | `b1aa616c52d848feee02d8db0ace2c2e91aa56d2` |
| Local path | Redacted |
| Working tree | Not clean; excluded changes were not copied or reset |

The current safe package manifest was read later to identify upstream repositories and current dependency names. Private settings, auth, sessions, MCP endpoints, and excluded diffs were not used.

## What I carried over

I included the parts I wrote or configured that are needed to run Crab:

- the launcher behavior and isolated-state design;
- the operating profile;
- selected prompt templates;
- exact-match integration patches;
- Windows prompt/subagent spawn tests;
- public extension defaults and permission policy;
- verification scripts and documentation.

I rewrote hard-coded paths and removed credential migration. The public launcher uses the current Node executable and a per-user state directory.

## What I left out

- `.env` files, keys, tokens, OAuth files, and API credentials;
- private Pi/Codex settings and MCP configuration;
- sessions, transcripts, subagent artifacts, usage history, and browser state;
- caches, logs, installed dependencies, and package-lock data from the private source;
- private model identifiers;
- any excluded working-tree diff.

## Authorship boundary

My work is the Crab layer: routing rules, delegation policy, prompts, launcher, isolation, patches, permission defaults, and verification.

Pi, Codex, the Pi extensions, MCP, Context7, Playwright, Ponytail, Kroki, and remote-pi are upstream work. I use and integrate them; I do not claim to have created them.

See:

- [Attribution matrix](docs/attribution.md)
- [Upstream repositories and creator credits](docs/upstream-projects.md)

## AI assistance

I used coding agents to help inspect, rewrite, test, and document this release. I kept the final decisions, scope, claims, and publication responsibility.

## Assets and generated files

- `npm-shrinkwrap.json` was generated fresh from the public pinned manifest; the private lockfile was not copied.
- The explorer PNG was generated from the local static explorer.
- The six SVG diagrams were rendered from my Mermaid sources through Kroki and checked for scripts, event handlers, external references, and accessibility metadata.
- No third-party visual design or dependency source was copied into the package.

## License and release

My original work here is licensed under Apache-2.0. Upstream projects keep their own licenses and rights; dependency code is installed from its original packages rather than copied into this repository.

I approved publication at [PPDEGRET/crab-pi](https://github.com/PPDEGRET/crab-pi). The dirty private source remains a separate maintenance concern and must not be reset automatically.
