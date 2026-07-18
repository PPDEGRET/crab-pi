#!/usr/bin/env node

import { readFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const READ_ONLY_TOOLS = new Set(["read", "grep", "find", "ls"]);
const DECISIONS = new Set(["approve", "defer", "reject"]);
const REQUIRED_HUMAN_GATES = [
  "external-write",
  "remote-write",
  "deploy",
  "publish",
  "account-action"
];
const REQUIRED_DENY_PATHS = [
  "**/.env*",
  "**/auth.*",
  "**/credentials/**",
  "**/sessions/**",
  "**/transcripts/**",
  "**/browser-state/**",
  "**/.git/**",
  "**/node_modules/**"
];
const REQUIRED_ALLOW_PATHS = [
  "<workspace>/config/**",
  "<workspace>/demo/**",
  "<workspace>/docs/**"
];
const LOCAL_COMMANDS = [
  "node scripts/run-demo.mjs",
  "node --test tests/demo.test.mjs",
  "node scripts/verify-demo.mjs"
];
const VERIFICATION_COMMANDS = [
  "node --test tests/demo.test.mjs",
  "node scripts/verify-demo.mjs"
];
const DENIED_COMMAND_CATEGORIES = [
  "destructive-filesystem",
  "network-write",
  "package-install",
  "publish",
  "deploy",
  "account-action"
];

function hasEvery(value, expected) {
  return Array.isArray(value) && expected.every((item) => value.includes(item));
}

function hasExactly(value, expected) {
  return hasEvery(value, expected) && value.length === expected.length;
}

function sampleGlobMatches(path, pattern) {
  if (typeof path !== "string" || typeof pattern !== "string") return false;
  const token = "__DOUBLE_STAR__";
  const expression = pattern
    .replace(/[.+^${}()|[\]\\]/g, "\\$&")
    .replaceAll("**", token)
    .replaceAll("*", "[^/]*")
    .replaceAll(token, ".*");
  return new RegExp(`^${expression}$`).test(path);
}

export function evaluateIllustrativePath(permissions, path, operation) {
  if (typeof path !== "string" || typeof operation !== "string") return "deny";
  const normalizedPath = path.replaceAll("\\", "/");
  const segments = normalizedPath.split("/");
  if (
    !normalizedPath.startsWith("<workspace>/") ||
    normalizedPath.includes("\0") ||
    segments.some((segment) => segment === "." || segment === "..")
  ) {
    return "deny";
  }

  const rules = Array.isArray(permissions?.pathRules) ? permissions.pathRules : [];
  if (
    rules.length === 0 ||
    rules.some(
      (rule) =>
        !["allow", "deny"].includes(rule?.effect) ||
        !Array.isArray(rule?.operations) ||
        !rule.operations.every((value) => typeof value === "string") ||
        !Array.isArray(rule?.patterns) ||
        !rule.patterns.every((value) => typeof value === "string")
    )
  ) {
    return "deny";
  }

  const matchingEffects = rules
    .filter(
      (rule) =>
        Array.isArray(rule?.operations) &&
        rule.operations.includes(operation) &&
        Array.isArray(rule.patterns) &&
        rule.patterns.some((pattern) => sampleGlobMatches(normalizedPath, pattern))
    )
    .map((rule) => rule.effect);

  if (permissions?.rulePrecedence === "deny-overrides-allow" && matchingEffects.includes("deny")) {
    return "deny";
  }
  return matchingEffects[0] ?? permissions?.defaultEffect ?? "deny";
}

async function readJson(relativePath) {
  return JSON.parse(await readFile(resolve(ROOT, relativePath), "utf8"));
}

export async function loadDemoInputs() {
  return {
    config: await readJson("config/crab.sample.json"),
    permissions: await readJson("config/permissions.sample.json"),
    request: await readJson("demo/request.json")
  };
}

export function verificationChecks(config, permissions, request) {
  const primary = config?.routing?.primary ?? {};
  const scout = config?.routing?.scout ?? {};
  const reviewer = config?.routing?.reviewer ?? {};
  const pruning = config?.contextPruning ?? {};
  const mcp = config?.mcp;
  const remote = config?.extensions?.remoteExecution ?? {};
  const humanDecision = config?.humanDecision ?? {};
  const humanApproval = permissions?.humanApproval ?? {};
  const pathRules = Array.isArray(permissions?.pathRules) ? permissions.pathRules : [];
  const commandRules = Array.isArray(permissions?.commandRules) ? permissions.commandRules : [];
  const denyPathRules = pathRules.filter((rule) => rule?.effect === "deny");
  const allowPathRules = pathRules.filter((rule) => rule?.effect === "allow");
  const allowCommandRules = commandRules.filter((rule) => rule?.effect === "allow");
  const denyCommandRules = commandRules.filter((rule) => rule?.effect === "deny");
  const denyPathRule = denyPathRules[0] ?? {};
  const allowPathRule = allowPathRules[0] ?? {};
  const allowCommandRule = allowCommandRules[0] ?? {};
  const denyCommandRule = denyCommandRules[0] ?? {};
  const constraints = request?.constraints ?? {};

  return [
    {
      id: "artifacts-are-synthetic-and-non-executable",
      passed:
        config?.schemaVersion === 1 &&
        config?.artifactType === "illustrative-non-executable-schema" &&
        config?.label === "Synthetic demonstration" &&
        permissions?.schemaVersion === 1 &&
        permissions?.artifactType === "illustrative-non-executable-policy" &&
        permissions?.label === "Synthetic demonstration policy" &&
        request?.schemaVersion === 1 &&
        request?.label === "Synthetic demonstration"
    },
    {
      id: "runtime-is-sanitized-and-offline",
      passed:
        config?.runtime?.agentHome === "<agent-home>" &&
        config?.runtime?.workingDirectory === "<workspace>" &&
        config?.runtime?.networkAccess === "disabled" &&
        config?.runtime?.telemetry === false &&
        config?.runtime?.credentialSource === "none" &&
        config?.verification?.networkAllowed === false
    },
    {
      id: "primary-is-single-writer",
      passed: primary.canDelegate === true && primary.writeMode === "single-writer"
    },
    {
      id: "scout-is-bounded-read-only",
      passed:
        scout.maxConcurrent === 1 &&
        scout.maxFiles === 2 &&
        scout.canWrite === false &&
        scout.canDelegate === false &&
        hasEvery(scout.tools, ["read"]) &&
        scout.tools.every((tool) => READ_ONLY_TOOLS.has(tool))
    },
    {
      id: "reviewer-is-independent-read-only",
      passed:
        reviewer.canWrite === false &&
        reviewer.canDelegate === false &&
        hasExactly(reviewer.tools, ["read"]) &&
        reviewer.independence === "separate-read-only-pass"
    },
    {
      id: "pruning-is-recoverable-and-fail-fast",
      passed:
        pruning.enabled === true &&
        pruning.trigger === "agent-message" &&
        pruning.batching === "one-summary-per-agent-message" &&
        pruning.onFailure === "stop-and-preserve-original" &&
        pruning.recoveryTool === "context_tree_query"
    },
    {
      id: "mcp-examples-are-disabled-and-secret-free",
      passed:
        Array.isArray(mcp) &&
        mcp.length === 2 &&
        hasExactly(mcp.map((entry) => entry?.id), ["documentation", "browser"]) &&
        mcp.every(
          (entry) =>
            entry != null &&
            entry.enabled === false &&
            entry.loading === "lazy" &&
            entry.credentials === "not-in-config" &&
            ((entry.id === "documentation" &&
              hasExactly(entry.allowedOperations, ["resolve-library", "query-documentation"])) ||
              (entry.id === "browser" &&
                hasExactly(entry.allowedOperations, ["local-smoke-check"])))
        )
    },
    {
      id: "remote-execution-is-disabled-and-gated",
      passed:
        remote.status === "option-only" &&
        remote.enabledByDefault === false &&
        remote.requiresHumanApproval === true
    },
    {
      id: "human-decisions-default-deny-and-single-use",
      passed:
        humanDecision.default === "deny" &&
        hasEvery(humanDecision.requiredFor, REQUIRED_HUMAN_GATES) &&
        hasEvery(humanApproval.requiredFor, REQUIRED_HUMAN_GATES) &&
        humanApproval.approvalIsSingleUse === true
    },
    {
      id: "sensitive-path-denies-override-allows",
      passed:
        permissions?.rulePrecedence === "deny-overrides-allow" &&
        permissions?.defaultEffect === "ask" &&
        pathRules.length === 2 &&
        denyPathRules.length === 1 &&
        allowPathRules.length === 1 &&
        pathRules[0]?.effect === "deny" &&
        hasExactly(denyPathRule.operations, ["read", "write", "edit"]) &&
        hasExactly(denyPathRule.patterns, REQUIRED_DENY_PATHS) &&
        hasExactly(allowPathRule.operations, ["read"]) &&
        hasExactly(allowPathRule.patterns, REQUIRED_ALLOW_PATHS)
    },
    {
      id: "commands-are-local-only-or-denied",
      passed:
        commandRules.length === 2 &&
        allowCommandRules.length === 1 &&
        denyCommandRules.length === 1 &&
        hasExactly(allowCommandRule.exact, LOCAL_COMMANDS) &&
        hasExactly(denyCommandRule.categories, DENIED_COMMAND_CATEGORIES) &&
        hasExactly(config?.verification?.commands, VERIFICATION_COMMANDS)
    },
    {
      id: "unattended-actions-fail-closed",
      passed:
        permissions?.unattendedMode?.externalEffects === "deny" &&
        permissions?.unattendedMode?.unknownCommands === "deny"
    },
    {
      id: "request-is-a-fixed-no-effect-fixture",
      passed:
        request?.requestId === "remote-default-001" &&
        request?.riskCategory === "remote-write" &&
        request?.expectedHumanDecision === "reject" &&
        Array.isArray(request?.allowedEvidence) &&
        request.allowedEvidence.length > 0 &&
        request.allowedEvidence.every(
          (path) => typeof path === "string" && !path.includes("..") && !/^[A-Za-z]:|^\//.test(path)
        ) &&
        constraints.networkAccess === false &&
        constraints.credentialAccess === false &&
        constraints.sourceMutation === false &&
        constraints.externalActions === false
    }
  ];
}

export function buildTrace({ config, permissions, request, humanDecision = "reject" }) {
  if (!DECISIONS.has(humanDecision)) {
    throw new Error(`Decision must be one of: ${[...DECISIONS].join(", ")}`);
  }
  const checks = verificationChecks(config, permissions, request);
  const failedChecks = checks.filter((check) => !check.passed).map((check) => check.id);
  if (failedChecks.length) {
    throw new Error(`Fixture assertion failed: ${failedChecks.join(", ")}. No trace was produced.`);
  }

  const scout = config.routing.scout;
  const statusByDecision = {
    approve: "approved-for-design-only",
    defer: "deferred-by-human",
    reject: "rejected-by-human"
  };

  return {
    schemaVersion: 1,
    label: "Synthetic demonstration — no model or remote system was called",
    requestId: request.requestId,
    events: [
      {
        sequence: 1,
        stage: "primary",
        actor: "primary",
        action: "classify-and-bound",
        result: "Remote write is an external side effect; gather evidence before recommending a change.",
        delegatedLanes: 1
      },
      {
        sequence: 2,
        stage: "scout",
        actor: "bounded-scout",
        action: "inspect-allowlisted-evidence",
        bounds: {
          maxFiles: scout.maxFiles,
          maxConcurrent: scout.maxConcurrent,
          tools: scout.tools,
          canWrite: scout.canWrite,
          canDelegate: scout.canDelegate
        },
        result: "The sample configuration disables remote execution by default and requires human approval for remote writes."
      },
      {
        sequence: 3,
        stage: "reviewer",
        actor: "read-only-reviewer",
        action: "challenge-proposal",
        result: "Default remote writes would bypass the demonstrated least-privilege and human-decision boundaries.",
        recommendation: "Keep the option disabled; validate a read-only profile before any write-capable trial."
      },
      {
        sequence: 4,
        stage: "tool-verification",
        actor: "local-verifier",
        action: "check-config-invariants",
        networkUsed: false,
        checks,
        passed: true,
        result: `All ${checks.length} public fixture assertions passed.`
      },
      {
        sequence: 5,
        stage: "primary",
        actor: "primary",
        action: "synthesize",
        result: "Recommend retaining deny-by-default remote writes and documenting a gated read-only extension path.",
        finalClaimOwner: "primary"
      },
      {
        sequence: 6,
        stage: "human-decision",
        actor: "human",
        action: "decide",
        decision: humanDecision,
        result: "The decision is recorded; this demonstration executes no external action."
      }
    ],
    final: {
      status: statusByDecision[humanDecision],
      humanDecision,
      recommendation: "Keep remote writes disabled by default.",
      externalActionsExecuted: false
    }
  };
}

function parseArguments(argv) {
  let json = false;
  const decisionArguments = [];

  for (const argument of argv) {
    if (argument === "--json") {
      if (json) throw new Error("--json may be provided only once.");
      json = true;
    } else if (argument.startsWith("--decision=")) {
      decisionArguments.push(argument.slice("--decision=".length));
    } else {
      throw new Error(`Unknown argument: ${argument}`);
    }
  }

  if (decisionArguments.length > 1) {
    throw new Error("--decision may be provided only once.");
  }
  return { json, humanDecision: decisionArguments[0] ?? "reject" };
}

function printReadable(trace) {
  console.log(trace.label);
  console.log(`Request: ${trace.requestId}`);
  for (const event of trace.events) {
    console.log(`${event.sequence}. ${event.stage}: ${event.result}`);
  }
  console.log(`Final: ${trace.final.status}; external actions executed: ${trace.final.externalActionsExecuted}`);
}

async function main() {
  const { json, humanDecision } = parseArguments(process.argv.slice(2));
  const inputs = await loadDemoInputs();
  const trace = buildTrace({ ...inputs, humanDecision });

  if (json) {
    process.stdout.write(`${JSON.stringify(trace, null, 2)}\n`);
  } else {
    printReadable(trace);
  }
}

const entryPath = process.argv[1] ? pathToFileURL(resolve(process.argv[1])).href : "";
if (import.meta.url === entryPath) {
  main().catch((error) => {
    console.error(`Demo failed: ${error.message}`);
    process.exitCode = 1;
  });
}
