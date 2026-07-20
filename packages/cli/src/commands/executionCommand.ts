import { existsSync, writeFileSync } from "node:fs";
import { isAbsolute, resolve } from "node:path";

import { runMcpProxyDemo } from "@agentshield/mcp-adapter";

import type { CliResult } from "../cli.js";

function writeJson(path: string, value: unknown, cwd: string, force: boolean): void {
  const resolved = isAbsolute(path) ? path : resolve(cwd, path);
  if (!force && existsSync(resolved)) throw new Error(`${path} already exists; pass --force to overwrite`);
  writeFileSync(resolved, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

export function runExecutionDemoCommand(args: string[] = []): CliResult {
  const formatIndex = args.indexOf("--format");
  const format = formatIndex === -1 ? "text" : args[formatIndex + 1];
  if (format !== "text" && format !== "json") return { exitCode: 1, stdout: "", stderr: "execution demo --format must be json" };

  const run = runMcpProxyDemo({ includeExecutionLedger: true });

  if (format === "json") {
    return { exitCode: run.failed === 0 ? 0 : 1, stdout: JSON.stringify(run, null, 2), stderr: "" };
  }

  return {
    exitCode: run.failed === 0 ? 0 : 1,
    stdout: run.results
      .map((result) => [
        `Scenario: ${result.scenario}`,
        `Status: ${result.status}`,
        `Forwarded: ${result.forwarded ? "yes" : "no"}`,
        `Side Effects Observed: ${(result.sideEffectsObserved ?? []).join(", ") || "none"}`
      ].join("\n"))
      .join("\n\n"),
    stderr: ""
  };
}

export function runExecutionDryRunCommand(): CliResult {
  const run = runMcpProxyDemo({ executionDryRun: true, includeExecutionLedger: true });
  return {
    exitCode: run.failed === 0 ? 0 : 1,
    stdout: [
      "AgentShield execution dry-run",
      "No tool was forwarded.",
      ...run.results.map((result) => `${result.scenario}: forwarded=${result.forwarded ? "yes" : "no"}`)
    ].join("\n"),
    stderr: ""
  };
}

export function runExecutionCommand(args: string[], cwd: string): CliResult {
  const [subcommand, ...subArgs] = args;
  if (subcommand === "demo") return runExecutionDemoCommand(subArgs);
  if (subcommand === "dry-run") return runExecutionDryRunCommand();
  if (subcommand === "ledger-demo") {
    const outIndex = subArgs.indexOf("--out");
    const out = outIndex === -1 ? undefined : subArgs[outIndex + 1];
    if (out === undefined) return { exitCode: 1, stdout: "", stderr: "execution ledger-demo --out requires a file path" };
    const run = runMcpProxyDemo({ includeExecutionLedger: true });
    writeJson(out, run.executionLedger, cwd, subArgs.includes("--force"));
    return { exitCode: 0, stdout: `execution ledger written: ${out}`, stderr: "" };
  }
  return { exitCode: 1, stdout: "", stderr: "execution command must be demo or dry-run" };
}
