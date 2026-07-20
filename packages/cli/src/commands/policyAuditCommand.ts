import { writeFileSync } from "node:fs";
import { isAbsolute, resolve } from "node:path";

import {
  generatePolicyAuditJsonReport,
  generatePolicyAuditMarkdownReport,
  generatePolicyAuditTextReport,
  runPolicyAudit
} from "@agentshield/bench";

import type { CliResult } from "../cli.js";

type PolicyAuditFormat = "text" | "json" | "markdown";

function argValue(args: string[], name: string): string | undefined {
  const index = args.indexOf(name);
  return index === -1 ? undefined : args[index + 1];
}

function parseFormat(args: string[]): PolicyAuditFormat {
  const value = argValue(args, "--format");
  if (value === undefined) return "text";
  if (value === "json" || value === "markdown") return value;
  throw new Error("policy-audit --format must be json or markdown");
}

function writeOutput(path: string, content: string, cwd: string): void {
  const resolved = isAbsolute(path) ? path : resolve(cwd, path);
  writeFileSync(resolved, `${content}\n`, { encoding: "utf8", flag: "wx" });
}

export function runPolicyAuditCommand(args: string[], cwd = process.cwd()): CliResult {
  const policyPath = args[0];
  if (policyPath === undefined || policyPath.startsWith("--")) {
    return { exitCode: 1, stdout: "", stderr: "policy-audit requires a policy JSON file" };
  }

  const format = parseFormat(args);
  const registryPath = argValue(args, "--registry");
  const outPath = argValue(args, "--out");
  if (args.includes("--registry") && (registryPath === undefined || registryPath.startsWith("--"))) {
    return { exitCode: 1, stdout: "", stderr: "policy-audit --registry requires a registry JSON file" };
  }
  if (args.includes("--out") && (outPath === undefined || outPath.startsWith("--"))) {
    return { exitCode: 1, stdout: "", stderr: "policy-audit --out requires a file path" };
  }

  const result = runPolicyAudit(policyPath, registryPath === undefined ? {} : { registryPath }, cwd);
  const output =
    format === "json" ? generatePolicyAuditJsonReport(result) :
    format === "markdown" ? generatePolicyAuditMarkdownReport(result) :
    generatePolicyAuditTextReport(result);

  if (outPath !== undefined) {
    try {
      writeOutput(outPath, output, cwd);
    } catch (error) {
      const message = error instanceof Error ? error.message : "unknown write error";
      return { exitCode: 1, stdout: "", stderr: `failed to write policy audit output: ${message}` };
    }
    return { exitCode: result.summary.passed ? 0 : 1, stdout: `wrote policy audit report to ${outPath}`, stderr: "" };
  }

  return { exitCode: result.summary.passed ? 0 : 1, stdout: output, stderr: "" };
}
