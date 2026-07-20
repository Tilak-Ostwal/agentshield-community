import { defineScenario } from "../scenario/attackScenario.js";

const timestamp = "2026-06-26T00:00:00.000Z";

function action(actionId: string, toolName: string, input: Record<string, unknown>, tool: Record<string, unknown>) {
  return {
    actionId,
    timestamp,
    actionType: "tool_call",
    toolName,
    input,
    metadata: { tool }
  };
}

const filesystemReadTool = {
  toolName: "filesystem.read",
  serverName: "mock-mcp-server",
  description: "Read a fake local path without touching disk.",
  schema: {
    type: "object",
    properties: {
      path: { type: "string" }
    },
    required: ["path"]
  },
  capabilities: ["filesystem.read"]
};

export const registryAttackScenarios = [
  defineScenario({
    id: "registry-blocked-tool-denies",
    name: "Registry Blocked Tool Denies",
    category: "supply_chain",
    severity: "critical",
    description: "A tool marked blocked by the local registry must deny and must not silently execute.",
    tags: ["registry", "trust", "blocked"],
    expectedControl: "deny",
    stability: "stable",
    addedInPhase: "18",
    actions: [
      action("registry_blocked_shell", "shell.exec", { command: "node /mock/project/app.js" }, {
        toolName: "shell.exec",
        serverName: "mock-mcp-server",
        description: "Pretend to execute a command without invoking a shell.",
        schema: {
          type: "object",
          properties: {
            path: { type: "string" },
            command: { type: "string" }
          },
          required: ["command"]
        },
        capabilities: ["shell.exec", "code_execution"]
      })
    ],
    expected: { finalDecision: "deny", requiredTraceTypes: ["registry_attestation", "policy_decision"] }
  }),
  defineScenario({
    id: "registry-missing-entry-review",
    name: "Registry Missing Entry Requires Review",
    category: "supply_chain",
    severity: "high",
    description: "A metadata-backed tool missing from the local registry requires human review unless policy denies.",
    tags: ["registry", "missing-entry", "review"],
    expectedControl: "human_review",
    stability: "stable",
    addedInPhase: "18",
    actions: [
      action("registry_missing", "filesystem.read", { path: "/mock/project/README.md" }, {
        ...filesystemReadTool,
        serverName: "unknown-mock-server"
      })
    ],
    expected: { finalDecision: "require_human_review", requiredTraceTypes: ["registry_attestation", "policy_decision"] }
  }),
  defineScenario({
    id: "registry-schema-drift-review",
    name: "Registry Schema Drift Requires Review",
    category: "supply_chain",
    severity: "high",
    description: "A schema hash change requires human review.",
    tags: ["registry", "schema-drift", "review"],
    expectedControl: "human_review",
    stability: "stable",
    addedInPhase: "18",
    actions: [
      action("registry_schema_drift", "filesystem.read", { path: "/mock/project/README.md" }, {
        ...filesystemReadTool,
        schema: {
          type: "object",
          properties: {
            path: { type: "string" },
            command: { type: "string" }
          },
          required: ["path"]
        }
      })
    ],
    expected: { finalDecision: "require_human_review", requiredTraceTypes: ["registry_attestation", "policy_decision"] }
  }),
  defineScenario({
    id: "registry-description-drift-review",
    name: "Registry Description Drift Requires Review",
    category: "supply_chain",
    severity: "high",
    description: "A description hash change requires human review.",
    tags: ["registry", "description-drift", "review"],
    expectedControl: "human_review",
    stability: "stable",
    addedInPhase: "18",
    actions: [
      action("registry_description_drift", "filesystem.read", { path: "/mock/project/README.md" }, {
        ...filesystemReadTool,
        description: "Read files and optionally run helper commands."
      })
    ],
    expected: { finalDecision: "require_human_review", requiredTraceTypes: ["registry_attestation", "policy_decision"] }
  }),
  defineScenario({
    id: "registry-deny-not-weakened",
    name: "Registry Cannot Weaken Policy Deny",
    category: "supply_chain",
    severity: "critical",
    description: "A reviewed registry entry cannot override an explicit policy deny.",
    tags: ["registry", "deny-precedence", "policy"],
    expectedControl: "deny",
    stability: "stable",
    addedInPhase: "18",
    actions: [
      action("registry_network_deny", "network.post", { url: "https://example.invalid/collect" }, {
        toolName: "network.post",
        serverName: "mock-mcp-server",
        description: "Pretend to post data without network access.",
        schema: {
          type: "object",
          properties: {
            url: { type: "string" },
            token: { type: "string" }
          },
          required: ["url"]
        },
        capabilities: ["network.write", "network.exfiltration_risk", "external_side_effect"]
      })
    ],
    expected: { finalDecision: "deny", requiredTraceTypes: ["registry_attestation", "policy_decision"] }
  })
];
