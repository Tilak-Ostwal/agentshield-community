import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import type { CliResult } from "../cli.js";
import { normalizeProviderToolCall, processProviderToolCall } from "@agentshield/sdk";

// Mock policy for demo
const mockPolicy = {
  version: 2,
  name: "test",
  rules: [
    {
      id: "deny-net",
      effect: "deny",
      priority: 10,
      match: { toolName: "network.post" }
    },
    {
      id: "allow-fs",
      effect: "allow",
      priority: 10,
      match: { toolName: "filesystem.read" }
    }
  ],
  defaultDecision: "deny",
  mode: "strict"
};

export function runProviderAdapterCommand(args: string[], cwd: string): CliResult {
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

  if (subcommand === "normalize") {
    const res = normalizeProviderToolCall(input);
    if (!res.valid) {
      if (format === "json") return { exitCode: 1, stdout: JSON.stringify({ valid: false, error: res.error }, null, 2), stderr: "" };
      return { exitCode: 1, stdout: "", stderr: "Normalization failed: " + res.error };
    }
    
    if (format === "json") return { exitCode: 0, stdout: JSON.stringify(res.normalized, null, 2), stderr: "" };
    
    return { exitCode: 0, stdout: `Normalized Tool Call:\nProvider: ${res.normalized?.provider}\nTool: ${res.normalized?.toolName}\n`, stderr: "" };
  }

  if (subcommand === "demo") {
    const res = processProviderToolCall(input, mockPolicy);
    if (!res.valid) {
      if (format === "json") return { exitCode: 1, stdout: JSON.stringify({ valid: false, error: res.error }, null, 2), stderr: "" };
      return { exitCode: 1, stdout: "", stderr: "Demo failed: " + res.error };
    }
    
    if (format === "json") return { exitCode: 0, stdout: JSON.stringify(res.result, null, 2), stderr: "" };
    
    let out = `Provider Adapter Demo\n`;
    out += `Tool: ${res.result?.toolName}\n`;
    out += `Decision: ${res.result?.decision.toUpperCase()}\n`;
    out += `Executed: ${res.result?.executed}\n`;
    out += `Reason: ${res.result?.reason}\n`;
    
    return { exitCode: 0, stdout: out, stderr: "" };
  }

  return { exitCode: 1, stdout: "", stderr: "Usage: agentshield provider-adapter normalize|demo <file.json>" };
}
