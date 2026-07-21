import assert from "node:assert/strict";
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";

import {
  buildEnvironment,
  buildLaunchSpec,
  ensureState,
  getPackageManifest,
  getStatePaths,
  hasProviderCredentials,
  packageRoot,
  piCli
} from "../runtime/launcher.mjs";

function withTempState(run) {
  const root = mkdtempSync(join(tmpdir(), "crab-launcher-test-"));
  try {
    return run(getStatePaths({ CRAB_STATE_DIR: root }, process.platform));
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
}

test("Crab creates isolated state without creating or copying auth", () => {
  withTempState((paths) => {
    const state = ensureState(paths);
    assert.equal(state.authFilePresent, false);
    assert.equal(existsSync(paths.authPath), false);
    assert.equal(existsSync(paths.settingsPath), true);
    const permissionPath = join(paths.agentDir, "pi-permissions.jsonc");
    assert.equal(existsSync(permissionPath), true);
    assert.match(readFileSync(permissionPath, "utf8"), /"load_tools": "allow"/);

    const settings = JSON.parse(readFileSync(paths.settingsPath, "utf8"));
    assert.ok(settings.packages.includes(packageRoot));
    assert.equal(settings.enableInstallTelemetry, false);
  });
});

test("Crab preserves user settings and removes obsolete Crab package paths", () => {
  withTempState((paths) => {
    ensureState(paths);
    const oldCrabRoot = join(paths.root, "old-prefix", "node_modules", "crab-pi");
    const sourceCrabRoot = join(paths.root, "source", "crab-pi");
    const unrelatedPackage = join(paths.root, "packages", "other-pi-package");
    writeFileSync(
      paths.settingsPath,
      JSON.stringify({
        defaultProvider: "example",
        defaultModel: "example-model",
        packages: [oldCrabRoot, sourceCrabRoot, unrelatedPackage]
      }),
      { encoding: "utf8", flag: "w" }
    );
    ensureState(paths);
    const settings = JSON.parse(readFileSync(paths.settingsPath, "utf8"));
    assert.equal(settings.defaultProvider, "example");
    assert.equal(settings.defaultModel, "example-model");
    assert.ok(settings.packages.includes(packageRoot));
    assert.ok(settings.packages.includes(unrelatedPackage));
    assert.ok(!settings.packages.includes(oldCrabRoot));
    assert.ok(!settings.packages.includes(sourceCrabRoot));
  });
});

test("Crab does not overwrite a user's permission policy", () => {
  withTempState((paths) => {
    ensureState(paths);
    const policyPath = join(paths.agentDir, "pi-permissions.jsonc");
    const customPolicy = "{\n  \"tools\": { \"*\": \"deny\" }\n}\n";
    writeFileSync(policyPath, customPolicy, "utf8");
    ensureState(paths);
    assert.equal(readFileSync(policyPath, "utf8"), customPolicy);
  });
});

test("the default crab launch targets Pi", () => {
  withTempState((paths) => {
    ensureState(paths);
    const spec = buildLaunchSpec({ userArgs: ["--version"], paths });
    assert.equal(spec.command, process.execPath);
    assert.equal(spec.args[0], piCli);
    assert.ok(spec.args.includes("--append-system-prompt"));
    assert.ok(spec.args.includes("--session-dir"));
    assert.equal(spec.args.at(-1), "--version");
    assert.equal(spec.env.PI_CODING_AGENT_DIR, paths.agentDir);
    assert.equal(spec.env.CODEX_HOME, paths.codexHome);
  });
});

test("remote-pi is opt-in", () => {
  withTempState((paths) => {
    ensureState(paths);
    const normal = buildLaunchSpec({ paths });
    const remote = buildLaunchSpec({ paths, includeRemote: true });
    assert.equal(normal.args.includes("--extension"), false);
    assert.equal(remote.args.includes("--extension"), true);
    assert.ok(remote.args.some((value) => value.includes("remote-pi")));
  });
});

test("Crab respects existing API-key environments without reading values", () => {
  assert.equal(hasProviderCredentials({}), false);
  assert.equal(hasProviderCredentials({ ANTHROPIC_API_KEY: "present" }), true);
  assert.equal(hasProviderCredentials({ ANTHROPIC_OAUTH_TOKEN: "present" }), true);
  assert.equal(hasProviderCredentials({ AWS_PROFILE: "local-profile" }), true);
});

test("package metadata exposes a real crab bin and Pi resources", () => {
  const manifest = getPackageManifest();
  assert.equal(manifest.version, "0.3.1");
  assert.equal(manifest.bin.crab, "./bin/crab.mjs");
  assert.equal(manifest.bin.crabtest, "./bin/crabtest.mjs");
  assert.notEqual(manifest.private, true);
  assert.equal(manifest.engines.node, ">=22.19.0");
  assert.ok(manifest.pi.extensions.length >= 9);
  assert.ok(manifest.pi.skills.length >= 4);
  assert.ok(manifest.pi.prompts.includes("./prompts"));
});

test("the launcher environment keeps caller variables and adds isolated paths", () => {
  withTempState((paths) => {
    const env = buildEnvironment(paths, { PATH: "example-path", CUSTOM_VALUE: "kept" });
    assert.equal(env.CUSTOM_VALUE, "kept");
    assert.equal(env.PI_CODING_AGENT_DIR, paths.agentDir);
    assert.ok(env.PATH.endsWith("example-path"));
  });
});
