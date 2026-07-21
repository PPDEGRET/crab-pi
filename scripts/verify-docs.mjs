#!/usr/bin/env node

import { readdir, readFile, stat } from "node:fs/promises";
import { dirname, extname, isAbsolute, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const REQUIRED_FILES = [
  "README.md",
  "DESIGN_SCOPE.md",
  "PROVENANCE.md",
  "package.json",
  "npm-shrinkwrap.json",
  "bin/crab.mjs",
  "bin/crabtest.mjs",
  "profiles/crab.md",
  "runtime/launcher.mjs",
  "runtime/lean-tools.mjs",
  "runtime/default-permissions.jsonc",
  "runtime/extension-configs/pi-permission-system.json",
  "runtime/extension-configs/subagent.json",
  "LICENSE",
  ".gitattributes",
  ".github/workflows/verify.yml",
  ".gitignore",
  "docs/architecture.md",
  "docs/attribution.md",
  "docs/capabilities-and-use.md",
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
  "assets/diagrams/model-routing.svg",
  "assets/diagrams/context-pruning.svg",
  "assets/diagrams/subagent-boundaries.svg",
  "assets/diagrams/permissions.svg",
  "assets/diagrams/windows-prompt-transport.svg",
  "assets/diagrams/verification-lifecycle.svg",
  "scripts/apply-local-patches.mjs",
  "scripts/inspect-runtime.mjs",
  "scripts/test-global-install.mjs",
  "scripts/test-subagent-spawn.mjs",
  "scripts/test-windows-spawn.mjs",
  "scripts/verify-docs.mjs",
  "scripts/verify-runtime.mjs",
  "tests/launcher.test.mjs",
  "tests/lean-tools.test.mjs"
];
const FORBIDDEN_STATE_PATHS = [".pi", ".pi-subagents", ".codex", ".env", ".playwright-mcp"];
const REMOVED_PRESENTATION_PATHS = [
  "assets/architecture-explorer.png",
  "config",
  "demo",
  "explorer",
  "docs/demo-script.md",
  "docs/demonstration-trace.md",
  "scripts/run-demo.mjs",
  "tests/demo.test.mjs"
];
const TEXT_EXTENSIONS = new Set(["", ".json", ".jsonc", ".md", ".mjs", ".svg"]);
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
  const files = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    if ([".git", "node_modules"].includes(entry.name)) continue;
    const path = resolve(directory, entry.name);
    if (entry.isDirectory()) files.push(...(await walk(path)));
    else files.push(path);
  }
  return files;
}

