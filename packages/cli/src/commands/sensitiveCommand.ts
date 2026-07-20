import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { generateSensitiveScanReport, formatSensitiveScanReportMarkdown } from "@agentshield/bench";
import { verifyReportRedaction } from "@agentshield/core";
import type { CliResult } from "../cli.js";

export function runSensitiveCommand(args: string[], cwd: string): CliResult {
  const [subcommand, file, ...rest] = args;

  if (subcommand === "scan") {
    if (!file) return { exitCode: 1, stdout: "", stderr: "Must specify input file to scan" };

    let format = "text";
    for (let i = 0; i < rest.length; i++) {
      if (rest[i] === "--format") format = rest[++i] ?? "text";
    }

    try {
      const inputPath = resolve(cwd, file);
      const raw = readFileSync(inputPath, "utf-8");
      
      let parsed: unknown;
      try {
        parsed = JSON.parse(raw);
      } catch {
        parsed = raw;
      }

      const report = generateSensitiveScanReport(parsed);

      if (format === "json") {
        return { exitCode: 0, stdout: JSON.stringify(report, null, 2), stderr: "" };
      }
      if (format === "markdown") {
        return { exitCode: 0, stdout: formatSensitiveScanReportMarkdown(report), stderr: "" };
      }

      let text = `AgentShield Sensitive Scan: ${report.totalFindings === 0 ? 'CLEAN' : 'FINDINGS'}\n`;
      for (const f of report.findings) {
        text += `- ${f.type} (${f.confidence}) at ${f.path}\n`;
      }
      return { exitCode: 0, stdout: text, stderr: "" };
    } catch (error: unknown) {
      return { exitCode: 1, stdout: "", stderr: `Scan failed: ${error instanceof Error ? error.message : String(error)}` };
    }
  }

  if (subcommand === "verify-report") {
    if (!file) return { exitCode: 1, stdout: "", stderr: "Must specify report file to verify" };

    let format = "text";
    for (let i = 0; i < rest.length; i++) {
      if (rest[i] === "--format") format = rest[++i] ?? "text";
    }

    try {
      const inputPath = resolve(cwd, file);
      const raw = readFileSync(inputPath, "utf-8");

      const result = verifyReportRedaction(raw);

      if (format === "json") {
        if (result.ok) {
          return { exitCode: 0, stdout: JSON.stringify(result, null, 2), stderr: "" };
        } else {
          return { exitCode: 1, stdout: JSON.stringify(result, null, 2), stderr: "" };
        }
      }

      if (result.ok) {
        return { exitCode: 0, stdout: "AgentShield Sensitive Verify: PASS", stderr: "" };
      } else {
        return { exitCode: 1, stdout: `AgentShield Sensitive Verify: FAIL\n- ${result.failures.join("\n- ")}`, stderr: "" };
      }
    } catch (error: unknown) {
      return { exitCode: 1, stdout: "", stderr: `Verify failed: ${error instanceof Error ? error.message : String(error)}` };
    }
  }

  return { exitCode: 1, stdout: "", stderr: `Unknown sensitive subcommand: ${subcommand}` };
}
