import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const nodeModules = join(root, "node_modules");
const quiet = process.env.CRAB_PATCH_QUIET === "1";

if (!existsSync(nodeModules)) {
  if (!quiet) console.log("Crab patches: node_modules not installed; nothing to patch.");
  process.exit(0);
}

const patches = [
  {
    name: "context-prune respects PI_CODING_AGENT_DIR",
    file: join(nodeModules, "pi-context-prune", "src", "config.ts"),
    before: "/** Path to the extension's own settings file, independent of any project. */\nexport const SETTINGS_PATH = join(homedir(), \".pi\", \"agent\", \"context-prune\", \"settings.json\");",
    after: "/** Path to the extension's own settings file, isolated with Pi when configured. */\nconst AGENT_DIR = process.env.PI_CODING_AGENT_DIR?.trim() || join(homedir(), \".pi\", \"agent\");\nexport const SETTINGS_PATH = join(AGENT_DIR, \"context-prune\", \"settings.json\");",
  },
  {
    name: "interactive-shell imports the Windows argv runner helper",
    file: join(nodeModules, "pi-interactive-shell", "spawn.ts"),
    before: `import { basename, dirname, join, relative, resolve } from "node:path";\nimport type { InteractiveShellConfig, SpawnAgent } from "./config.js";`,
    after: `import { basename, dirname, join, relative, resolve } from "node:path";\nimport { fileURLToPath } from "node:url";\nimport type { InteractiveShellConfig, SpawnAgent } from "./config.js";`,
  },
  {
    name: "interactive-shell preserves multiline structured prompts on Windows",
    file: join(nodeModules, "pi-interactive-shell", "spawn.ts"),
    before: `function buildShellCommand(executable: string, args: string[]): string {
\treturn [shellQuoteIfNeeded(executable), ...args.map(shellQuoteIfNeeded)].join(" ");
}

function shellQuoteIfNeeded(value: string): string {`,
    after: `function buildShellCommand(executable: string, args: string[]): string {
\tif (process.platform === "win32") {
\t\tconst runner = fileURLToPath(new URL("./windows-spawn-runner.mjs", import.meta.url)).replace(/\\\\/g, "/");
\t\tconst payload = Buffer.from(JSON.stringify({ executable, args }), "utf8").toString("base64url");
\t\treturn ["node", shellQuoteIfNeeded(runner), payload].join(" ");
\t}
\treturn [shellQuoteIfNeeded(executable), ...args.map(shellQuoteIfNeeded)].join(" ");
}

function shellQuoteIfNeeded(value: string): string {`,
  },
  {
    name: "pi-subagents recognizes max reasoning",
    file: join(nodeModules, "pi-subagents", "src", "shared", "model-info.ts"),
    before: `export const THINKING_LEVELS = ["off", "minimal", "low", "medium", "high", "xhigh"] as const;`,
    after: `export const THINKING_LEVELS = ["off", "minimal", "low", "medium", "high", "xhigh", "max"] as const;`,
  },
  {
    name: "pi-subagents exposes mapped max reasoning only when supported",
    file: join(nodeModules, "pi-subagents", "src", "shared", "model-info.ts"),
    before: `\t\tif (level === "xhigh") return mapped !== undefined;`,
    after: `\t\tif (level === "xhigh" || level === "max") return mapped !== undefined;`,
  },
  {
    name: "pi-subagents passes max reasoning to child Pi",
    file: join(nodeModules, "pi-subagents", "src", "runs", "shared", "pi-args.ts"),
    before: `const THINKING_LEVELS = ["off", "minimal", "low", "medium", "high", "xhigh"];`,
    after: `const THINKING_LEVELS = ["off", "minimal", "low", "medium", "high", "xhigh", "max"];`,
  },
  {
    name: "pi-subagents labels max reasoning in clarify UI",
    file: join(nodeModules, "pi-subagents", "src", "runs", "foreground", "chain-clarify.ts"),
    before: `\t\t\t"xhigh": "Maximum reasoning (ultrathink)",`,
    after: `\t\t\t"xhigh": "Extended reasoning",\n\t\t\t"max": "Maximum supported reasoning",`,
  },
  {
    name: "pi-subagents runs configured Node entrypoints through Node",
    file: join(nodeModules, "pi-subagents", "src", "runs", "shared", "pi-spawn.ts"),
    before: `\tconst env = deps.env ?? process.env;
\tconst piBinary = env[PI_SUBAGENT_PI_BINARY_ENV]?.trim();
\tif (piBinary) {
\t\treturn { command: piBinary, args };
\t}`,
    after: `\tconst env = deps.env ?? process.env;
\tconst piBinary = env[PI_SUBAGENT_PI_BINARY_ENV]?.trim();
\tif (piBinary) {
\t\tconst piBinaryPath = normalizePath(piBinary);
\t\tif (isRunnableNodeScript(piBinaryPath, deps.existsSync ?? fs.existsSync)) {
\t\t\treturn {
\t\t\t\tcommand: deps.execPath ?? process.execPath,
\t\t\t\targs: [piBinaryPath, ...args],
\t\t\t};
\t\t}
\t\treturn { command: piBinary, args };
\t}`,
  },
  {
    name: "context-prune uses the normal Pi SSE session request path",
    file: join(nodeModules, "pi-context-prune", "src", "summarizer.ts"),
    before: `      { apiKey: auth.apiKey, headers: auth.headers, signal: options.signal, ...summarizerThinkingOptions(config) }`,
    after: `      {
        apiKey: auth.apiKey,
        headers: auth.headers,
        signal: options.signal,
        sessionId: \`\${ctx.sessionManager.getSessionId()}-context-prune\`,
        transport: "sse",
        ...summarizerThinkingOptions(config),
      }`,
  },
  {
    name: "context-prune stops a summarizer batch after the first failure",
    file: join(nodeModules, "pi-context-prune", "src", "summarizer.ts"),
    before: `  return Promise.all(
    batches.map((batch, index) =>
      summarizeBatch(batch, config, ctx, {
        signal: options.signal,
        onTextProgress: (receivedChars) => {
          options.onBatchTextProgress?.(index, batches.length, batch, receivedChars);
        },
      })
    )
  );`,
    after: `  const results: Array<SummarizeResult | null> = [];
  for (let index = 0; index < batches.length; index++) {
    const batch = batches[index];
    const result = await summarizeBatch(batch, config, ctx, {
      signal: options.signal,
      onTextProgress: (receivedChars) => {
        options.onBatchTextProgress?.(index, batches.length, batch, receivedChars);
      },
    });
    results.push(result);
    if (!result) {
      while (results.length < batches.length) results.push(null);
      break;
    }
  }
  return results;`,
  },
  {
    name: "context-usage omits its package-maintainer release command",
    file: join(nodeModules, "pi-context-usage", "src", "index.ts"),
    before: `  registerReleaseCommand(pi);`,
    after: `  // Crab intentionally omits this package's repository release workflow.`,
  },
];

