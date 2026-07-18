import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import test from "node:test";
import { fileURLToPath } from "node:url";

import {
  buildTrace,
  evaluateIllustrativePath,
  loadDemoInputs,
  verificationChecks
} from "../scripts/run-demo.mjs";

const inputs = await loadDemoInputs();
const ROOT = fileURLToPath(new URL("../", import.meta.url));

test("the demonstration follows the bounded operating sequence", () => {
  const trace = buildTrace({ ...inputs, humanDecision: "reject" });

  assert.deepEqual(
    trace.events.map((event) => event.stage),
    [
      "primary",
      "scout",
      "reviewer",
      "tool-verification",
      "primary",
      "human-decision"
    ]
  );
  assert.equal(trace.events[1].bounds.canWrite, false);
  assert.equal(trace.events[1].bounds.canDelegate, false);
  assert.equal(trace.events[3].passed, true);
  assert.equal(trace.events.at(-1).actor, "human");
  assert.equal(trace.final.externalActionsExecuted, false);
});

test("all public fixture assertions pass and fail closed under mutation", () => {
  const checks = verificationChecks(inputs.config, inputs.permissions, inputs.request);
  assert.equal(checks.length, 13);
  assert.ok(checks.every((check) => check.passed));

  const mutations = [
    ["artifacts-are-synthetic-and-non-executable", (copy) => {
      copy.config.artifactType = "runtime-config";
    }],
    ["runtime-is-sanitized-and-offline", (copy) => {
      copy.config.runtime.networkAccess = "enabled";
    }],
    ["primary-is-single-writer", (copy) => {
      copy.config.routing.primary.writeMode = "multi-writer";
    }],
    ["scout-is-bounded-read-only", (copy) => {
      copy.config.routing.scout.canWrite = true;
    }],
    ["reviewer-is-independent-read-only", (copy) => {
      copy.config.routing.reviewer.tools.push("grep");
    }],
    ["pruning-is-recoverable-and-fail-fast", (copy) => {
      copy.config.contextPruning.onFailure = "continue";
    }],
    ["mcp-examples-are-disabled-and-secret-free", (copy) => {
      copy.config.mcp[0].enabled = true;
    }],
    ["remote-execution-is-disabled-and-gated", (copy) => {
      copy.config.extensions.remoteExecution.enabledByDefault = true;
    }],
    ["human-decisions-default-deny-and-single-use", (copy) => {
      copy.permissions.humanApproval.approvalIsSingleUse = false;
    }],
    ["sensitive-path-denies-override-allows", (copy) => {
      copy.permissions.rulePrecedence = "first-match";
    }],
    ["commands-are-local-only-or-denied", (copy) => {
      copy.permissions.commandRules[0].exact.push("curl https://example.invalid");
    }],
    ["unattended-actions-fail-closed", (copy) => {
      copy.permissions.unattendedMode.unknownCommands = "ask";
    }],
    ["request-is-a-fixed-no-effect-fixture", (copy) => {
      copy.request.constraints.networkAccess = true;
    }]
  ];

  for (const [id, mutate] of mutations) {
    const copy = structuredClone(inputs);
    mutate(copy);
    const check = verificationChecks(copy.config, copy.permissions, copy.request).find(
      (candidate) => candidate.id === id
    );
    assert.equal(check?.passed, false, `${id} should detect its mutation`);
    assert.throws(
      () => buildTrace({ ...copy, humanDecision: "reject" }),
      new RegExp(id)
    );
  }

  for (const mutate of [
    (copy) => copy.permissions.commandRules.push({ effect: "allow", exact: ["curl example.invalid"] }),
    (copy) => copy.config.verification.commands.push("curl example.invalid")
  ]) {
    const copy = structuredClone(inputs);
    mutate(copy);
    const check = verificationChecks(copy.config, copy.permissions, copy.request).find(
      (candidate) => candidate.id === "commands-are-local-only-or-denied"
    );
    assert.equal(check?.passed, false);
    assert.throws(
      () => buildTrace({ ...copy, humanDecision: "reject" }),
      /commands-are-local-only-or-denied/
    );
  }

  const malformedMcp = structuredClone(inputs);
  malformedMcp.config.mcp[0] = null;
  assert.doesNotThrow(() =>
    verificationChecks(malformedMcp.config, malformedMcp.permissions, malformedMcp.request)
  );
  assert.throws(
    () => buildTrace({ ...malformedMcp, humanDecision: "reject" }),
    /mcp-examples-are-disabled-and-secret-free/
  );

  assert.equal(
    evaluateIllustrativePath(inputs.permissions, "<workspace>/config/.env.demo", "read"),
    "deny"
  );
  assert.equal(
    evaluateIllustrativePath(inputs.permissions, "<workspace>/config/auth.json", "read"),
    "deny"
  );
  assert.equal(
    evaluateIllustrativePath(inputs.permissions, "<workspace>/config/public.json", "read"),
    "allow"
  );
  assert.equal(
    evaluateIllustrativePath(inputs.permissions, "<workspace>/config/public.json", "write"),
    "ask"
  );
  assert.equal(
    evaluateIllustrativePath(inputs.permissions, "<workspace>/config/../private.json", "read"),
    "deny"
  );
  assert.equal(
    evaluateIllustrativePath(inputs.permissions, "<workspace-other>/config/public.json", "read"),
    "deny"
  );
  assert.equal(evaluateIllustrativePath(inputs.permissions, null, "read"), "deny");

  const malformedPolicy = structuredClone(inputs.permissions);
  malformedPolicy.pathRules[0].patterns[0] = null;
  assert.equal(
    evaluateIllustrativePath(malformedPolicy, "<workspace>/config/public.json", "read"),
    "deny"
  );
});

test("human decisions record intent but never perform a remote action", () => {
  for (const [decision, status] of [
    ["approve", "approved-for-design-only"],
    ["defer", "deferred-by-human"]
  ]) {
    const trace = buildTrace({ ...inputs, humanDecision: decision });
    assert.equal(trace.final.status, status);
    assert.equal(trace.final.externalActionsExecuted, false);
  }
});

test("unknown decisions fail closed", () => {
  assert.throws(
    () => buildTrace({ ...inputs, humanDecision: "auto-approve" }),
    /Decision must be one of/
  );
});

test("unknown or duplicate CLI arguments fail closed", () => {
  for (const args of [
    ["scripts/run-demo.mjs", "--unknown"],
    ["scripts/run-demo.mjs", "--decision=reject", "--decision=approve"],
    ["scripts/run-demo.mjs", "--json", "--json"]
  ]) {
    const result = spawnSync(process.execPath, args, {
      cwd: ROOT,
      encoding: "utf8",
      shell: false
    });
    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /Demo failed:/);
  }
});
