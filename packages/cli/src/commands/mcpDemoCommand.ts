import { runMcpDemo } from "@agentshield/mcp-adapter";

import type { CliResult } from "../cli.js";

export type McpDemoFormat = "text" | "json";

function parseMcpDemoFormat(args: string[]): McpDemoFormat {
  const formatIndex = args.indexOf("--format");

  if (formatIndex === -1) {
    return "text";
  }

  const value = args[formatIndex + 1];

  if (value !== "json") {
    throw new Error("mcp-demo --format must be json");
  }

  return value;
}

export function runMcpDemoCommand(args: string[]): CliResult {
  return {
    exitCode: 0,
    stdout: runMcpDemo(parseMcpDemoFormat(args)),
    stderr: ""
  };
}
