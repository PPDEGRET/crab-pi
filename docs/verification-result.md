# Verification result

Status: **the 0.3.1 docs-adjustment release candidate passes local, isolated-checkout, package, and clean-install verification**

Date: **2026-07-20**

Environment: **Windows x64, Node.js 24.15.0**

## Release command

```powershell
npm ci
npm run verify:release
```

The release gate checks the runtime, documentation, package contents, and a clean temporary global installation.

## Runtime and package

The verified runner:

- exposes `bin/crab.mjs` and `bin/crabtest.mjs` as the npm `crab` and `crabtest` commands;
- launches Pi `0.80.6` through the current Node executable;
- creates isolated settings and policy without creating or copying `auth.json`;
- preserves existing Pi settings while replacing obsolete installed or source-checkout Crab package roots;
- applies the pinned integration patches exactly and idempotently;
- loads 67 normal Pi commands and 68 lean-profile commands through RPC discovery;
- includes lean-profile `/crab-tools`;
- passes the Windows multiline-prompt and configured-subagent-entrypoint tests;
- passes 10 focused Node tests;
- packs 57 allowlisted files without `node_modules` or user state.

## Authenticated end-to-end smoke

A temporary candidate install used the existing local authenticated state without copying credentials. An ephemeral policy allowed only `subagent` and `wait`. The parent launched one fresh async child, waited for completion, and returned `CRAB_E2E_OK`; no `spawn EFTYPE` occurred.

This proves one authenticated Windows parent/child path, not every provider, model, tool, or workload.

## Documentation adjustment

The 0.3.1 adjustment removes the presentation-only command and artifacts, including the explorer page, screenshot, fixtures, trace, and associated tests and docs. The remaining documentation verifier confirms:

- 48 required artifacts are present;
- removed presentation paths remain absent;
- six accessible Mermaid sources and six local SVG fallbacks remain;
- Apache-2.0 and upstream-credit checks pass;
- private-path, key-shape, and generated-state scans pass;
- local Markdown links resolve.

## Clean global install

The verifier packs the candidate, installs it under a temporary npm prefix, and checks both generated shims.

```text
Global install created and invoked <temporary-prefix>\crab.cmd and <temporary-prefix>\crabtest.cmd
Installed Crab shows /login guidance, launches Pi, loads normal and lean runtime commands,
passes doctor, and creates no auth state.
```

## What this does not verify

- every provider's OAuth flow;
- model quality, productivity gains, or cost savings;
- every prompt and extension command under real work;
- a universal security boundary or exhaustive secret detection;
- production-safe `remote-pi` operation;
- compatibility outside the pinned dependency set;
- Node versions older than 22.19.

GitHub Actions runs the runtime and documentation gates on Windows and Ubuntu with Node 22 and 24, plus the clean global-install gate on Node 24. The remaining release gates are CI on the pushed 0.3.1 commit and an exact-commit codeload install.
