import { isAbsolute, resolve } from "node:path";

import { validateWorkspaceConfigFile, type WorkspaceValidationFinding } from "@agentshield/core";

import type { CliResult } from "../cli.js";
import { initWorkspaceConfig } from "./workspaceInit.js";
import { runWorkspaceDoctor, type WorkspaceDoctorReport } from "./workspaceDoctor.js";

function argValue(args: string[], name: string): string | undefined {
  const index = args.indexOf(name);
  return index === -1 ? undefined : args[index + 1];
}

function resolveFromCwd(cwd: string, path: string): string {
  return isAbsolute(path) ? path : resolve(cwd, path);
}

function parseFormat(args: string[], command: string): "text" | "json" {
  const value = argValue(args, "--format");
  if (value === undefined) return "text";
  if (value === "json") return "json";
  throw new Error(`${command} --format must be json`);
}

function formatFindings(findings: WorkspaceValidationFinding[]): string[] {
  if (findings.length === 0) return ["Findings: none"];
  return findings.map((finding) => `${finding.severity.toUpperCase()} ${finding.id}: ${finding.message} Recommendation: ${finding.recommendation}`);
}

function formatValidationText(ok: boolean, findings: WorkspaceValidationFinding[]): string {
  return [`AgentShield workspace validation: ${ok ? "PASS" : "FAIL"}`, ...formatFindings(findings)].join("\n");
}

function formatDoctorText(report: WorkspaceDoctorReport): string {
  const failed = report.checks.filter((check) => check.status === "fail");
  const summary = `AgentShield workspace doctor: ${report.ok ? "PASS" : "FAIL"} (${report.checks.length - failed.length}/${report.checks.length} checks passing)`;
  if (failed.length === 0 && report.validationFindings.length === 0) return summary;
  return [summary, ...formatFindings(report.validationFindings), ...failed.map((check) => `FAIL ${check.id}: ${check.message}`)].join("\n");
}

export function runWorkspaceCommand(args: string[], cwd = process.cwd()): CliResult {
  const [command, ...commandArgs] = args;

  if (command === "init") {
    const out = argValue(commandArgs, "--out") ?? "agentshield.workspace.json";
    const result = initWorkspaceConfig(out, { cwd, force: commandArgs.includes("--force") });
    return result.ok
      ? { exitCode: 0, stdout: `created ${out}`, stderr: "" }
      : { exitCode: 1, stdout: "", stderr: result.error ?? "failed to create workspace config" };
  }

  if (command === "validate") {
    const configPath = commandArgs[0];
    if (configPath === undefined || configPath.startsWith("--")) {
      return { exitCode: 1, stdout: "", stderr: "usage: agentshield workspace validate <agentshield.workspace.json>" };
    }

    const result = validateWorkspaceConfigFile(resolveFromCwd(cwd, configPath), cwd);
    return {
      exitCode: result.ok ? 0 : 1,
      stdout: formatValidationText(result.ok, result.findings),
      stderr: ""
    };
  }

  if (command === "doctor") {
    const configPath = commandArgs[0];
    if (configPath === undefined || configPath.startsWith("--")) {
      return { exitCode: 1, stdout: "", stderr: "usage: agentshield workspace doctor <agentshield.workspace.json> [--format json]" };
    }

    const format = parseFormat(commandArgs, "workspace doctor");
    const report = runWorkspaceDoctor(configPath, cwd);
    return {
      exitCode: report.ok ? 0 : 1,
      stdout: format === "json" ? JSON.stringify(report, null, 2) : formatDoctorText(report),
      stderr: ""
    };
  }

  return {
    exitCode: 1,
    stdout: "",
    stderr: "workspace command must be init, validate, or doctor"
  };
}
