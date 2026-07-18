#!/usr/bin/env node

import { readdir, readFile, stat } from "node:fs/promises";
import { dirname, extname, isAbsolute, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const REQUIRED_FILES = [
  "README.md",
  "DESIGN_SCOPE.md",
  "PROVENANCE.md",
  "package.json",
  "npm-shrinkwrap.json",
  "bin/crab.mjs",
  "profiles/crab.md",
  "runtime/launcher.mjs",
  "runtime/default-permissions.jsonc",
  "runtime/extension-configs/pi-permission-system.json",
  "runtime/extension-configs/subagent.json",
  "LICENSE",
  ".gitattributes",
  ".github/workflows/verify.yml",
  ".gitignore",
  "config/crab.sample.json",
  "config/permissions.sample.json",
  "demo/request.json",
  "demo/trace.json",
  "docs/architecture.md",
  "docs/attribution.md",
  "docs/capabilities-and-use.md",
  "docs/demo-script.md",
  "docs/demonstration-trace.md",
  "docs/evidence-and-limitations.md",
  "docs/model-selection.md",
  "docs/patch-notes.md",
  "docs/problem-and-market.md",
  "docs/release-review.md",
  "docs/remote-pi-option.md",
  "docs/upstream-projects.md",
  "docs/verification-result.md",
  "examples/wayfinder.md",
  "prompts/lg.md",
  "prompts/wayfinder.md",
  "prompts/diagnose.md",
  "prompts/tdd.md",
  "explorer/index.html",
  "assets/architecture-explorer.png",
  "assets/diagrams/model-routing.svg",
  "assets/diagrams/context-pruning.svg",
  "assets/diagrams/subagent-boundaries.svg",
  "assets/diagrams/permissions.svg",
  "assets/diagrams/windows-prompt-transport.svg",
  "assets/diagrams/verification-lifecycle.svg",
  "scripts/apply-local-patches.mjs",
  "scripts/inspect-runtime.mjs",
  "scripts/run-demo.mjs",
  "scripts/test-global-install.mjs",
  "scripts/test-subagent-spawn.mjs",
  "scripts/test-windows-spawn.mjs",
  "scripts/verify-demo.mjs",
  "scripts/verify-runtime.mjs",
  "tests/demo.test.mjs",
  "tests/launcher.test.mjs"
];
const FORBIDDEN_STATE_PATHS = [
  ".pi",
  ".pi-subagents",
  ".codex",
  ".env",
  ".playwright-mcp"
];
const TEXT_EXTENSIONS = new Set(["", ".html", ".json", ".jsonc", ".md", ".mjs", ".svg"]);
const PRIVATE_PATTERNS = [
  {
    name: "unredacted Windows user path",
    regex: /[A-Za-z]:[\\/](?:Users|Documents and Settings)[\\/](?!<(?:owner|user|redacted)>)[^<\\/\s]+/i
  },
  {
    name: "unredacted Unix home path",
    regex: /\/(?:home|Users)\/(?!<(?:owner|user|redacted)>)[^/<\s]+/
  },
  {
    name: "private-key material",
    regex: /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/
  },
  {
    name: "common token shape",
    regex: /(?:ghp|github_pat|xox[baprs]|sk)_[A-Za-z0-9_-]{16,}/
  },
  {
    name: "API key value",
    regex: /(?:OPENAI|ANTHROPIC|GEMINI|TAVILY|BRAVE|EXA)_API_KEY\s*[:=]\s*["']?[A-Za-z0-9_-]{12,}/i
  }
];

const failures = [];

function pass(message) {
  console.log(`✓ ${message}`);
}

function fail(message) {
  failures.push(message);
  console.error(`✗ ${message}`);
}

async function exists(relativePath) {
  try {
    await stat(resolve(ROOT, relativePath));
    return true;
  } catch {
    return false;
  }
}

function isWithinRoot(target) {
  const pathFromRoot = relative(ROOT, target);
  return pathFromRoot === "" || (!isAbsolute(pathFromRoot) && pathFromRoot !== ".." && !pathFromRoot.startsWith(`..${sep}`));
}

async function walk(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    if ([".git", "node_modules"].includes(entry.name)) continue;
    const path = resolve(directory, entry.name);
    if (entry.isDirectory()) files.push(...(await walk(path)));
    else files.push(path);
  }
  return files;
}

function run(command, args) {
  return spawnSync(command, args, {
    cwd: ROOT,
    encoding: "utf8",
    shell: false
  });
}

async function checkRequiredFiles() {
  const missing = [];
  const forbidden = [];
  let ignoreRulesValid = false;
  for (const file of REQUIRED_FILES) {
    if (!(await exists(file))) missing.push(file);
  }
  for (const path of FORBIDDEN_STATE_PATHS) {
    if (await exists(path)) forbidden.push(path);
  }
  for (const entry of await readdir(ROOT)) {
    if (/^\.env(?:\.|$)/.test(entry) && !forbidden.includes(entry)) forbidden.push(entry);
  }

  if (missing.length) fail(`missing required files: ${missing.join(", ")}`);
  else pass(`${REQUIRED_FILES.length} required artifacts are present`);

  if (forbidden.length) fail(`private/generated state found in destination: ${forbidden.join(", ")}`);
  else pass("no forbidden runtime-state directory is present");

  if (missing.length === 0) {
    const ignoreFile = await readFile(resolve(ROOT, ".gitignore"), "utf8");
    ignoreRulesValid = [".pi/", ".pi-subagents/", ".codex/", ".playwright-mcp/", "node_modules/", ".env"].every(
      (rule) => ignoreFile.includes(rule)
    );
    if (ignoreRulesValid) pass(".gitignore excludes private and generated runtime state");
    else fail(".gitignore is missing a required private/generated-state rule");
  }

  return missing.length === 0 && forbidden.length === 0 && ignoreRulesValid;
}

async function checkJson() {
  const files = [
    "config/crab.sample.json",
    "config/permissions.sample.json",
    "demo/request.json",
    "demo/trace.json"
  ];
  try {
    await Promise.all(
      files.map(async (file) => JSON.parse(await readFile(resolve(ROOT, file), "utf8")))
    );
    pass("sample configuration and trace JSON parse cleanly");
  } catch (error) {
    fail(`JSON parse failed: ${error.message}`);
  }
}

function checkScripts() {
  for (const script of ["scripts/run-demo.mjs", "scripts/verify-demo.mjs", "tests/demo.test.mjs"]) {
    const result = run(process.execPath, ["--check", script]);
    if (result.status === 0) pass(`${script} passes node --check`);
    else fail(`${script} has a syntax error: ${(result.stderr || result.stdout).trim()}`);
  }
}

function checkTests() {
  const result = run(process.execPath, ["--test", "tests/demo.test.mjs"]);
  if (result.status === 0) pass("focused Node tests pass");
  else fail(`focused Node tests failed: ${(result.stderr || result.stdout).trim()}`);
}

async function checkDeterministicTrace() {
  const result = run(process.execPath, ["scripts/run-demo.mjs", "--json", "--decision=reject"]);
  if (result.status !== 0) {
    fail(`demo runner failed: ${(result.stderr || result.stdout).trim()}`);
    return;
  }

  try {
    const actual = JSON.parse(result.stdout);
    const expected = JSON.parse(await readFile(resolve(ROOT, "demo/trace.json"), "utf8"));
    const expectedStages = [
      "primary",
      "scout",
      "reviewer",
      "tool-verification",
      "primary",
      "human-decision"
    ];
    const expectedActors = [
      "primary",
      "bounded-scout",
      "read-only-reviewer",
      "local-verifier",
      "primary",
      "human"
    ];
    const issues = [];
    const events = Array.isArray(actual?.events) ? actual.events : [];
    const toolEvent = events[3] ?? {};

    if (actual?.schemaVersion !== 1) issues.push("schema version");
    if (actual?.requestId !== "remote-default-001") issues.push("request id");
    if (JSON.stringify(events.map((event) => event?.stage)) !== JSON.stringify(expectedStages)) {
      issues.push("stage order");
    }
    if (JSON.stringify(events.map((event) => event?.actor)) !== JSON.stringify(expectedActors)) {
      issues.push("actor order");
    }
    if (!events.every((event, index) => event?.sequence === index + 1)) issues.push("sequence numbers");
    if (
      toolEvent?.passed !== true ||
      toolEvent?.networkUsed !== false ||
      !Array.isArray(toolEvent?.checks) ||
      toolEvent.checks.length !== 13 ||
      !toolEvent.checks.every((check) => check?.passed === true)
    ) {
      issues.push("tool assertion set");
    }
    if (events.at(-1)?.decision !== "reject") issues.push("human decision");
    if (
      actual?.final?.status !== "rejected-by-human" ||
      actual?.final?.humanDecision !== "reject" ||
      actual?.final?.externalActionsExecuted !== false
    ) {
      issues.push("final no-effect outcome");
    }
    if (JSON.stringify(actual) !== JSON.stringify(expected)) issues.push("recorded fixture equality");

    if (issues.length === 0) {
      pass("demo trace independently satisfies its sequence, assertion, decision, and no-effect contract");
    } else {
      fail(`demo trace contract failed: ${issues.join(", ")}`);
    }
  } catch (error) {
    fail(`demo trace comparison failed: ${error.message}`);
  }
}

async function checkArchitecture() {
  const text = await readFile(resolve(ROOT, "docs/architecture.md"), "utf8");
  const required = [
    "Model routing",
    "Context pruning",
    "Subagent boundaries",
    "Permissions",
    "Windows prompt transport",
    "Verification lifecycle"
  ];
  const missing = required.filter((heading) => !text.includes(`## ${heading}`));
  const blocks = [...text.matchAll(/```mermaid\r?\n([\s\S]*?)```/g)].map((match) => match[1]);
  const mermaidCount = blocks.length;
  const accTitleCount = (text.match(/^accTitle:/gm) || []).length;
  const accDescrCount = (text.match(/^accDescr:/gm) || []).length;
  const declarationOrderValid = blocks.every((block) => {
    const lines = block.split("\n").map((line) => line.trim()).filter(Boolean);
    return /^flowchart\s/.test(lines[0] ?? "") &&
      (lines[1] ?? "").startsWith("accTitle:") &&
      (lines[2] ?? "").startsWith("accDescr:");
  });

  if (
    missing.length === 0 &&
    mermaidCount === 6 &&
    accTitleCount === 6 &&
    accDescrCount === 6 &&
    declarationOrderValid
  ) {
    pass("all six architecture diagrams have declarations and accessible descriptions in publishable order");
  } else {
    fail(
      `architecture coverage incomplete; missing headings: ${missing.join(", ") || "none"}, ` +
        `Mermaid blocks: ${mermaidCount}, accessible titles/descriptions: ${accTitleCount}/${accDescrCount}, ` +
        `declaration order: ${declarationOrderValid}`
    );
  }

  const renderedFallbacks = [
    ["model-routing.svg", "Crab model routing"],
    ["context-pruning.svg", "Recoverable context-pruning flow"],
    ["subagent-boundaries.svg", "Parent and advisory subagent boundaries"],
    ["permissions.svg", "Permission and human-approval flow"],
    ["windows-prompt-transport.svg", "Windows structured-prompt transport"],
    ["verification-lifecycle.svg", "Crab verification lifecycle"]
  ];
  const svgIssues = [];
  for (const [file, title] of renderedFallbacks) {
    const svg = await readFile(resolve(ROOT, "assets/diagrams", file), "utf8");
    if (!/<svg\b/i.test(svg) || !svg.includes(`<title id="chart-title-container">${title}</title>`)) {
      svgIssues.push(`${file} is missing its expected SVG/title`);
    }
    if (!/<desc\b/i.test(svg) || !/role="graphics-document document"/.test(svg)) {
      svgIssues.push(`${file} is missing accessible description/role metadata`);
    }
    if (/<script\b|<iframe\b|\son\w+\s*=|(?:href|src)=["']https?:/i.test(svg)) {
      svgIssues.push(`${file} contains executable or external SVG content`);
    }
  }
  if (svgIssues.length === 0) pass("all six Mermaid sources have safe accessible SVG render fallbacks");
  else fail(`rendered SVG fallback checks failed: ${svgIssues.join(", ")}`);
}

async function checkLicense() {
  const text = await readFile(resolve(ROOT, "LICENSE"), "utf8");
  const required = [
    "Apache License",
    "Version 2.0, January 2004",
    "TERMS AND CONDITIONS FOR USE, REPRODUCTION, AND DISTRIBUTION",
    "END OF TERMS AND CONDITIONS"
  ];
  if (required.every((fragment) => text.includes(fragment))) {
    pass("Apache-2.0 license text is present");
  } else {
    fail("LICENSE does not contain the expected Apache-2.0 text");
  }
}

async function checkAttribution() {
  const text = await readFile(resolve(ROOT, "docs/attribution.md"), "utf8");
  const credits = await readFile(resolve(ROOT, "docs/upstream-projects.md"), "utf8");
  const components = ["My work", "Pi", "Codex", "Context7", "Playwright", "Ponytail", "MCP", "remote-pi"];
  const creditEvidence = [
    "earendil-works/pi",
    "Mario Zechner",
    "Nico Bailon",
    "championswimmer",
    "MasuRii",
    "narumiruna",
    "DietrichGebert",
    "Jacob Moura",
    "openai/codex",
    "modelcontextprotocol/modelcontextprotocol",
    "upstash/context7",
    "microsoft/playwright",
    "yuzutech/kroki"
  ];
  const missing = components.filter((component) => !text.includes(component));
  const missingCredits = creditEvidence.filter((credit) => !credits.includes(credit));
  if (missing.length === 0 && missingCredits.length === 0) {
    pass("attribution matrix and upstream credit roll name every required boundary and public credit");
  } else {
    fail(
      `attribution evidence is missing: ${[...missing, ...missingCredits].join(", ")}`
    );
  }
}

async function checkExplorer() {
  const explorerPath = resolve(ROOT, "explorer/index.html");
  const html = await readFile(explorerPath, "utf8");
  const issues = [];
  const requiredFragments = [
    '<a class="skip" href="#main">Skip to main content</a>',
    '<main id="main">',
    '<nav aria-label="Primary">',
    '<ol class="route" aria-label="Primary to human decision route">',
    "<caption>Evidence boundaries</caption>",
    'scope="col"',
    "@media (max-width: 620px)",
    ".step:not(:last-child)::after { display: none; }"
  ];

  for (const fragment of requiredFragments) {
    if (!html.includes(fragment)) issues.push(`missing ${fragment}`);
  }
  if ((html.match(/<details/g) || []).length < 6) issues.push("fewer than six flow details");
  if ((html.match(/scope="col"/g) || []).length < 3) issues.push("table column scopes missing");
  if (/<script\b/i.test(html)) issues.push("unexpected JavaScript");
  if (/\.nav-links\s*\{[^}]*display:\s*none/si.test(html)) issues.push("mobile navigation hidden");

  const localLinks = [...html.matchAll(/href="([^"]+)"/g)].map((match) => match[1]);
  for (const link of localLinks) {
    if (/^(?:https?:|data:|#)/.test(link)) continue;
    const target = resolve(dirname(explorerPath), decodeURIComponent(link.split(/[?#]/)[0]));
    if (!isWithinRoot(target)) {
      issues.push(`explorer link escapes destination ${link}`);
      continue;
    }
    try {
      await stat(target);
    } catch {
      issues.push(`broken explorer link ${link}`);
    }
  }

  const screenshotPath = resolve(ROOT, "assets/architecture-explorer.png");
  const screenshot = await stat(screenshotPath);
  if (screenshot.size < 50_000) issues.push("explorer screenshot is unexpectedly small");

  const png = await readFile(screenshotPath);
  const pngSignature = "89504e470d0a1a0a";
  if (png.subarray(0, 8).toString("hex") !== pngSignature) {
    issues.push("explorer screenshot is not a PNG");
  } else {
    const metadataChunks = new Set(["tEXt", "zTXt", "iTXt", "eXIf"]);
    let offset = 8;
    while (offset + 12 <= png.length) {
      const length = png.readUInt32BE(offset);
      const type = png.subarray(offset + 4, offset + 8).toString("ascii");
      if (offset + 12 + length > png.length) {
        issues.push("explorer screenshot has a malformed PNG chunk");
        break;
      }
      if (metadataChunks.has(type)) issues.push(`explorer screenshot contains ${type} metadata`);
      offset += 12 + length;
      if (type === "IEND") break;
    }
  }

  if (issues.length === 0) pass("static explorer accessibility markers, links, and screenshot are present");
  else fail(`static explorer checks failed: ${issues.join(", ")}`);
}

async function checkPrivatePatterns(files) {
  const hits = [];
  for (const file of files) {
    if (!TEXT_EXTENSIONS.has(extname(file))) continue;
    const text = await readFile(file, "utf8");
    for (const pattern of PRIVATE_PATTERNS) {
      if (pattern.regex.test(text)) {
        hits.push(`${file.slice(ROOT.length + 1)} (${pattern.name})`);
      }
    }
  }
  if (hits.length === 0) pass("no private path, key, or common token pattern was found");
  else fail(`sanitization scan found: ${hits.join(", ")}`);
}

async function checkMarkdownLinks(files) {
  const broken = [];
  for (const file of files.filter((candidate) => extname(candidate) === ".md")) {
    const text = await readFile(file, "utf8");
    const links = [...text.matchAll(/\[[^\]]*\]\(([^)]+)\)/g)].map((match) => match[1]);
    for (const rawLink of links) {
      const link = rawLink.trim().split(/\s+["']/)[0];
      if (/^(?:https?:|mailto:|#)/.test(link)) continue;
      const withoutAnchor = link.split("#")[0];
      if (!withoutAnchor) continue;
      const target = resolve(dirname(file), decodeURIComponent(withoutAnchor));
      if (!isWithinRoot(target)) {
        broken.push(`${file.slice(ROOT.length + 1)} -> ${rawLink} (escapes destination)`);
        continue;
      }
      try {
        await stat(target);
      } catch {
        broken.push(`${file.slice(ROOT.length + 1)} -> ${rawLink}`);
      }
    }
  }
  if (broken.length === 0) pass("local Markdown links resolve");
  else fail(`broken local Markdown links: ${broken.join(", ")}`);
}

const requiredStateIsClean = await checkRequiredFiles();
if (requiredStateIsClean) {
  await checkJson();
  checkScripts();
  checkTests();
  await checkDeterministicTrace();
  await checkArchitecture();
  await checkLicense();
  await checkAttribution();
  await checkExplorer();

  const files = await walk(ROOT);
  await checkPrivatePatterns(files);
  await checkMarkdownLinks(files);
}

if (failures.length) {
  console.error(`\nVerification failed with ${failures.length} issue(s).`);
  process.exitCode = 1;
} else {
  console.log("\nDocumentation and demo verification passed.");
}
