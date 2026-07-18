#!/usr/bin/env node

import { mkdtempSync, rmSync } from "node:fs";
import { spawn } from "node:child_process";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { buildLaunchSpec, ensureState, getStatePaths } from "../runtime/launcher.mjs";

const root = mkdtempSync(join(tmpdir(), "crab-runtime-inspect-"));
const paths = getStatePaths({ CRAB_STATE_DIR: root }, process.platform);
ensureState(paths);

const spec = buildLaunchSpec({
  paths,
  userArgs: ["--mode", "rpc", "--no-session"]
});
const child = spawn(spec.command, spec.args, {
  cwd: process.cwd(),
  env: spec.env,
  stdio: ["pipe", "pipe", "pipe"],
  shell: false
});

let stdout = "";
let stderr = "";
let settled = false;
const responses = new Map();

child.stdout.setEncoding("utf8");
child.stderr.setEncoding("utf8");
child.stderr.on("data", (chunk) => {
  stderr += chunk;
});
child.stdout.on("data", (chunk) => {
  stdout += chunk;
  const lines = stdout.split(/\r?\n/);
  stdout = lines.pop() ?? "";
  for (const line of lines) {
    if (!line.trim()) continue;
    try {
      const message = JSON.parse(line);
      if (message.id) responses.set(message.id, message);
    } catch {
      // Pi can print startup text before entering RPC mode; only JSON responses matter here.
    }
  }
});

function send(id, type) {
  child.stdin.write(`${JSON.stringify({ id, type })}\n`);
}

function waitFor(id, timeoutMs = 60000) {
  const started = Date.now();
  return new Promise((resolve, reject) => {
    const timer = setInterval(() => {
      const response = responses.get(id);
      if (response) {
        clearInterval(timer);
        resolve(response);
      } else if (Date.now() - started > timeoutMs) {
        clearInterval(timer);
        reject(new Error(`Timed out waiting for ${id}. ${stderr.trim()}`));
      }
    }, 25);
  });
}

try {
  send("commands", "get_commands");
  const response = await waitFor("commands");
  if (!response.success) throw new Error(JSON.stringify(response.error ?? response));

  const commands = response.data?.commands ?? [];
  const names = new Set(commands.map((command) => command.name));
  const required = [
    "wayfinder",
    "diagnose",
    "tdd",
    "mcp",
    "subagents-doctor",
    "permission-system",
    "context",
    "codex-status",
    "ponytail"
  ];
  const missing = required.filter((name) => !names.has(name));
  if (missing.length) throw new Error(`Missing runtime commands: ${missing.join(", ")}`);

  console.log(`Crab runtime loaded ${commands.length} commands, including ${required.join(", ")}.`);
  settled = true;
} finally {
  child.stdin.end();
  child.kill();
  await new Promise((resolve) => {
    const timer = setTimeout(resolve, 1500);
    child.once("exit", () => {
      clearTimeout(timer);
      resolve();
    });
  });
  rmSync(root, { recursive: true, force: true, maxRetries: 12, retryDelay: 250 });
}

if (!settled) process.exitCode = 1;
