#!/usr/bin/env node

import { spawn } from "node:child_process";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const packageRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const userArgs = process.argv.slice(2);
const explicitToolSelection = userArgs.some((arg) =>
  ["--tools", "-t", "--exclude-tools", "-xt", "--no-builtin-tools", "-nbt", "--no-tools", "-nt"].some(
    (flag) => arg === flag || arg.startsWith(`${flag}=`)
  )
);

const toolMode = process.env.CRAB_TOOL_MODE || (explicitToolSelection ? "manual" : "lean");

const child = spawn(
  process.execPath,
  [
    join(packageRoot, "bin", "crab.mjs"),
    "--extension",
    join(packageRoot, "runtime", "lean-tools.mjs"),
    ...userArgs
  ],
  {
    cwd: process.cwd(),
    env: {
      ...process.env,
      CRAB_TOOL_MODE: toolMode
    },
    stdio: "inherit",
    shell: false,
    windowsHide: false
  }
);

child.on("error", (error) => {
  console.error(`crabtest failed: ${error.message}`);
  process.exitCode = 1;
});
child.on("exit", (code, signal) => {
  process.exitCode = code ?? (signal ? 1 : 0);
});
