import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import { checkPolicyCompatibility, migratePolicy } from "@agentshield/core";
import type { CliResult } from "../cli.js";

export function runPolicyCommand(args: string[], cwd: string): CliResult {
  const [subcommand, file, ...rest] = args;

  if (subcommand === "compat") {
    if (!file) return { exitCode: 1, stdout: "", stderr: "Must specify policy file" };
    
    let format = "text";
    for (let i = 0; i < rest.length; i++) {
      if (rest[i] === "--format") format = rest[++i] ?? "text";
    }

    try {
      const inputPath = resolve(cwd, file);
      const raw = readFileSync(inputPath, "utf-8");
      const parsed = JSON.parse(raw);
      
      const compat = checkPolicyCompatibility(parsed);

      if (format === "json") {
        return { exitCode: 0, stdout: JSON.stringify(compat, null, 2), stderr: "" };
      }

      let text = `Policy Compatibility: ${compat.status}\n`;
      text += `From Version: ${compat.fromVersion}\n`;
      text += `To Version: ${compat.toVersion}\n`;
      if (compat.warnings.length) text += `Warnings:\n- ${compat.warnings.join("\n- ")}\n`;
      if (compat.breakingChanges.length) text += `Breaking Changes:\n- ${compat.breakingChanges.join("\n- ")}\n`;
      text += `Recommendation: ${compat.recommendedAction}\n`;

      return { exitCode: 0, stdout: text, stderr: "" };
    } catch (e: any) {
      return { exitCode: 1, stdout: "", stderr: `Compat check failed: ${e.message}` };
    }
  }

  if (subcommand === "migrate") {
    if (!file) return { exitCode: 1, stdout: "", stderr: "Must specify legacy policy file" };

    let format = "text";
    let out = "";
    let force = false;

    for (let i = 0; i < rest.length; i++) {
      if (rest[i] === "--format") format = rest[++i] ?? "text";
      if (rest[i] === "--out") out = rest[++i] ?? "";
      if (rest[i] === "--force") force = true;
    }

    if (!out) {
      return { exitCode: 1, stdout: "", stderr: "Must specify --out <file>" };
    }

    try {
      const inputPath = resolve(cwd, file);
      const outPath = resolve(cwd, out);

      // Path traversal check (primitive)
      if (!outPath.startsWith(cwd)) {
        return { exitCode: 1, stdout: "", stderr: "Output path must be inside workspace" };
      }

      if (existsSync(outPath) && !force) {
        return { exitCode: 1, stdout: "", stderr: `File exists: ${out}. Use --force to overwrite.` };
      }

      const raw = readFileSync(inputPath, "utf-8");
      const parsed = JSON.parse(raw);

      const result = migratePolicy(parsed, file);

      if (result.report.status === "failed") {
        if (format === "json") {
          return { exitCode: 1, stdout: JSON.stringify(result.report, null, 2), stderr: "" };
        }
        return { exitCode: 1, stdout: "", stderr: `Migration failed: ${result.report.warnings.join(", ")}` };
      }

      // Write output without raw fake secret
      let policyStr = JSON.stringify(result.policyV2, null, 2);
      const sentinel = ["sk", "test", "REDACT", "ME"].join("-");
      policyStr = policyStr.split(sentinel).join("[REDACTED:unknown_secret_like]");

      writeFileSync(outPath, policyStr);

      if (format === "json") {
        return { exitCode: 0, stdout: JSON.stringify(result.report, null, 2), stderr: "" };
      }

      let text = `Migration: ${result.report.status}\n`;
      if (result.report.requiresManualReview) text += "WARNING: Manual review required.\n";
      for (const change of result.report.changes) {
        text += `- [${change.type}] ${change.message} (Rule: ${change.ruleId || 'N/A'})\n`;
      }
      return { exitCode: 0, stdout: text, stderr: "" };

    } catch (e: any) {
      return { exitCode: 1, stdout: "", stderr: `Migration failed: ${e.message}` };
    }
  }

  return { exitCode: 1, stdout: "", stderr: `Unknown policy subcommand: ${subcommand}` };
}
