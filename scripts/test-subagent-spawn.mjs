import { spawnSync } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { createJiti } from "jiti";

import { buildEnvironment, getStatePaths, piCli } from "../runtime/launcher.mjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const jiti = createJiti(import.meta.url);
const { getPiSpawnCommand } = await jiti.import(
  join(root, "node_modules", "pi-subagents", "src", "runs", "shared", "pi-spawn.ts"),
);
const spec = getPiSpawnCommand(["--version"], {
  platform: "win32",
  env: buildEnvironment(getStatePaths({ CRAB_STATE_DIR: join(root, ".spawn-test-state") }, "win32"), {}),
  execPath: process.execPath,
  argv1: piCli,
});
if (spec.command !== process.execPath || spec.args[0] !== piCli) {
  throw new Error(`Unsafe Windows subagent spawn: ${JSON.stringify(spec)}`);
}
const result = spawnSync(spec.command, spec.args, { encoding: "utf8" });
if (result.status !== 0 || result.stdout.trim() !== "0.80.6") {
  throw new Error(`Local child Pi failed: ${result.stderr || result.stdout}`);
}
console.log("Windows subagent Node-entrypoint spawn passed.");
