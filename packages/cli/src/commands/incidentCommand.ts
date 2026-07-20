import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import { CliResult } from "../cli.js";
import { generateIncidentReport, formatIncidentMarkdown } from "@agentshield/bench";
import { verifyIncident, type RuntimeIncident } from "@agentshield/core";

export function runIncidentCommand(args: string[], cwd: string): CliResult {
  const [subcommand, filePath, ...flags] = args;

  if (subcommand !== "report" && subcommand !== "verify") {
    return { exitCode: 1, stdout: "", stderr: "Usage: agentshield incident report|verify <file.json> [...]" };
  }
  if (!filePath) {
    return { exitCode: 1, stdout: "", stderr: "Must specify a file path." };
  }

  const p = resolve(cwd, filePath);
  let data: unknown;
  try {
    data = JSON.parse(readFileSync(p, "utf-8"));
  } catch {
    return { exitCode: 1, stdout: "", stderr: "Failed to read or parse input file." };
  }

  const formatIndex = flags.indexOf("--format");
  const format = formatIndex >= 0 ? flags[formatIndex + 1] : (subcommand === "verify" ? "text" : "text");

  if (subcommand === "verify") {
    const result = verifyIncident(data as RuntimeIncident);
    if (format === "json") {
      return { exitCode: result.valid ? 0 : 1, stdout: JSON.stringify(result, null, 2), stderr: "" };
    }
    if (result.valid) {
      return { exitCode: 0, stdout: "Incident verified successfully.", stderr: "" };
    }
    return { exitCode: 1, stdout: "", stderr: "Incident verification failed: \n" + result.failures.join("\n") };
  }

  const outIndex = flags.indexOf("--out");
  const outFile = outIndex >= 0 ? flags[outIndex + 1] : undefined;
  const force = flags.includes("--force");

  const incident = generateIncidentReport(data);

  let outputStr = "";
  if (format === "json") {
    outputStr = JSON.stringify(incident, null, 2);
  } else if (format === "markdown") {
    outputStr = formatIncidentMarkdown(incident);
  } else {
    outputStr = `Incident Report\n\nTitle: ${incident.title}\nSeverity: ${incident.severity.toUpperCase()}\nStatus: ${incident.status}\n\nSummary:\n${incident.summary}\n`;
  }

  if (outFile) {
    const outPath = resolve(cwd, outFile);
    if (!outPath.startsWith(cwd)) {
      return { exitCode: 1, stdout: "", stderr: "Output path must stay inside workspace" };
    }
    if (!force && existsSync(outPath)) {
      return { exitCode: 1, stdout: "", stderr: "Refuse overwrite unless --force" };
    }
    writeFileSync(outPath, outputStr, "utf-8");
    return { exitCode: 0, stdout: `Wrote incident report to ${outFile}`, stderr: "" };
  }

  return { exitCode: 0, stdout: outputStr, stderr: "" };
}
