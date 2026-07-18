# Verification result

Status: **current `main` passes local, isolated-checkout, and published-tarball verification**

Date: **2026-07-18**

Environment: **Windows x64, Node.js 24.15.0**

## Release command

```powershell
npm ci
npm run verify:release
```

`verify:release` runs the runtime/package lane, the documentation/demo lane, and a clean temporary global installation. I ran both commands from a detached temporary worktree and removed the registered worktree after they passed.

## Runtime and package

The verified runner:

- exposes `bin/crab.mjs` as the npm `crab` command;
- launches Pi `0.80.6` through the current Node executable;
- never routes the default command to the synthetic demo;
- creates isolated settings and policy without creating or copying `auth.json`;
- preserves existing Pi settings while replacing obsolete Crab package roots with the current install;
- applies the pinned integration patches exactly and idempotently;
- loads 67 Pi commands through RPC discovery;
- includes `/wayfinder`, `/diagnose`, `/tdd`, `/mcp`, `/context`, `/subagents-doctor`, `/permission-system`, `/codex-status`, and `/ponytail`;
- passes the Windows multiline-prompt and Node-entrypoint subagent-spawn tests;
- packs 63 allowlisted files with the shrinkwrap and without `node_modules` or user state.

The focused Node suite reports:

```text
tests 13
pass 13
fail 0
```

## Clean global install

The verifier packs the current package, installs that tarball under a new temporary npm prefix, prepends only that prefix for command resolution, and checks the generated shim. I also ran it against the published codeload tarball for `main`; it passed.

Observed result:

```text
Global install created and invoked <temporary-prefix>\crab.cmd
Installed Crab shows /login guidance, launches Pi, loads 67 commands,
passes doctor, and creates no auth state.
```

The codeload URL in the README is deliberate. npm's `github:` dependency path failed in Windows tar extraction during the remote check, while the ordinary GitHub tarball path passed. Temporary state and install prefixes are removed on a best-effort basis; a Windows handle-cleanup warning does not replace the actual install result.

## Documentation and demo

The separate explanatory lane passes:

- 55 required-artifact checks;
- five deterministic demo tests and 13 fixture assertions;
- trace order, actor, human-decision and no-external-effect checks;
- six accessible Mermaid sources and six safe SVG fallbacks;
- Apache-2.0 and upstream-credit checks;
- static explorer accessibility markers;
- private-path, key-shape and generated-state scans;
- local Markdown link resolution.

The demo ends with:

```text
Final: rejected-by-human; external actions executed: false
```

That trace explains the operating route. It is not a live model session and is not used as runtime evidence.

## Browser check

I opened the explorer from a loopback server at 1440 × 1000 and 375 × 812. At the mobile size, the content viewport and scroll width were both 360 px, navigation remained visible, all six route items were present, and no external resources loaded. I regenerated [`assets/architecture-explorer.png`](../assets/architecture-explorer.png) from the current page.

## What this does not verify

- completing every provider's real OAuth flow;
- model quality, productivity gains or cost savings;
- every prompt and extension command under real work;
- a universal security boundary or exhaustive secret detection;
- production-safe `remote-pi` operation;
- compatibility with dependency versions other than the pinned set;
- Node versions older than 22.19; the resolved Undici runtime requires Node 22.19+.

The first public CI run caught that Node 20 was too old, so I raised the package requirement instead of leaving a misleading `>=20` claim. GitHub Actions runs the runtime and documentation gates on Windows and Ubuntu with Node 22 and 24, plus the clean global-install gate on Node 24; the README badge is the source of truth for the published commit. The next external gate is a first install on another clean user account, followed by `/login` and a small real repository task.
