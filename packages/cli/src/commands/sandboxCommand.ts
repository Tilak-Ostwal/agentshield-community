import { evaluateSandboxDecision, inferSideEffects } from "@agentshield/core";
import type { CliResult } from "../cli.js";

const fakeSecretSentinel = ["sk", "test", "REDACT", "ME"].join("-");

function sampleActions() {
  return [
    { actionId: "read", timestamp: "2026-06-28T00:00:00.000Z", actionType: "tool_call", toolName: "filesystem.read", input: { path: "/mock/project/README.md" }, capabilities: ["filesystem.read"] },
    { actionId: "write", timestamp: "2026-06-28T00:00:00.000Z", actionType: "tool_call", toolName: "filesystem.write", input: { path: "/mock/project/out.txt" }, capabilities: ["filesystem.write"] },
    { actionId: "exec", timestamp: "2026-06-28T00:00:00.000Z", actionType: "tool_call", toolName: "shell.exec", input: { command: "mock" }, capabilities: ["shell.exec", "code_execution"] },
    { actionId: "network", timestamp: "2026-06-28T00:00:00.000Z", actionType: "tool_call", toolName: "network.post", input: { url: "https://example.invalid", token: fakeSecretSentinel }, capabilities: ["network.write"], taintLabels: ["secret"] }
  ];
}

export function runSandboxDemoCommand(args: string[] = []): CliResult {
  const formatIndex = args.indexOf("--format");
  const format = formatIndex === -1 ? "text" : args[formatIndex + 1];
  if (format !== "text" && format !== "json") return { exitCode: 1, stdout: "", stderr: "sandbox demo --format must be json" };

  const results = sampleActions().map(({ capabilities, taintLabels, ...action }) => {
    const sideEffects = inferSideEffects({ action, capabilities, ...(taintLabels === undefined ? {} : { taintLabels }) });
    const sandboxDecision = evaluateSandboxDecision({ action, capabilities, ...(taintLabels === undefined ? {} : { taintLabels }), sideEffects });
    return { actionId: action.actionId, toolName: action.toolName, sideEffects, sandboxDecision };
  });

  if (format === "json") return { exitCode: 0, stdout: JSON.stringify({ results }, null, 2), stderr: "" };

  return {
    exitCode: 0,
    stdout: results
      .map((result) => [`Action: ${result.actionId}`, `Tool: ${result.toolName}`, `Sandbox: ${result.sandboxDecision.profileId}`, `Isolation: ${result.sandboxDecision.isolationLevel}`, `Impact: ${result.sandboxDecision.decisionImpact}`].join("\n"))
      .join("\n\n"),
    stderr: ""
  };
}

export function runSandboxCommand(args: string[]): CliResult {
  const [subcommand, ...subArgs] = args;
  if (subcommand === "demo") return runSandboxDemoCommand(subArgs);
  return { exitCode: 1, stdout: "", stderr: "sandbox command must be demo" };
}
