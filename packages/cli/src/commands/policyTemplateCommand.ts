import { existsSync, writeFileSync } from "node:fs";
import { isAbsolute, relative, resolve } from "node:path";

import {
  generatePolicyTemplateJson,
  generatePolicyTemplateListText,
  generatePolicyTemplateShowText,
  listPolicyTemplates,
  renderPolicyTemplate,
  renderPolicyTemplateJson
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
    throw new Error("policy-template output path must be inside the current workspace");
  }
  return resolved;
}

function runList(): CliResult {
  return { exitCode: 0, stdout: generatePolicyTemplateListText(listPolicyTemplates()), stderr: "" };
}

function runShow(args: string[]): CliResult {
  const templateId = args[0];
  if (templateId === undefined || templateId.startsWith("--")) {
    return { exitCode: 1, stdout: "", stderr: "policy-template show requires a template id" };
  }
  const format = argValue(args, "--format") ?? "text";
  if (format !== "text" && format !== "json") {
    return { exitCode: 1, stdout: "", stderr: "policy-template show --format must be json" };
  }
  const rendered = renderPolicyTemplate(templateId);
  return {
    exitCode: 0,
    stdout: format === "json" ? generatePolicyTemplateJson(rendered) : generatePolicyTemplateShowText(rendered),
    stderr: ""
  };
}

function runInit(args: string[], cwd: string): CliResult {
  const templateId = args[0];
  if (templateId === undefined || templateId.startsWith("--")) {
    return { exitCode: 1, stdout: "", stderr: "policy-template init requires a template id" };
  }
  const outPath = argValue(args, "--out");
  if (outPath === undefined || outPath.startsWith("--")) {
    return { exitCode: 1, stdout: "", stderr: "policy-template init requires --out <file>" };
  }

  const resolved = outputPath(outPath, cwd);
  if (existsSync(resolved) && !args.includes("--force")) {
    return { exitCode: 1, stdout: "", stderr: `refusing to overwrite existing file: ${outPath}` };
  }

  writeFileSync(resolved, `${renderPolicyTemplateJson(templateId)}\n`, { encoding: "utf8", flag: args.includes("--force") ? "w" : "wx" });
  return { exitCode: 0, stdout: `wrote policy template ${templateId} to ${outPath}`, stderr: "" };
}

export function runPolicyTemplateCommand(args: string[], cwd = process.cwd()): CliResult {
  const [command, ...commandArgs] = args;
  if (command === "list") return runList();
  if (command === "show") return runShow(commandArgs);
  if (command === "init") return runInit(commandArgs, cwd);
  return { exitCode: 1, stdout: "", stderr: "policy-template command must be list, show, or init" };
}
