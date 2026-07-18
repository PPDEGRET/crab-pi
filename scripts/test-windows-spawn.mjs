import { execFileSync } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { createJiti } from "jiti";

if (process.platform !== "win32") {
  console.log("Windows structured-spawn test skipped on non-Windows host.");
  process.exit(0);
}

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const jiti = createJiti(import.meta.url);
const { resolveSpawn } = await jiti.import(join(root, "node_modules", "pi-interactive-shell", "spawn.ts"));
const prompt = `one two\nthree "four" and 'five'`;
const config = {
  spawn: {
    defaultAgent: "pi",
    shortcut: "alt+shift+p",
    commands: {
      pi: process.execPath,
      codex: "codex",
      claude: "claude",
      cursor: "agent",
    },
    defaultArgs: {
      pi: ["-e", "console.log(JSON.stringify(process.argv.slice(1)))"],
      codex: [],
      claude: [],
      cursor: [],
    },
    worktree: false,
  },
};

const resolved = resolveSpawn(config, root, { agent: "pi", prompt }, () => undefined);
if (!resolved.ok) throw new Error(resolved.error);
if (!resolved.spawn.command.includes("windows-spawn-runner.mjs")) throw new Error("Structured spawn did not use the encoded argv runner.");

const output = execFileSync(process.env.COMSPEC || "cmd.exe", ["/c", resolved.spawn.command], {
  cwd: root,
  encoding: "utf8",
}).trim();
const argv = JSON.parse(output.split(/\r?\n/).at(-1));
if (argv.length !== 1 || argv[0] !== prompt) {
  throw new Error(`Prompt transport split or changed the argument: ${JSON.stringify(argv)}`);
}
console.log("Windows structured-spawn prompt transport passed.");
