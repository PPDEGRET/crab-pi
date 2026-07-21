#!/usr/bin/env node

import { existsSync, mkdirSync, mkdtempSync, readdirSync, rmSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("..", import.meta.url));
const requestedSpec = process.argv[2];
const allowedTarballSpec = /^https:\/\/codeload\.github\.com\/PPDEGRET\/crab-pi\/tar\.gz\/(?:main|[0-9a-f]{7,40})$/i;
if (requestedSpec && !allowedTarballSpec.test(requestedSpec)) {
  throw new Error("Install spec must be the Crab GitHub repository or an exact codeload commit tarball.");
}
const temp = mkdtempSync(join(tmpdir(), "crab-global-install-"));
const packDir = join(temp, "pack");
const prefix = join(temp, "prefix");
const state = join(temp, "state");
const npmMaxBuffer = 64 * 1024 * 1024;
mkdirSync(packDir, { recursive: true });

function npm(args, cwd = root) {
  return process.platform === "win32"
    ? spawnSync(process.env.ComSpec || "cmd.exe", ["/d", "/s", "/c", "npm", ...args], {
        cwd,
        encoding: "utf8",
        maxBuffer: npmMaxBuffer,
        shell: false
      })
    : spawnSync("npm", args, { cwd, encoding: "utf8", maxBuffer: npmMaxBuffer, shell: false });
}

function runCrab(shim, args) {
  const env = {
    ...process.env,
    CRAB_STATE_DIR: state
  };
  if (process.platform === "win32") {
    const quotedArgs = args.map((arg) => `"${arg.replaceAll('"', '""')}"`).join(" ");
    const command = `"${shim}"${quotedArgs ? ` ${quotedArgs}` : ""}`;
    return spawnSync(command, {
      cwd: temp,
      env,
      encoding: "utf8",
      shell: process.env.ComSpec || true
    });
  }
  return spawnSync(shim, args, { cwd: temp, env, encoding: "utf8", shell: false });
}

try {
  let installSource = requestedSpec;
  if (!installSource) {
    const pack = npm(["pack", "--silent", "--pack-destination", packDir]);
    if (pack.status !== 0) throw new Error(`npm pack failed: ${pack.stderr || pack.stdout}`);
    const tarball = readdirSync(packDir).find((name) => name.endsWith(".tgz"));
    if (!tarball) throw new Error("npm pack did not produce a tarball.");
    installSource = join(packDir, tarball);
  }

  const install = npm([
    "install",
    "-g",
    "--prefix",
    prefix,
    "--prefer-offline",
    "--no-audit",
    "--no-fund",
    installSource
  ], temp);
  if (install.status !== 0) throw new Error(`global install failed: ${install.stderr || install.stdout}`);

  const shim = process.platform === "win32" ? join(prefix, "crab.cmd") : join(prefix, "bin", "crab");
  const leanShim = process.platform === "win32" ? join(prefix, "crabtest.cmd") : join(prefix, "bin", "crabtest");
  if (!existsSync(shim)) throw new Error(`npm did not create the crab command at ${shim}`);
  if (!existsSync(leanShim)) throw new Error(`npm did not create the crabtest command at ${leanShim}`);

  const version = runCrab(shim, ["--version"]);
  if (version.status !== 0 || version.stdout.trim() !== "0.80.6") {
    throw new Error(`installed crab --version failed: ${version.stderr || version.stdout}`);
  }
  const help = runCrab(shim, ["help"]);
  if (help.status !== 0 || /crab demo|synthetic architecture/i.test(`${help.stdout}${help.stderr}`)) {
    throw new Error(`installed crab help is invalid: ${help.stderr || help.stdout}`);
  }

  const leanVersion = runCrab(leanShim, ["--version"]);
  if (leanVersion.status !== 0 || leanVersion.stdout.trim() !== "0.80.6") {
    throw new Error(`installed crabtest --version failed: ${leanVersion.stderr || leanVersion.stdout}`);
  }

  const setup = runCrab(shim, ["setup", "--version"]);
  const setupOutput = `${setup.stdout}${setup.stderr}`;
  if (setup.status !== 0 || !setupOutput.includes("run /login") || !setupOutput.includes("0.80.6")) {
    throw new Error(`installed first-run guidance failed: ${setup.stderr || setup.stdout}`);
  }

  const doctor = runCrab(shim, ["doctor"]);
  if (doctor.status !== 0 || !doctor.stdout.includes("Pi CLI installed")) {
    throw new Error(`installed crab doctor failed: ${doctor.stderr || doctor.stdout}`);
  }

  const installedRoot = process.platform === "win32"
    ? join(prefix, "node_modules", "crab-pi")
    : join(prefix, "lib", "node_modules", "crab-pi");
  for (const [args, expected] of [[[], "loaded 67 commands"], [["--lean"], "crab-tools"]]) {
    const inspect = spawnSync(process.execPath, [join(installedRoot, "scripts", "inspect-runtime.mjs"), ...args], {
      cwd: root,
      env: { ...process.env, CRAB_STATE_DIR: state },
      encoding: "utf8",
      shell: false
    });
    if (inspect.status !== 0 || !inspect.stdout.includes(expected)) {
      throw new Error(`installed runtime resource discovery failed: ${inspect.stderr || inspect.stdout}`);
    }
  }

  if (existsSync(join(state, "pi", "auth.json"))) {
    throw new Error("global install test unexpectedly created authentication state.");
  }

  console.log(`Global install created and invoked ${shim} and ${leanShim}`);
  console.log("Installed Crab shows /login guidance, launches Pi, loads normal and lean runtime commands, passes doctor, and creates no auth state.");
} finally {
  try {
    rmSync(temp, { recursive: true, force: true, maxRetries: 12, retryDelay: 250 });
  } catch (error) {
    console.warn(`Could not remove temporary install directory ${temp}: ${error.code || error.message}`);
  }
}
