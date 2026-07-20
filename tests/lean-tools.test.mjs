import assert from "node:assert/strict";
import test from "node:test";

import { filterPayloadTools, selectTools } from "../runtime/lean-tools.mjs";

const configured = [
  "read",
  "bash",
  "context_prune",
  "load_tools",
  "web_search",
  "fetch_content",
  "subagent",
  "interactive_shell",
  "mcp",
  "project_tool"
];

test("lean tool mode progressively discloses optional tools", () => {
  const lean = selectTools(configured, configured, "lean");
  assert.deepEqual(lean, ["read", "bash", "context_prune", "load_tools", "project_tool"]);

  const web = selectTools(configured, lean, "web");
  assert.deepEqual(web, [
    "read",
    "bash",
    "context_prune",
    "load_tools",
    "project_tool",
    "web_search",
    "fetch_content"
  ]);

  assert.deepEqual(selectTools(configured, web, "full"), configured);
});

test("lean tool mode filters OpenAI and Google provider payloads", () => {
  const openai = {
    tools: [
      { type: "function", name: "read" },
      { type: "function", name: "web_search" }
    ]
  };
  assert.deepEqual(filterPayloadTools(openai, ["read"]), {
    tools: [{ type: "function", name: "read" }]
  });

  const google = {
    tools: [{ functionDeclarations: [{ name: "read" }, { name: "web_search" }] }]
  };
  assert.deepEqual(filterPayloadTools(google, ["read"]), {
    tools: [{ functionDeclarations: [{ name: "read" }] }]
  });
});
