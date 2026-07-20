import { existsSync, writeFileSync } from "node:fs";
import { isAbsolute, relative, resolve } from "node:path";

import {
  auditPolicyPack,
  generatePolicyPackAuditText,
  generatePolicyPackJson,
  generatePolicyPackListText,
  generatePolicyPackShowText,
  getPolicyPack,
  listPolicyPacks,
  renderPolicyPack,
  renderPolicyPackJson,
  validatePolicyPackFile
} from "@agentshield/bench";

import type { CliResult } from "../cli.js";

function argValue(args: string[], name: string): string | undefined {
  const index = args.indexOf(name);
  return index === -1 ? undefined : args[index + 1];
}

function outputPath(path: string, cwd: string): string {
  const resolved = isAbsolute(path) ? resolve(path) : resolve(cwd, path);
  const relativePath = relative(cwd, resolved);
  if (relativePath.startsWith("..") || isAbsolute(relativePath)) {
    throw new Error("policy-pack output path must be inside the current workspace");
  }
  return resolved;
}

function parseJsonFormat(args: string[], command: string): "text" | "json" {
  const format = argValue(args, "--format") ?? "text";
  if (format !== "text" && format !== "json") {
    throw new Error(`${command} --format must be json`);
  }
  return format;
}

function runList(): CliResult {
  return { exitCode: 0, stdout: generatePolicyPackListText(listPolicyPacks()), stderr: "" };
}

function runShow(args: string[]): CliResult {
  const packId = args[0];
  if (packId === undefined || packId.startsWith("--")) {
    return { exitCode: 1, stdout: "", stderr: "policy-pack show requires a pack id" };
  }
  const rendered = renderPolicyPack(packId);
  const format = parseJsonFormat(args, "policy-pack show");
  return {
    exitCode: 0,
    stdout: format === "json" ? generatePolicyPackJson(rendered) : generatePolicyPackShowText(rendered),
    stderr: ""
  };
}

function runInit(args: string[], cwd: string): CliResult {
  const packId = args[0];
  if (packId === undefined || packId.startsWith("--")) {
    return { exitCode: 1, stdout: "", stderr: "policy-pack init requires a pack id" };
  }
  const outPath = argValue(args, "--out");
  if (outPath === undefined || outPath.startsWith("--")) {
    return { exitCode: 1, stdout: "", stderr: "policy-pack init requires --out <file>" };
  }

  const resolved = outputPath(outPath, cwd);
  if (existsSync(resolved) && !args.includes("--force")) {
    return { exitCode: 1, stdout: "", stderr: `refusing to overwrite existing file: ${outPath}` };
  }

  writeFileSync(resolved, `${renderPolicyPackJson(packId)}\n`, { encoding: "utf8", flag: args.includes("--force") ? "w" : "wx" });
  return { exitCode: 0, stdout: `wrote policy pack ${packId} to ${outPath}`, stderr: "" };
}

function runValidate(args: string[], cwd: string): CliResult {
  const packPath = args[0];
  if (packPath === undefined || packPath.startsWith("--")) {
    return { exitCode: 1, stdout: "", stderr: "policy-pack validate requires a pack JSON file" };
  }
  const result = validatePolicyPackFile(isAbsolute(packPath) ? packPath : resolve(cwd, packPath));
  const lines = [
    `AgentShield policy pack validation: ${result.ok ? "PASS" : "FAIL"}`,
    ...(result.findings.length === 0 ? ["Findings: none"] : result.findings.map((finding) => `${finding.severity.toUpperCase()} ${finding.id} - ${finding.message}`))
  ];
  return { exitCode: result.ok ? 0 : 1, stdout: lines.join("\n"), stderr: "" };
}

function runAudit(args: string[]): CliResult {
  const packId = args[0];
  if (packId === undefined || packId.startsWith("--")) {
    return { exitCode: 1, stdout: "", stderr: "policy-pack audit requires a pack id" };
  }
  getPolicyPack(packId);
  const result = auditPolicyPack(packId);
  const format = parseJsonFormat(args, "policy-pack audit");
  return {
    exitCode: result.ok ? 0 : 1,
    stdout: format === "json" ? generatePolicyPackJson(result) : generatePolicyPackAuditText(result),
    stderr: ""
  };
}

export function runPolicyPackCommand(args: string[], cwd = process.cwd()): CliResult {
  const [command, ...commandArgs] = args;
  if (command === "list") return runList();
  if (command === "show") return runShow(commandArgs);
  if (command === "init") return runInit(commandArgs, cwd);
  if (command === "validate") return runValidate(commandArgs, cwd);
  if (command === "audit") return runAudit(commandArgs);
  return { exitCode: 1, stdout: "", stderr: "policy-pack command must be list, show, init, validate, or audit" };
}
