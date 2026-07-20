import { createAgentShield } from "@agentshield/sdk";

import type { CliResult } from "../cli.js";

type SdkDemoFormat = "text" | "json";

function parseFormat(args: string[]): SdkDemoFormat {
  const index = args.indexOf("--format");
  if (index === -1) return "text";
  const value = args[index + 1];
  if (value !== "json") throw new Error("sdk demo --format must be json");
  return value;
}

export function runSdkDemoCommand(args: string[], cwd = process.cwd()): CliResult {
  const format = parseFormat(args);
  const shield = createAgentShield({
    policyPath: "examples/policies/strict.policy.json",
    registryPath: "examples/registry/agentshield.registry.json",
    cwd,
    evidence: true,
    execution: true,
    sandbox: true
  });
  const check = shield.checkAction({
    actionId: "sdk_read_1",
    timestamp: "2026-06-28T00:00:00.000Z",
    actionType: "tool_call",
    toolName: "filesystem.read",
    input: { path: "/mock/project/README.md" }
  });
  const mcp = shield.processMcpToolCall({
    jsonrpc: "2.0",
    id: "sdk_mcp_read",
    method: "tools/call",
    params: { name: "filesystem.read", arguments: { path: "/mock/project/README.md" } }
  });
  const evidence = shield.exportEvidenceBundle();
  const verification = evidence === undefined ? undefined : shield.verifyEvidence(evidence);
  const run = { check, mcp, evidenceValid: verification?.valid ?? false };

  if (format === "json") {
    return { exitCode: check.ok && mcp.ok && run.evidenceValid ? 0 : 1, stdout: JSON.stringify(run, null, 2), stderr: "" };
  }

  return {
    exitCode: check.ok && mcp.ok && run.evidenceValid ? 0 : 1,
    stdout: [
      "AgentShield SDK Demo",
      `checkAction decision: ${check.decision}`,
      `processMcpToolCall forwarded: ${mcp.forwarded ? "yes" : "no"}`,
      `evidence valid: ${run.evidenceValid ? "yes" : "no"}`
    ].join("\n"),
    stderr: ""
  };
}