for (const patch of patches) {
  if (!existsSync(patch.file)) throw new Error(`Crab patch target missing: ${patch.file}`);
  const source = readFileSync(patch.file, "utf8");
  if (source.includes(patch.after)) {
    if (!quiet) console.log(`Crab patch already applied: ${patch.name}`);
    continue;
  }
  if (!source.includes(patch.before)) {
    throw new Error(`Crab patch no longer matches ${patch.file}: ${patch.name}`);
  }
  writeFileSync(patch.file, source.replace(patch.before, patch.after));
  console.log(`Crab patch applied: ${patch.name}`);
}

const windowsRunnerPath = join(nodeModules, "pi-interactive-shell", "windows-spawn-runner.mjs");
const windowsRunnerSource = `import crossSpawn from "cross-spawn";

const encoded = process.argv[2];
if (!encoded) throw new Error("Missing encoded spawn payload.");

const payload = JSON.parse(Buffer.from(encoded, "base64url").toString("utf8"));
if (typeof payload.executable !== "string" || !Array.isArray(payload.args) || !payload.args.every((arg) => typeof arg === "string")) {
  throw new Error("Invalid encoded spawn payload.");
}

const child = crossSpawn(payload.executable, payload.args, {
  stdio: "inherit",
  windowsHide: false,
});

child.on("error", (error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
child.on("exit", (code) => {
  process.exitCode = code ?? 1;
});
`;
if (!existsSync(windowsRunnerPath) || readFileSync(windowsRunnerPath, "utf8") !== windowsRunnerSource) {
  writeFileSync(windowsRunnerPath, windowsRunnerSource);
  console.log("Crab patch applied: interactive-shell Windows argv runner");
} else if (!quiet) {
  console.log("Crab patch already applied: interactive-shell Windows argv runner");
}
