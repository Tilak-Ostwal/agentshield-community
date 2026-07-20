import { writeFileSync } from "node:fs";
import { isAbsolute, resolve } from "node:path";

import { createEvidenceBundleFromEvents } from "@agentshield/core";
import {
  type DemoRunResult,
  formatDemoHtmlReport,
  formatDemoJsonReport,
  formatDemoTextReport,
  runDemoScenarios
} from "@agentshield/demo-agent";

import type { CliResult } from "../cli.js";
import { writeEvidenceFile } from "./evidenceFile.js";

export const DEMO_MESSAGE =
  "AgentShield blocks unknown tools, detects write-then-exec chains, detects fingerprint changes, and redacts secrets in traces.";

export type DemoFormat = "text" | "json" | "html";

interface DemoArgs {
  format: DemoFormat;
  outPath?: string;
  evidencePath?: string;
  force: boolean;
}

function parseDemoFormat(args: string[]): DemoFormat {
  const formatIndex = args.indexOf("--format");

  if (formatIndex === -1) {
    return "text";
  }

  const value = args[formatIndex + 1];

  if (value !== "json" && value !== "html") {
    throw new Error("demo-run --format must be json or html");
  }

  return value;
}

function parseDemoArgs(args: string[]): DemoArgs {
  const outIndex = args.indexOf("--out");
  const outPath = outIndex === -1 ? undefined : args[outIndex + 1];
  const evidenceIndex = args.indexOf("--evidence");
  const evidencePath = evidenceIndex === -1 ? undefined : args[evidenceIndex + 1];

  if (outIndex !== -1 && (outPath === undefined || outPath.startsWith("--"))) {
    throw new Error("demo-run --out requires a file path");
  }

  if (evidenceIndex !== -1 && (evidencePath === undefined || evidencePath.startsWith("--"))) {
    throw new Error("demo-run --evidence requires a file path");
  }

  return {
    format: parseDemoFormat(args),
    ...(outPath === undefined ? {} : { outPath }),
    ...(evidencePath === undefined ? {} : { evidencePath }),
    force: args.includes("--force")
  };
}

function formatDemoOutput(run: DemoRunResult, format: DemoFormat): string {
  if (format === "html") {
    return formatDemoHtmlReport(run);
  }

  if (format === "json") {
    return formatDemoJsonReport(run);
  }

  return formatDemoTextReport(run);
}

export function runDemoCommand(): CliResult {
  return {
    exitCode: 0,
    stdout: DEMO_MESSAGE,
    stderr: ""
  };
}

export function runDemoRunCommand(args: string[], cwd = process.cwd()): CliResult {
  const parsedArgs = parseDemoArgs(args);
  const run = runDemoScenarios();
  const output = formatDemoOutput(run, parsedArgs.format);

  if (parsedArgs.evidencePath !== undefined) {
    const bundle = createEvidenceBundleFromEvents({
      traceId: "trace_demo_run",
      generatedAt: "2026-06-26T00:00:00.000Z",
      events: run.results.flatMap((result) => result.evidenceEvents)
    });
    const writeResult = writeEvidenceFile({
      evidencePath: parsedArgs.evidencePath,
      bundle,
      cwd,
      force: parsedArgs.force
    });

    if (!writeResult.ok) {
      return {
        exitCode: 1,
        stdout: "",
        stderr: `failed to write demo evidence: ${writeResult.error}`
      };
    }
  }

  if (parsedArgs.outPath !== undefined) {
    const resolvedOutPath = isAbsolute(parsedArgs.outPath) ? parsedArgs.outPath : resolve(cwd, parsedArgs.outPath);

    try {
      writeFileSync(resolvedOutPath, output, { encoding: "utf8", flag: parsedArgs.force ? "w" : "wx" });
    } catch (error) {
      const message = error instanceof Error ? error.message : "unknown write error";

      return {
        exitCode: 1,
        stdout: "",
        stderr: `failed to write demo report: ${message}`
      };
    }
  }

  return {
    exitCode: 0,
    stdout:
      parsedArgs.outPath === undefined
        ? output
        : `wrote demo report to ${parsedArgs.outPath}`,
    stderr: ""
  };
}
