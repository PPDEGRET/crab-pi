# Release review

Status: **the 0.3.1 docs-adjustment release candidate passes the local, isolated-checkout, package, and clean-install gates**

Date: **2026-07-20**

## Contract

```powershell
npm install -g https://codeload.github.com/PPDEGRET/crab-pi/tar.gz/main
crab
```

The first command creates the real runner. The second opens Pi in the caller's current directory. On first use, `/login` starts Pi's normal provider flow.

## Checks

| Check | Result |
|---|---|
| `crab` and `crabtest` bins | Start Pi through `process.execPath` and `dist/cli.js` |
| CLI surface | Presentation-only command and artifacts removed |
| First-run state | Settings/policy created; no auth copied or created |
| Package registration | Obsolete installed and source-checkout Crab roots are removed before the current package is registered |
| Pi resources | Profile, prompts, skills and extensions discovered through Pi RPC |
| Patches | Exact-match, idempotent and pinned to dependency versions |
| Windows transport | Multiline prompts remain one argument |
| Subagent spawn | Crab's configured `.js` entrypoint is passed through Node instead of spawned as a native binary |
| Authenticated smoke | A temporary install completed parent → async child → wait with only `subagent` and `wait` allowed; auth was not copied |
| Lean tool profile | RPC discovery loads `/crab-tools`; unit tests cover progressive disclosure and provider-payload filtering |
| Permissions | Yolo off; unknown shell/MCP work and external directories ask |
| Remote control | Not loaded unless I run `crab remote` |
| Package contents | No auth, sessions, private settings, caches or `node_modules` |
| Global install | npm creates working temporary `crab.cmd` and `crabtest.cmd` commands from the candidate package |
| Documentation | First-person setup guide and complete upstream credits |

Run the release gate with:

```powershell
npm ci
npm run verify:release
```

## Known limits

- Node 22.19+ is required by the pinned runtime dependency graph.
- Pi owns provider authentication. I do not automate or copy OAuth credentials.
- The MCP adapter ships without private endpoints; `/mcp setup` is the local configuration boundary.
- A clean install does not hard-code a provider or model.
- `remote-pi` is installed for the explicit `crab remote` command but has not passed a full operational security review here.
- Local patches are tied to exact dependency versions and must be reviewed before an upgrade.
- The permission policy asks at important boundaries but is not a universal sandbox or secret detector.

## Decision

The installable 0.3.1 docs-adjustment candidate passed `npm ci` and `npm run verify:release` from an isolated temporary copy on Windows. After pushing, run the exact-commit remote gate with:

```powershell
node scripts/test-global-install.mjs https://codeload.github.com/PPDEGRET/crab-pi/tar.gz/<commit>
```
