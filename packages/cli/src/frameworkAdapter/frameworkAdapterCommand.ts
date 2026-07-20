import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import type { CliResult } from "../cli.js";
import { parseFrameworkToolRegistry, parseFrameworkWorkflow, runFrameworkWorkflow } from "@agentshield/sdk";
const safeMockExecutor = {
  "document.read": () => ({ content: "mock document content" }),
  "filesystem.read": (input: any) => {
    if (input?.path?.includes(".env")) return { content: ["sk", "test", "REDACT", "ME"].join("-") };
    return { content: "mock file content" };
  },
  "network.post": () => ({ success: true }),
  "filesystem.write": () => ({ success: true }),
  "system.exec": () => ({ exitCode: 0 })
};

const mockPolicy = {
  version: 2,
  name: "framework-adapter-demo-policy",
  rules: [
    { id: "allow-fs-read", effect: "allow", priority: 10, match: { toolName: "filesystem.read" } },
    { id: "allow-doc-read", effect: "allow", priority: 10, match: { toolName: "document.read" } },
    { id: "deny-net-secret", effect: "deny", priority: 100, match: { toolName: "network.post", taintAny: ["secret"] } },
    { id: "allow-net", effect: "allow", priority: 10, match: { toolName: "network.post" } },
    { id: "review-exec", effect: "require_human_review", priority: 10, match: { toolName: "system.exec" }, requireApproval: { reason: "demo" } },
    { id: "allow-fs-write", effect: "allow", priority: 10, match: { toolName: "filesystem.write" } }
  ],
  defaultDecision: "deny",
  mode: "strict"
};

export function runFrameworkAdapterCommand(args: string[], cwd: string): CliResult {
  const [subcommand, file, ...flags] = args;
  const formatIndex = flags.indexOf("--format");
  const format = formatIndex >= 0 ? flags[formatIndex + 1] : "text";

  if (!file) return { exitCode: 1, stdout: "", stderr: "Must specify a file" };

  let input: any;
  try {
    input = JSON.parse(readFileSync(resolve(cwd, file), "utf-8"));
  } catch {
    return { exitCode: 1, stdout: "", stderr: "Failed to read input file." };
  }

  if (subcommand === "wrap") {
    try {
      const registry = parseFrameworkToolRegistry(input);
      if (format === "json") return { exitCode: 0, stdout: JSON.stringify({ valid: true, tools: registry.length }, null, 2), stderr: "" };
      return { exitCode: 0, stdout: `Framework Tool Registry Validated\nTools found: ${registry.length}\n`, stderr: "" };
    } catch (e: any) {
      if (format === "json") return { exitCode: 1, stdout: JSON.stringify({ valid: false, error: e.message }, null, 2), stderr: "" };
      return { exitCode: 1, stdout: "", stderr: "Invalid registry: " + e.message };
    }
  }

  if (subcommand === "run-demo") {
    try {
      const workflow = parseFrameworkWorkflow(input);
      const res = runFrameworkWorkflow(workflow, mockPolicy, safeMockExecutor);
      
      if (format === "json") return { exitCode: 0, stdout: JSON.stringify(res, null, 2), stderr: "" };

      let out = `Framework Adapter Workflow Demo: ${workflow.name}\n`;
      out += `Final Decision: ${res.finalDecision.toUpperCase()}\n`;
      out += `Steps:\n`;
      for (const step of res.steps) {
        out += `  - ${step.runnableId} (${step.toolName}): ${step.decision.toUpperCase()} (Executed: ${step.executed})\n`;
      }
      out += `Attack Graph: ${res.attackGraphPatterns.join(", ") || "None"}\n`;
      out += `Evidence Hash: ${res.evidenceRootHash}\n`;

      return { exitCode: 0, stdout: out, stderr: "" };
    } catch (e: any) {
      if (format === "json") return { exitCode: 1, stdout: JSON.stringify({ valid: false, error: e.message }, null, 2), stderr: "" };
      return { exitCode: 1, stdout: "", stderr: "Invalid workflow: " + e.message };
    }
  }

  return { exitCode: 1, stdout: "", stderr: "Usage: agentshield framework-adapter wrap|run-demo <file.json>" };
}
