import { readFileSync } from "node:fs";
import { isAbsolute, resolve } from "node:path";

import { runMcpStdioDemo } from "@agentshield/mcp-adapter";

import type { CliResult } from "../cli.js";
import { writeEvidenceFile } from "./evidenceFile.js";
import { loadRegistry } from "./registryLoader.js";

type StdioDemoFormat = "text" | "json";

function argValue(args: string[], name: string): string | undefined {
  const index = args.indexOf(name);
  return index === -1 ? undefined : args[index + 1];
}

function parseFormat(args: string[]): StdioDemoFormat {
  const index = args.indexOf("--format");
  if (index === -1) return "text";
  const value = args[index + 1];
  if (value !== "json") throw new Error("mcp-stdio-demo --format must be json");
  return value;
}

function readPolicy(args: string[], cwd: string): unknown | undefined {
  const policyPath = argValue(args, "--policy");
  if (policyPath === undefined) return undefined;
  if (policyPath.startsWith("--")) throw new Error("mcp-stdio-demo --policy requires a file path");
  const resolved = isAbsolute(policyPath) ? policyPath : resolve(cwd, policyPath);
  return JSON.parse(readFileSync(resolved, "utf8")) as unknown;
}

export function runMcpStdioDemoCommand(args: string[], cwd = process.cwd()): CliResult {
  const format = parseFormat(args);
  const evidencePath = argValue(args, "--evidence");
  if (evidencePath !== undefined && evidencePath.startsWith("--")) {
    throw new Error("mcp-stdio-demo --evidence requires a file path");
  }

  const registryPath = argValue(args, "--registry");
  if (registryPath !== undefined && registryPath.startsWith("--")) {
    throw new Error("mcp-stdio-demo --registry requires a file path");
  }
  const registry = registryPath === undefined ? undefined : loadRegistry(registryPath, cwd);
  if (registry?.ok === false) {
    return { exitCode: 1, stdout: "", stderr: `invalid registry: ${registry.error}` };
  }

  const run = runMcpStdioDemo({
    policy: readPolicy(args, cwd),
    ...(registry?.ok === true ? { toolRegistry: registry.toolRegistry } : {}),
    includeEvidenceBundle: evidencePath !== undefined
  });

  if (evidencePath !== undefined && run.evidenceBundle !== undefined) {
    const write = writeEvidenceFile({
      evidencePath,
      bundle: run.evidenceBundle,
      cwd,
      force: args.includes("--force")
    });

    if (!write.ok) {
      return { exitCode: 1, stdout: "", stderr: `failed to write stdio evidence: ${write.error}` };
    }
  }

  if (format === "json") {
    const { evidenceBundle: _evidenceBundle, ...jsonRun } = run;
    return { exitCode: run.failed === 0 ? 0 : 1, stdout: JSON.stringify(jsonRun, null, 2), stderr: "" };
  }

  const stdout = [
    ...run.results.flatMap((result) => [
      `Scenario: ${result.scenario}`,
      `Expected: ${result.expected}`,
      `Status: ${result.status}`,
      `Forwarded: ${result.forwarded ? "yes" : "no"}`,
      ...(result.sandboxProfileId === undefined ? [] : [`Sandbox: ${result.sandboxProfileId}`]),
      ...(result.evidenceRootHash === undefined ? [] : [`Evidence Root: ${result.evidenceRootHash}`]),
      ""
    ]),
    `Process lifecycle events: ${run.processLifecycleEvents}`
  ].join("\n").trim();

  return { exitCode: run.failed === 0 ? 0 : 1, stdout, stderr: "" };
}
