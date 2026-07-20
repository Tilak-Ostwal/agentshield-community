import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { isAbsolute, resolve } from "node:path";

import { runMcpProxyDemo } from "@agentshield/mcp-adapter";

import type { CliResult } from "../cli.js";
import { LOCAL_DEMO_APPROVAL_KEY } from "./approvalCommand.js";
import { writeEvidenceFile } from "./evidenceFile.js";
import { loadRegistry } from "./registryLoader.js";

type ProxyDemoFormat = "text" | "json";

function parseFormat(args: string[]): ProxyDemoFormat {
  const index = args.indexOf("--format");
  if (index === -1) return "text";
  const value = args[index + 1];
  if (value !== "json") throw new Error("mcp-proxy-demo --format must be json");
  return value;
}

function argValue(args: string[], name: string): string | undefined {
  const index = args.indexOf(name);
  return index === -1 ? undefined : args[index + 1];
}

function readPolicy(args: string[], cwd: string): unknown | undefined {
  const policyPath = argValue(args, "--policy");
  if (policyPath === undefined) return undefined;
  if (policyPath.startsWith("--")) throw new Error("mcp-proxy-demo --policy requires a file path");
  const resolved = isAbsolute(policyPath) ? policyPath : resolve(cwd, policyPath);
  return JSON.parse(readFileSync(resolved, "utf8")) as unknown;
}

export function runMcpProxyDemoCommand(args: string[], cwd = process.cwd()): CliResult {
  const format = parseFormat(args);
  const evidencePath = argValue(args, "--evidence");
  const ledgerPath = argValue(args, "--execution-ledger");

  if (evidencePath !== undefined && evidencePath.startsWith("--")) {
    throw new Error("mcp-proxy-demo --evidence requires a file path");
  }
  if (ledgerPath !== undefined && ledgerPath.startsWith("--")) {
    throw new Error("mcp-proxy-demo --execution-ledger requires a file path");
  }
  const registryPath = argValue(args, "--registry");
  if (registryPath !== undefined && registryPath.startsWith("--")) {
    throw new Error("mcp-proxy-demo --registry requires a file path");
  }
  const registry = registryPath === undefined ? undefined : loadRegistry(registryPath, cwd);
  if (registry?.ok === false) {
    return { exitCode: 1, stdout: "", stderr: `invalid registry: ${registry.error}` };
  }
  const approvalTokenPath = argValue(args, "--approval-token");
  if (approvalTokenPath !== undefined && approvalTokenPath.startsWith("--")) {
    throw new Error("mcp-proxy-demo --approval-token requires a file path");
  }
  const approvalToken =
    approvalTokenPath === undefined ? undefined : JSON.parse(readFileSync(isAbsolute(approvalTokenPath) ? approvalTokenPath : resolve(cwd, approvalTokenPath), "utf8")) as unknown;

  const run = runMcpProxyDemo({
    policy: readPolicy(args, cwd),
    ...(registry?.ok === true ? { toolRegistry: registry.toolRegistry } : {}),
    ...(approvalToken === undefined ? {} : { approvalToken, approvalSigningKey: LOCAL_DEMO_APPROVAL_KEY }),
    executionDryRun: args.includes("--dry-run"),
    sandboxEnabled: args.includes("--sandbox"),
    includeEvidenceBundle: evidencePath !== undefined,
    includeExecutionLedger: ledgerPath !== undefined
  });

  if (evidencePath !== undefined && run.evidenceBundle !== undefined) {
    const write = writeEvidenceFile({
      evidencePath,
      bundle: run.evidenceBundle,
      cwd,
      force: args.includes("--force")
    });

    if (!write.ok) {
      return { exitCode: 1, stdout: "", stderr: `failed to write proxy evidence: ${write.error}` };
    }
  }

  if (ledgerPath !== undefined && run.executionLedger !== undefined) {
    try {
      const resolved = isAbsolute(ledgerPath) ? ledgerPath : resolve(cwd, ledgerPath);
      if (!args.includes("--force") && existsSync(resolved)) {
        return { exitCode: 1, stdout: "", stderr: "failed to write execution ledger: file already exists" };
      }
      writeFileSync(resolved, JSON.stringify(run.executionLedger, null, 2), {
        encoding: "utf8",
        flag: args.includes("--force") ? "w" : "wx"
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "unknown write error";
      return { exitCode: 1, stdout: "", stderr: `failed to write execution ledger: ${message}` };
    }
  }

  if (format === "json") {
    const { evidenceBundle: _evidenceBundle, ...jsonRun } = run;
    return { exitCode: run.failed === 0 ? 0 : 1, stdout: JSON.stringify(jsonRun, null, 2), stderr: "" };
  }

  const stdout = run.results
    .map((result) => [
      `Scenario: ${result.scenario}`,
      `Expected: ${result.expected}`,
      `Status: ${result.status}`,
      `Forwarded: ${result.forwarded ? "yes" : "no"}`,
      ...(result.sandboxProfileId === undefined ? [] : [`Sandbox: ${result.sandboxProfileId}`]),
      ...(result.evidenceRootHash === undefined ? [] : [`Evidence Root: ${result.evidenceRootHash}`])
    ].join("\n"))
    .join("\n\n");

  return { exitCode: run.failed === 0 ? 0 : 1, stdout, stderr: "" };
}
