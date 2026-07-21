#!/usr/bin/env node

import { existsSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const manifest = JSON.parse(readFileSync(join(ROOT, "package.json"), "utf8"));
const shrinkwrap = JSON.parse(readFileSync(join(ROOT, "npm-shrinkwrap.json"), "utf8"));
const failures = [];

function pass(message) {
  console.log(`✓ ${message}`);
}
function fail(message) {
  failures.push(message);
  console.error(`✗ ${message}`);
}
function run(command, args, options = {}) {
  return spawnSync(command, args, {
    cwd: ROOT,
    encoding: "utf8",
    shell: false,
    ...options
  });
}

if (
  manifest.version === "0.3.1" &&
  shrinkwrap.version === manifest.version &&
  shrinkwrap.packages?.[""]?.version === manifest.version &&
  manifest.bin?.crab === "./bin/crab.mjs" &&
  manifest.bin?.crabtest === "./bin/crabtest.mjs" &&
  manifest.private !== true &&
  manifest.engines?.node === ">=22.19.0"
) {
  pass("package exposes the synchronized 0.3.1 commands with the tested Node floor");
} else {
  fail("package metadata is not synchronized for the 0.3.1 commands and Node 22.19 floor");
}

const expectedDependencies = {
  "@earendil-works/pi-ai": "0.80.6",
  "@earendil-works/pi-coding-agent": "0.80.6",
  "@narumitw/pi-codex-usage": "0.13.1",
  "@openai/codex": "0.144.1",
  jiti: "2.6.1",
  "pi-context-prune": "1.2.0",
  "pi-context-usage": "1.0.2",
  "pi-interactive-shell": "0.13.0",
  "pi-mcp-adapter": "2.11.0",
  "pi-permission-system": "0.8.0",
  "pi-prompt-template-model": "0.10.0",
  "pi-subagents": "0.34.0",
  "pi-web-access": "0.13.0",
  ponytail: "https://codeload.github.com/DietrichGebert/ponytail/tar.gz/dedc97ca7c8a1e7463ac5b36f7fe4b28c3c435a2",
  "remote-pi": "0.5.4",
  typebox: "1.1.38"
};
const dependencyDrift = Object.entries(expectedDependencies).filter(
  ([name, version]) => manifest.dependencies?.[name] !== version
);
if (dependencyDrift.length === 0) pass("all direct runtime dependencies match the pinned release set");
else fail(`runtime dependency drift: ${dependencyDrift.map(([name]) => name).join(", ")}`);

const requiredFiles = [
  "bin/crab.mjs",
  "bin/crabtest.mjs",
  "npm-shrinkwrap.json",
  "profiles/crab.md",
  "runtime/launcher.mjs",
  "runtime/lean-tools.mjs",
  "runtime/default-permissions.jsonc",
  "scripts/apply-local-patches.mjs",
  "scripts/test-subagent-spawn.mjs",
  "scripts/test-windows-spawn.mjs",
  "prompts/lg.md",
  "prompts/wayfinder.md"
];
const missingFiles = requiredFiles.filter((file) => !existsSync(join(ROOT, file)));
if (missingFiles.length === 0) pass("launcher, profile, policy, prompts, patches and tests are present");
else fail(`missing runtime files: ${missingFiles.join(", ")}`);

const patchResult = run(process.execPath, ["scripts/apply-local-patches.mjs"], {
  env: { ...process.env, CRAB_PATCH_QUIET: "1" }
});
if (patchResult.status === 0) pass("pinned integration patches are valid and idempotent");
else fail(`patch validation failed: ${(patchResult.stderr || patchResult.stdout).trim()}`);

const stateRoot = mkdtempSync(join(tmpdir(), "crab-runtime-verify-"));
try {
  const versionResult = run(process.execPath, ["bin/crab.mjs", "--version"], {
    env: {
      ...process.env,
      CRAB_STATE_DIR: stateRoot
    }
  });
  if (versionResult.status === 0 && versionResult.stdout.trim() === "0.80.6") {
    pass("the crab command launches the pinned Pi CLI");
  } else {
    fail(`crab --version failed: ${(versionResult.stderr || versionResult.stdout).trim()}`);
  }

  const authPath = join(stateRoot, "pi", "auth.json");
  if (!existsSync(authPath)) pass("clean startup does not create or copy authentication state");
  else fail("clean startup unexpectedly created authentication state");

  const settingsPath = join(stateRoot, "pi", "settings.json");
  const settings = existsSync(settingsPath)
    ? JSON.parse(readFileSync(settingsPath, "utf8"))
    : null;
  if (settings?.packages?.includes(ROOT)) pass("isolated Pi settings load the installed Crab package");
  else fail("isolated Pi settings do not reference the installed Crab package");
} finally {
  rmSync(stateRoot, { recursive: true, force: true });
}

const unitResult = run(process.execPath, [
  "--test",
  "tests/launcher.test.mjs",
  "tests/lean-tools.test.mjs"
]);
if (unitResult.status === 0) pass("launcher and lean-tool unit tests pass");
else fail(`launcher tests failed: ${(unitResult.stderr || unitResult.stdout).trim()}`);

for (const args of [[], ["--lean"]]) {
  const inspectResult = run(process.execPath, ["scripts/inspect-runtime.mjs", ...args]);
  if (inspectResult.status === 0) pass(inspectResult.stdout.trim());
  else fail(`runtime resource discovery failed: ${(inspectResult.stderr || inspectResult.stdout).trim()}`);
}

if (process.platform === "win32") {
  for (const script of ["scripts/test-windows-spawn.mjs", "scripts/test-subagent-spawn.mjs"]) {
    const result = run(process.execPath, [script]);
    if (result.status === 0) pass(`${script} passes`);
    else fail(`${script} failed: ${(result.stderr || result.stdout).trim()}`);
  }
}

const packResult = process.platform === "win32"
  ? run(process.env.ComSpec || "cmd.exe", ["/d", "/s", "/c", "npm", "pack", "--dry-run", "--json"])
  : run("npm", ["pack", "--dry-run", "--json"]);
if (packResult.status === 0) {
  try {
    const report = JSON.parse(packResult.stdout)[0];
    const names = report.files.map((entry) => entry.path.replaceAll("\\", "/"));
    const forbidden = names.filter((name) =>
      /(^|\/)(?:node_modules|\.pi|\.pi-agent|\.pi-subagents|\.codex|sessions?|auth\.json)(?:\/|$)/i.test(name)
    );
    const packedEssentials = [
      "package.json",
      "npm-shrinkwrap.json",
      "bin/crab.mjs",
      "bin/crabtest.mjs",
      "profiles/crab.md",
      "prompts/diagnose.md",
      "prompts/lg.md",
      "prompts/tdd.md",
      "prompts/wayfinder.md",
      "runtime/launcher.mjs",
      "runtime/lean-tools.mjs",
      "runtime/default-permissions.jsonc",
      "runtime/extension-configs/pi-permission-system.json",
      "runtime/extension-configs/subagent.json",
      "scripts/apply-local-patches.mjs",
      "scripts/inspect-runtime.mjs",
      "scripts/test-subagent-spawn.mjs",
      "scripts/test-windows-spawn.mjs"
    ];
    if (forbidden.length === 0 && packedEssentials.every((name) => names.includes(name))) {
      pass(`npm package contains ${names.length} allowlisted files and no private runtime state`);
    } else {
      fail(`npm package contents are unsafe or incomplete: ${forbidden.join(", ")}`);
    }
  } catch (error) {
    fail(`could not parse npm pack report: ${error.message}`);
  }
} else {
  fail(`npm pack dry run failed: ${(packResult.stderr || packResult.stdout).trim()}`);
}

if (failures.length) {
  console.error(`\nCrab runtime verification failed with ${failures.length} issue(s).`);
  process.exitCode = 1;
} else {
  console.log("\nCrab runtime verification passed.");
}
