# Release review

Status: **current `main` passes the local, isolated-checkout, and published-tarball gates**

Date: **2026-07-18**

## Contract

```powershell
npm install -g https://codeload.github.com/PPDEGRET/crab-pi/tar.gz/main
crab
```

The first command creates the real runner. The second opens Pi in the caller's current directory. On first use, `/login` starts Pi's normal provider flow.

## Checks

| Check | Result |
|---|---|
| `crab` bin | Starts Pi through `process.execPath` and `dist/cli.js` |
| Default command | Never calls `scripts/run-demo.mjs` |
| First-run state | Settings/policy created; no auth copied or created |
| Pi resources | Profile, prompts, skills and extensions discovered through Pi RPC |
| Patches | Exact-match, idempotent and pinned to dependency versions |
| Windows transport | Multiline prompts remain one argument |
| Subagent spawn | Uses the Node entrypoint instead of a `.cmd` shim |
| Permissions | Yolo off; unknown shell/MCP work and external directories ask |
| Remote control | Not loaded unless I run `crab remote` |
| Package contents | No auth, sessions, private settings, caches or `node_modules` |
| Global install | npm creates a working temporary `crab.cmd` from local and published codeload tarballs |
| Documentation | First-person setup guide and complete upstream credits |

Run the release gate with:

```powershell
npm ci
npm run verify:release
```

## Evidence that stays separate

The synthetic trace explains the route but is not the runner. It executes only through `crab demo`; normal `crab` always launches Pi.

## Known limits

- Node 22.19+ is required by the pinned runtime dependency graph.
- Pi owns provider authentication. I do not automate or copy OAuth credentials.
- The MCP adapter ships without private endpoints; `/mcp setup` is the local configuration boundary.
- A clean install does not hard-code a provider or model.
- `remote-pi` is installed for the explicit `crab remote` command but has not passed a full operational security review here.
- Local patches are tied to exact dependency versions and must be reviewed before an upgrade.
- The permission policy asks at important boundaries but is not a universal sandbox or secret detector.

## Decision

The installable runtime passed `npm ci` and `npm run verify:release` from a detached isolated worktree on Windows. The published `main` tarball also passed the generated-command, `/login` guidance, doctor, runtime-discovery, and no-auth checks. Re-run the remote gate with:

```powershell
node scripts/test-global-install.mjs https://codeload.github.com/PPDEGRET/crab-pi/tar.gz/<commit>
```
