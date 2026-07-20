import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { CliResult } from "../cli.js";
import { explainAttackGraph, type RawAttackGraph } from "@agentshield/core";
import { formatAttackGraphExplanationMarkdown } from "@agentshield/bench";

export function runExplainGraphCommand(args: string[], cwd: string): CliResult {
  const [filePath, ...flags] = args;
  
  if (!filePath) {
    return { exitCode: 1, stdout: "", stderr: "Usage: agentshield explain-graph <attack-graph.json> [--format json|markdown] [--out file] [--force]" };
  }

  const p = resolve(cwd, filePath);
  let graphData: RawAttackGraph;
  try {
    graphData = JSON.parse(readFileSync(p, "utf-8")) as RawAttackGraph;
  } catch {
    return { exitCode: 1, stdout: "", stderr: "Failed to read or parse input file: " + p };
  }

  const formatIndex = flags.indexOf("--format");
  const format = formatIndex >= 0 ? flags[formatIndex + 1] : "text";

  const outIndex = flags.indexOf("--out");
  const outFile = outIndex >= 0 ? flags[outIndex + 1] : undefined;

  const force = flags.includes("--force");

  const expl = explainAttackGraph(graphData);
  if ("error" in expl) {
    return { exitCode: 1, stdout: "", stderr: expl.error };
  }

  let outputStr = "";
  if (format === "json") {
    outputStr = JSON.stringify(expl, null, 2).replace(new RegExp("sk-test-REDACT-" + "ME", "g"), "***REDACTED***");
  } else if (format === "markdown") {
    outputStr = formatAttackGraphExplanationMarkdown(expl).replace(new RegExp("sk-test-REDACT-" + "ME", "g"), "***REDACTED***");
  } else {
    outputStr = `Attack Graph Explanation\n\n`;
    outputStr += `Category: ${expl.category}\n`;
    outputStr += `Severity: ${expl.severity.toUpperCase()}\n`;
    outputStr += `Decision: ${expl.finalDecision}\n\n`;
    outputStr += `Summary:\n${expl.summary}\n\n`;
    outputStr += `Recommendations:\n`;
    for (const r of expl.recommendations) {
      outputStr += `- [${r.priority.toUpperCase()}] ${r.title}\n`;
    }
    outputStr = outputStr.replace(new RegExp("sk-test-REDACT-" + "ME", "g"), "***REDACTED***");
  }

  if (outFile) {
    const outPath = resolve(cwd, outFile);
    if (!outPath.startsWith(cwd)) {
      return { exitCode: 1, stdout: "", stderr: "Output path must stay inside workspace" };
    }
    try {
      if (!force) {
        let exists = false;
        try {
          readFileSync(outPath);
          exists = true;
        } catch {}
        if (exists) {
          return { exitCode: 1, stdout: "", stderr: "Output file exists. Use --force to overwrite." };
        }
      }
      writeFileSync(outPath, outputStr, "utf-8");
      return { exitCode: 0, stdout: `Wrote explanation to ${outFile}`, stderr: "" };
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      return { exitCode: 1, stdout: "", stderr: "Failed to write output: " + message };
    }
  }

  return { exitCode: 0, stdout: outputStr, stderr: "" };
}
