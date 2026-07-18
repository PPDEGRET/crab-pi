# Evidence and limitations

I keep the runtime evidence separate from the explanatory demo.

## Runtime evidence

The real runner currently proves these things:

- `package.json` exposes `bin/crab.mjs` as the `crab` command;
- the launcher calls the pinned Pi CLI through Node and an argv array;
- the default path never calls `scripts/run-demo.mjs`;
- state is isolated per user;
- clean startup creates settings and policy but no auth file;
- existing user settings survive registration of the Crab package;
- Pi loads the profile, prompts, skills and extension commands;
- the exact-match patches apply and remain idempotent;
- Windows multiline prompts survive as one argument;
- subagents spawn through the local Node entrypoint rather than `pi.cmd`;
- `npm pack` contains no auth, sessions, private settings, caches or `node_modules`.

Run it with:

```powershell
npm run verify:runtime
```

## Demo evidence

`crab demo` is a deterministic explanation of the operating route:

```text
primary → scout → reviewer → local checks → parent synthesis → human decision
```

It is useful for checking the published policy shape. It is not a model run and it is not evidence that every live Crab session behaves that way.

```powershell
npm run demo
npm run verify:docs
```

## Evidence ladder

| Evidence | Current status |
|---|---|
| Global command launches real Pi | Verified locally and by package tests |
| Clean isolated state | Verified without credentials |
| Runtime resources load | Verified through Pi RPC command discovery |
| Focused Node tests | Passing |
| Windows transport/subagent spawn | Passing on Windows |
| Packed file allowlist | Passing |
| Synthetic architecture demo | Passing and clearly labelled |
| Clean-prefix global install | Passing locally on Windows |
| Real OAuth completion | Manual user step inside Pi; never automated in tests |
| Repeated real repository use | Ongoing, not measured here |
| Productivity or model superiority | Not claimed |

## Limits

1. Pi owns authentication. Crab can start the correct flow, but it cannot safely automate a provider's OAuth approval.
2. I do not ship private MCP endpoints. `/mcp setup` is the supported configuration path.
3. I do not hard-code a provider or model on a fresh install.
4. The local patches are pinned to exact dependency versions and make upgrades deliberate.
5. The permission policy is a useful default, not a proof against every unsafe command.
6. Context summaries can still omit nuance; recovery references reduce that risk rather than removing it.
7. `remote-pi` is explicit through `crab remote` and has not been validated as part of normal startup.
8. Public package metadata and repository licenses are attribution evidence, not legal advice about every transitive artifact.

## What I will measure next

- first install on a clean Windows account;
- interrupted and completed `/login` flows;
- reinstall and upgrade behavior;
- real tasks across unfamiliar repositories;
- subagent/tool failures, regressions, elapsed time and approval friction;
- whether `/wayfinder` earns its place after repeated use.
