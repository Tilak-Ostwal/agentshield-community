import { writeFileSync } from "node:fs";
import { isAbsolute, resolve } from "node:path";

import {
  generatePerfJsonReport,
  generatePerfMarkdownReport,
  generatePerfTextReport,
  parseLatencyBudgetProfile,
  runPerformanceBenchmark,
  type LatencyBudgetProfile
} from "@agentshield/bench";

import type { CliResult } from "../cli.js";

type PerfFormat = "text" | "json" | "markdown";

interface PerfArgs {
  format: PerfFormat;
  budget: LatencyBudgetProfile;
  outPath?: string;
}

function argValue(args: string[], name: string): string | undefined {
  const index = args.indexOf(name);
  return index === -1 ? undefined : args[index + 1];
}

function parsePerfArgs(args: string[]): PerfArgs {
  const format = argValue(args, "--format") ?? "text";
  if (format !== "text" && format !== "json" && format !== "markdown") {
    throw new Error("perf --format must be json or markdown");
  }

  const budget = parseLatencyBudgetProfile(argValue(args, "--budget"));
  const outPath = argValue(args, "--out");
  if (args.includes("--out") && (outPath === undefined || outPath.startsWith("--"))) {
    throw new Error("perf --out requires a file path");
  }

  return {
    format,
    budget,
    ...(outPath === undefined ? {} : { outPath })
  };
}

function render(format: PerfFormat, budget: LatencyBudgetProfile): { exitCode: 0 | 1; output: string } {
  const report = runPerformanceBenchmark(budget);
  const output =
    format === "json" ? generatePerfJsonReport(report) :
    format === "markdown" ? generatePerfMarkdownReport(report) :
    generatePerfTextReport(report);

  return {
    exitCode: report.failed === 0 ? 0 : 1,
    output
  };
}

export function runPerfCommand(args: string[], cwd = process.cwd()): CliResult {
  const parsed = parsePerfArgs(args);
  const result = render(parsed.format, parsed.budget);

  if (parsed.outPath !== undefined) {
    const resolved = isAbsolute(parsed.outPath) ? parsed.outPath : resolve(cwd, parsed.outPath);
    try {
      writeFileSync(resolved, `${result.output}\n`, { encoding: "utf8", flag: "wx" });
    } catch (error) {
      const message = error instanceof Error ? error.message : "unknown write error";
      return {
        exitCode: 1,
        stdout: "",
        stderr: `failed to write performance report: ${message}`
      };
    }

    return {
      exitCode: result.exitCode,
      stdout: `wrote performance report to ${parsed.outPath}`,
      stderr: ""
    };
  }

  return {
    exitCode: result.exitCode,
    stdout: result.output,
    stderr: ""
  };
}
