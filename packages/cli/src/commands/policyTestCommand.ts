import { writeFileSync } from "node:fs";
import { isAbsolute, resolve } from "node:path";

import {
  generatePolicyTestJsonReport,
  generatePolicyTestMarkdownReport,
  generatePolicyTestSnapshot,
  generatePolicyTestTextReport,
  runPolicyTestPath
} from "@agentshield/bench";

import type { CliResult } from "../cli.js";

type PolicyTestFormat = "text" | "json" | "markdown";

function argValue(args: string[], name: string): string | undefined {
  const index = args.indexOf(name);
  return index === -1 ? undefined : args[index + 1];
}

function parseFormat(args: string[]): PolicyTestFormat {
  const value = argValue(args, "--format");
  if (value === undefined) return "text";
  if (value === "json" || value === "markdown") return value;
  throw new Error("policy-test --format must be json or markdown");
}

function writeOutput(path: string, content: string, cwd: string): void {
  const resolved = isAbsolute(path) ? path : resolve(cwd, path);
  writeFileSync(resolved, `${content}\n`, { encoding: "utf8", flag: "wx" });
}

export function runPolicyTestCommand(args: string[], cwd = process.cwd()): CliResult {
  const testPath = args[0];
  if (testPath === undefined || testPath.startsWith("--")) {
    return { exitCode: 1, stdout: "", stderr: "policy-test requires a policy test JSON file" };
  }

  const format = parseFormat(args);
  const outPath = argValue(args, "--out");
  const snapshotPath = argValue(args, "--snapshot");
  if (args.includes("--out") && (outPath === undefined || outPath.startsWith("--"))) {
    return { exitCode: 1, stdout: "", stderr: "policy-test --out requires a file path" };
  }
  if (args.includes("--snapshot") && (snapshotPath === undefined || snapshotPath.startsWith("--"))) {
    return { exitCode: 1, stdout: "", stderr: "policy-test --snapshot requires a file path" };
  }

  const result = runPolicyTestPath(testPath, cwd);
  const output =
    format === "json" ? generatePolicyTestJsonReport(result) :
    format === "markdown" ? generatePolicyTestMarkdownReport(result) :
    generatePolicyTestTextReport(result);

  try {
    if (snapshotPath !== undefined) {
      writeOutput(snapshotPath, generatePolicyTestSnapshot(result), cwd);
    }
    if (outPath !== undefined) {
      writeOutput(outPath, output, cwd);
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "unknown write error";
    return { exitCode: 1, stdout: "", stderr: `failed to write policy test output: ${message}` };
  }

  return {
    exitCode: result.failed === 0 ? 0 : 1,
    stdout: outPath === undefined ? output : `wrote policy test report to ${outPath}`,
    stderr: ""
  };
}