async function checkRequiredFiles() {
  const missing = [];
  const forbidden = [];
  const presentationArtifacts = [];
  for (const file of REQUIRED_FILES) {
    if (!(await exists(file))) missing.push(file);
  }
  for (const path of FORBIDDEN_STATE_PATHS) {
    if (await exists(path)) forbidden.push(path);
  }
  for (const path of REMOVED_PRESENTATION_PATHS) {
    if (await exists(path)) presentationArtifacts.push(path);
  }
  for (const entry of await readdir(ROOT)) {
    if (/^\.env(?:\.|$)/.test(entry) && !forbidden.includes(entry)) forbidden.push(entry);
  }

  if (missing.length) fail(`missing required files: ${missing.join(", ")}`);
  else pass(`${REQUIRED_FILES.length} required artifacts are present`);
  if (forbidden.length) fail(`private/generated state found in destination: ${forbidden.join(", ")}`);
  else pass("no forbidden runtime-state directory is present");
  if (presentationArtifacts.length) fail(`removed presentation artifacts are still present: ${presentationArtifacts.join(", ")}`);
  else pass("presentation-only command and artifacts are absent");

  const ignoreFile = await readFile(resolve(ROOT, ".gitignore"), "utf8");
  const ignoreRulesValid = [".pi/", ".pi-subagents/", ".codex/", ".playwright-mcp/", "node_modules/", ".env"].every(
    (rule) => ignoreFile.includes(rule)
  );
  if (ignoreRulesValid) pass(".gitignore excludes private and generated runtime state");
  else fail(".gitignore is missing a required private/generated-state rule");

  return missing.length === 0 && forbidden.length === 0 && presentationArtifacts.length === 0 && ignoreRulesValid;
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
  const declarationOrderValid = blocks.every((block) => {
    const lines = block.split("\n").map((line) => line.trim()).filter(Boolean);
    return /^flowchart\s/.test(lines[0] ?? "") &&
      (lines[1] ?? "").startsWith("accTitle:") &&
      (lines[2] ?? "").startsWith("accDescr:");
  });

  if (
    missing.length === 0 &&
    blocks.length === 6 &&
    (text.match(/^accTitle:/gm) || []).length === 6 &&
    (text.match(/^accDescr:/gm) || []).length === 6 &&
    declarationOrderValid
  ) {
    pass("all six architecture diagrams have accessible Mermaid sources");
  } else {
    fail(`architecture coverage is incomplete: ${missing.join(", ") || "diagram metadata"}`);
  }

  const renderedFallbacks = [
    ["model-routing.svg", "Crab model routing"],
    ["context-pruning.svg", "Recoverable context-pruning flow"],
    ["subagent-boundaries.svg", "Parent and advisory subagent boundaries"],
    ["permissions.svg", "Permission and human-approval flow"],
    ["windows-prompt-transport.svg", "Windows structured-prompt transport"],
    ["verification-lifecycle.svg", "Crab verification lifecycle"]
  ];
  const issues = [];
  for (const [file, title] of renderedFallbacks) {
    const svg = await readFile(resolve(ROOT, "assets/diagrams", file), "utf8");
    if (!svg.includes(`<title id="chart-title-container">${title}</title>`)) issues.push(`${file} title`);
    if (!/<desc\b/i.test(svg) || !/role="graphics-document document"/.test(svg)) issues.push(`${file} accessibility`);
    if (/<script\b|<iframe\b|\son\w+\s*=|(?:href|src)=["']https?:/i.test(svg)) issues.push(`${file} executable content`);
  }
  if (issues.length === 0) pass("all six rendered diagrams are local and accessible");
  else fail(`rendered diagram checks failed: ${issues.join(", ")}`);
}

async function checkLicense() {
  const text = await readFile(resolve(ROOT, "LICENSE"), "utf8");
  const required = [
    "Apache License",
    "Version 2.0, January 2004",
    "TERMS AND CONDITIONS FOR USE, REPRODUCTION, AND DISTRIBUTION",
    "END OF TERMS AND CONDITIONS"
  ];
  if (required.every((fragment) => text.includes(fragment))) pass("Apache-2.0 license text is present");
  else fail("LICENSE does not contain the expected Apache-2.0 text");
}

async function checkAttribution() {
  const text = await readFile(resolve(ROOT, "docs/attribution.md"), "utf8");
  const credits = await readFile(resolve(ROOT, "docs/upstream-projects.md"), "utf8");
  const components = ["My work", "Pi", "Codex", "Context7", "Playwright", "Ponytail", "MCP", "remote-pi"];
  const evidence = [
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
  const missing = [...components.filter((value) => !text.includes(value)), ...evidence.filter((value) => !credits.includes(value))];
  if (missing.length === 0) pass("attribution names every required boundary and public credit");
  else fail(`attribution evidence is missing: ${missing.join(", ")}`);
}

async function checkPrivatePatterns(files) {
  const hits = [];
  for (const file of files) {
    if (!TEXT_EXTENSIONS.has(extname(file))) continue;
    const text = await readFile(file, "utf8");
    for (const pattern of PRIVATE_PATTERNS) {
      if (pattern.regex.test(text)) hits.push(`${file.slice(ROOT.length + 1)} (${pattern.name})`);
    }
  }
  if (hits.length === 0) pass("no private path, key, or common token pattern was found");
  else fail(`sanitization scan found: ${hits.join(", ")}`);
}

async function checkMarkdownLinks(files) {
  const broken = [];
  for (const file of files.filter((candidate) => extname(candidate) === ".md")) {
    const text = await readFile(file, "utf8");
    for (const match of text.matchAll(/\[[^\]]*\]\(([^)]+)\)/g)) {
      const rawLink = match[1];
      const link = rawLink.trim().split(/\s+["']/)[0];
      if (/^(?:https?:|mailto:|#)/.test(link)) continue;
      const withoutAnchor = link.split("#")[0];
      if (!withoutAnchor) continue;
      const target = resolve(dirname(file), decodeURIComponent(withoutAnchor));
      if (!isWithinRoot(target)) {
        broken.push(`${file.slice(ROOT.length + 1)} -> ${rawLink} (escapes destination)`);
      } else if (!(await exists(relative(ROOT, target)))) {
        broken.push(`${file.slice(ROOT.length + 1)} -> ${rawLink}`);
      }
    }
  }
  if (broken.length === 0) pass("local Markdown links resolve");
  else fail(`broken local Markdown links: ${broken.join(", ")}`);
}

if (await checkRequiredFiles()) {
  await checkArchitecture();
  await checkLicense();
  await checkAttribution();
  const files = await walk(ROOT);
  await checkPrivatePatterns(files);
  await checkMarkdownLinks(files);
}

if (failures.length) {
  console.error(`\nDocumentation verification failed with ${failures.length} issue(s).`);
  process.exitCode = 1;
} else {
  console.log("\nDocumentation verification passed.");
}
