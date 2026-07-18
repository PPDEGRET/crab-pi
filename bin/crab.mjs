#!/usr/bin/env node

import { existsSync } from "node:fs";
import { spawn, spawnSync } from "node:child_process";
import { join } from "node:path";

import {
  buildLaunchSpec,
  ensureState,
  getPackageManifest,
  getStatePaths,
  hasProviderCredentials,
  packageRoot,
  piCli
} from "../runtime/launcher.mjs";

function runNodeScript(relativePath, args = []) {
  const result = spawnSync(process.execPath, [join(packageRoot, relativePath), ...args], {
    cwd: process.cwd(),
    env: process.env,
    stdio: "inherit",
    shell: false
  });
  if (result.error) throw result.error;
  return result.status ?? 1;
}

function applyPatches() {
  const result = spawnSync(process.execPath, [join(packageRoot, "scripts", "apply-local-patches.mjs")], {
    cwd: packageRoot,
    env: { ...process.env, CRAB_PATCH_QUIET: "1" },
    encoding: "utf8",
    shell: false
  });
  if (result.status === 0) return;
  const output = `${result.stdout || ""}${result.stderr || ""}`.trim();
  throw new Error(
    `Crab could not validate its pinned integration patches.${output ? `\n${output}` : ""}\nReinstall with scripts enabled: npm install -g https://codeload.github.com/PPDEGRET/crab-pi/tar.gz/main`
  );
}

function printHelp() {
  console.log(`Crab runs a pinned, isolated Pi setup.

Usage:
  crab                 Start Pi in the current directory
  crab <pi args>       Pass arguments straight to Pi
  crab setup           Start Pi and show first-run login guidance
  crab doctor          Check the installation and isolated state
  crab state           Print the isolated state directory
  crab remote [args]   Start Pi with the optional remote-pi extension
  crab demo            Run the synthetic architecture demo
  crab help            Show this help

First run:
  1. Run: crab
  2. Inside Pi, run: /login
  3. Choose your provider, then use /model if you want a different model

Pi arguments such as --version, --model, --provider, -p and --help are forwarded unchanged.`);
}

function hasSupportedNodeVersion() {
  const [major, minor] = process.versions.node.split(".").map(Number);
  return major > 22 || (major === 22 && minor >= 19);
}

function doctor(state) {
  const manifest = getPackageManifest();
  const checks = [
    ["Node 22.19 or newer", hasSupportedNodeVersion()],
    ["Pi CLI installed", existsSync(piCli)],
    ["Crab profile installed", existsSync(join(packageRoot, "profiles", "crab.md"))],
    ["Isolated settings ready", existsSync(state.paths.settingsPath)],
    ["Permission policy ready", existsSync(join(state.paths.agentDir, "pi-permissions.jsonc"))],
    ["Package exposes crab bin", manifest.bin?.crab === "./bin/crab.mjs"]
  ];

  for (const [label, passed] of checks) console.log(`${passed ? "✓" : "✗"} ${label}`);
  console.log(`\nState: ${state.paths.root}`);
  console.log(`Auth: ${state.authFilePresent ? "file present — Pi validates provider credentials" : "not configured — start Crab and run /login"}`);
  if (checks.some(([, passed]) => !passed)) process.exitCode = 1;
}

function startPi(userArgs, { includeRemote = false, forceSetupMessage = false } = {}) {
  if (!hasSupportedNodeVersion()) {
    throw new Error(`Crab requires Node.js 22.19 or newer; found ${process.versions.node}.`);
  }
  applyPatches();
  const state = ensureState();
  const informational = userArgs.some((arg) => ["--version", "-v", "--help", "-h"].includes(arg));

  if (forceSetupMessage || (!informational && !state.authFilePresent && !hasProviderCredentials())) {
    console.error(`
Crab is installed. Pi still needs a model provider.
When Pi opens, run /login and choose a provider for OAuth.
If you prefer API keys, set the provider's environment variable before starting Crab.
Your Crab state lives at: ${state.paths.root}
`);
  }
  if (includeRemote) {
    console.log("Starting the optional remote-pi extension. Review its pairing and relay prompts before approving anything.\n");
  }

  const spec = buildLaunchSpec({ userArgs, paths: state.paths, includeRemote });
  const child = spawn(spec.command, spec.args, {
    cwd: spec.cwd,
    env: spec.env,
    stdio: "inherit",
    shell: spec.shell,
    windowsHide: false
  });
  child.on("error", (error) => {
    console.error(`Crab could not start Pi: ${error.message}`);
    process.exitCode = 1;
  });
  child.on("exit", (code, signal) => {
    process.exitCode = code ?? (signal ? 1 : 0);
  });
}

try {
  const [command, ...rest] = process.argv.slice(2);
  if (command === "help") {
    printHelp();
  } else if (command === "demo") {
    process.exitCode = runNodeScript("scripts/run-demo.mjs", rest);
  } else if (command === "doctor") {
    applyPatches();
    doctor(ensureState());
  } else if (command === "state") {
    console.log(getStatePaths().root);
  } else if (command === "setup") {
    startPi(rest, { forceSetupMessage: true });
  } else if (command === "remote") {
    startPi(rest, { includeRemote: true });
  } else {
    startPi(process.argv.slice(2));
  }
} catch (error) {
  console.error(`Crab failed: ${error instanceof Error ? error.message : String(error)}`);
  process.exitCode = 1;
}
