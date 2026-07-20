import { StringEnum } from "@earendil-works/pi-ai";
import { Type } from "typebox";

export const OPTIONAL_TOOL_GROUPS = Object.freeze({
  web: ["web_search", "fetch_content", "get_search_content"],
  subagents: ["subagent", "wait", "subagent_supervisor", "intercom"],
  shell: ["interactive_shell"],
  mcp: ["mcp", "context7_resolve-library-id"]
});

const OPTIONAL_TOOLS = new Set(Object.values(OPTIONAL_TOOL_GROUPS).flat());
const LOAD_TOOL = "load_tools";

export function selectTools(configuredTools, activeTools, group) {
  const configured = new Set(configuredTools);
  if (group === "lean") return [...configured].filter((name) => !OPTIONAL_TOOLS.has(name));
  if (group === "full") return [...configured];

  const selected = new Set(activeTools);
  for (const name of OPTIONAL_TOOL_GROUPS[group] ?? []) {
    if (configured.has(name)) selected.add(name);
  }
  return [...selected];
}

function toolName(tool) {
  return tool?.name ?? tool?.function?.name;
}

export function filterPayloadTools(payload, selectedTools) {
  if (!Array.isArray(payload?.tools)) return payload;
  const selected = new Set(selectedTools);
  let changed = false;
  const tools = payload.tools.flatMap((tool) => {
    const name = toolName(tool);
    if (name) {
      if (selected.has(name)) return [tool];
      changed = true;
      return [];
    }
    if (!Array.isArray(tool?.functionDeclarations)) return [tool];

    const functionDeclarations = tool.functionDeclarations.filter((entry) => selected.has(entry?.name));
    changed ||= functionDeclarations.length !== tool.functionDeclarations.length;
    return functionDeclarations.length > 0 ? [{ ...tool, functionDeclarations }] : [];
  });
  return changed ? { ...payload, tools } : payload;
}

export default function leanTools(pi) {
  let configuredTools = [];
  let selectedTools = [];
  let toolMode = "lean";

  const apply = (group) => {
    selectedTools = selectTools(configuredTools, selectedTools, group);
    toolMode = group;
    pi.setActiveTools(selectedTools);
    return selectedTools;
  };

  pi.registerTool({
    name: LOAD_TOOL,
    label: "Load Optional Tools",
    description: "Enable optional tools: web, subagents, shell, mcp, full, or lean.",
    promptSnippet: "Enable optional web, subagent, interactive-shell, or MCP tools when needed",
    promptGuidelines: [
      "Call load_tools before work requiring optional web, subagent, interactive-shell, or MCP capabilities."
    ],
    parameters: Type.Object({
      group: StringEnum(["web", "subagents", "shell", "mcp", "full", "lean"])
    }),
    async execute(_id, { group }) {
      const selected = apply(group);
      return {
        content: [{ type: "text", text: `${group} tools enabled. Active: ${selected.join(", ")}` }],
        details: { group, activeTools: selected }
      };
    }
  });

  pi.registerCommand("crab-tools", {
    description: "Set optional tool mode: lean, web, subagents, shell, mcp, or full",
    handler: async (args, ctx) => {
      const group = String(args || "").trim().toLowerCase();
      if (!["web", "subagents", "shell", "mcp", "full", "lean"].includes(group)) {
        ctx.ui.notify("Usage: /crab-tools lean|web|subagents|shell|mcp|full", "warning");
        return;
      }
      const selected = apply(group);
      ctx.ui.notify(`Crab tools: ${group} (${selected.length} active)`, "info");
    }
  });

  pi.on("session_start", () => {
    toolMode = String(process.env.CRAB_TOOL_MODE || "lean").toLowerCase();
    configuredTools = pi.getAllTools().map((tool) => tool.name);
    selectedTools = toolMode === "full" || toolMode === "manual"
      ? pi.getActiveTools()
      : selectTools(configuredTools, configuredTools, "lean");
    if (toolMode !== "full" && toolMode !== "manual") pi.setActiveTools(selectedTools);
  });

  pi.on("before_provider_request", (event) => {
    if (toolMode === "full" || toolMode === "manual") return;

    const configured = new Set(configuredTools);
    const addedTools = pi.getAllTools().map((tool) => tool.name).filter((name) => !configured.has(name));
    if (addedTools.length > 0) {
      configuredTools.push(...addedTools);
      selectedTools = [...new Set([...selectedTools, ...addedTools])];
      pi.setActiveTools(selectedTools);
    }
    return filterPayloadTools(event.payload, selectedTools);
  });
}
