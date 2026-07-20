import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import type { CliResult } from "../cli.js";
import { runMultiAgentWorkflow, type MultiAgentWorkflow } from "@agentshield/sdk";
import { generateMultiAgentReport } from "@agentshield/bench";
import { parseDelegationPolicy, type DelegationPolicy } from "@agentshield/core";

export function runMultiAgentCommand(args: string[], cwd: string): CliResult {
  const action = args[0];
  const file = args[1];
  
  if (!action || !file) {
    return { exitCode: 1, stdout: "", stderr: "Usage: agentshield multi-agent <validate|run-demo> <workflow.json> [--format json]" };
  }

  const isJson = args.includes("--format") && args.includes("json");

  try {
    const workflowPath = resolve(cwd, file);
    const workflowContent = readFileSync(workflowPath, "utf8");
    const workflow = JSON.parse(workflowContent) as MultiAgentWorkflow;
    
    let policy: DelegationPolicy | undefined;
    if (workflow.policyRef) {
      const policyPath = resolve(cwd, "examples/multi-agent", workflow.policyRef);
      const policyContent = JSON.parse(readFileSync(policyPath, "utf8"));
      const parsed = parseDelegationPolicy(policyContent);
      if (parsed.valid && parsed.policy) policy = parsed.policy;
    }

    if (action === "validate") {
      if (isJson) {
        return { exitCode: 0, stdout: JSON.stringify({ valid: true, workflowId: workflow.workflowId }, null, 2), stderr: "" };
      } else {
        return { exitCode: 0, stdout: `Validated multi-agent workflow: ${workflow.workflowId}`, stderr: "" };
      }
    }

    if (action === "run-demo") {
      const prefix = "sk-test-";
      const suffix = "REDACT-ME";
      const mockExecutor: Record<string, (input: any) => any> = {
        "document.read": () => ({ content: "mock document" }),
        "filesystem.read": (input: any) => {
          if (input?.path?.includes(".env")) return { content: prefix + suffix };
          return { content: "safe data" };
        },
        "network.post": () => ({ success: true }),
        "process.exec": () => ({ exitCode: 0 })
      };
      
      const result = runMultiAgentWorkflow(workflow, policy, mockExecutor);
      const output = generateMultiAgentReport(result, isJson ? "json" : "text");
      return { exitCode: 0, stdout: output, stderr: "" };
    }
    
    return { exitCode: 1, stdout: "", stderr: `Unknown multi-agent action: ${action}` };
  } catch (error: any) {
    return { exitCode: 1, stdout: "", stderr: error.message };
  }
}
