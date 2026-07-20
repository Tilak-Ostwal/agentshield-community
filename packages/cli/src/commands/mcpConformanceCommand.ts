import { readFileSync, writeFileSync } from "node:fs";
import { isAbsolute, resolve } from "node:path";

import {
  generateCompatibilityMarkdown,
  generateCompatibilityText,
  runConformanceFixtures
} from "@agentshield/mcp-adapter";

import type { CliResult } from "../cli.js";
import { loadRegistry } from "./registryLoader.js";

type McpConformanceFormat = "text" | "json" | "markdown";

function argValue(args: string[], name: string): string | undefined {
  const index = args.indexOf(name);
  return index === -1 ? undefined : args[index + 1];
}

function parseFormat(args: string[]): McpConformanceFormat {
  const value = argValue(args, "--format");
  if (value === undefined) return "text";
  if (value === "json" || value === "markdown") return value;
  throw new Error("mcp-conformance --format must be json or markdown");
}

function readPolicy(args: string[], cwd: string): unknown | undefined {
  const policyPath = argValue(args, "--policy");
  if (policyPath === undefined) return undefined;
  if (policyPath.startsWith("--")) throw new Error("mcp-conformance --policy requires a file path");
  const resolved = isAbsolute(policyPath) ? policyPath : resolve(cwd, policyPath);
  return JSON.parse(readFileSync(resolved, "utf8")) as unknown;
}

export function runMcpConformanceCommand(args: string[], cwd = process.cwd()): CliResult {
  const format = parseFormat(args);
  const outPath = argValue(args, "--out");
  if (outPath !== undefined && outPath.startsWith("--")) {
    throw new Error("mcp-conformance --out requires a file path");
  }

  const registryPath = argValue(args, "--registry");
  if (registryPath !== undefined && registryPath.startsWith("--")) {
    throw new Error("mcp-conformance --registry requires a file path");
  }
  const registry = registryPath === undefined ? undefined : loadRegistry(registryPath, cwd);
  if (registry?.ok === false) {
    return { exitCode: 1, stdout: "", stderr: `invalid registry: ${registry.error}` };
  }
  const report = runConformanceFixtures(undefined, {
    policy: readPolicy(args, cwd),
    ...(registry?.ok === true ? { toolRegistry: registry.toolRegistry } : {})
  });
  const output =
    format === "json" ? JSON.stringify(report, null, 2) :
    format === "markdown" ? generateCompatibilityMarkdown(report) :
    generateCompatibilityText(report);

  if (outPath !== undefined) {
    const resolved = isAbsolute(outPath) ? outPath : resolve(cwd, outPath);
    writeFileSync(resolved, output, { encoding: "utf8", flag: args.includes("--force") ? "w" : "wx" });
    return { exitCode: report.failed === 0 ? 0 : 1, stdout: `wrote MCP conformance report to ${outPath}`, stderr: "" };
  }

  return { exitCode: report.failed === 0 ? 0 : 1, stdout: output, stderr: "" };
}
