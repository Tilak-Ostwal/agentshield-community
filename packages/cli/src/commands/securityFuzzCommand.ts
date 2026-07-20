import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { defaultFuzzFixtures, runSecurityFuzz, generateSecurityFuzzReport, formatSecurityFuzzReportText, formatSecurityFuzzReportMarkdown, type FailureModeFixture } from "@agentshield/bench";
import type { CliResult } from "../cli.js";

export function runSecurityFuzzCommand(args: string[], cwd: string): CliResult {
  let format = "text";
  let outFile = "";
  let fixtureFile = "";

  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--format" && args[i + 1]) format = args[++i]!;
    if (args[i] === "--out" && args[i + 1]) outFile = args[++i]!;
    if (args[i] === "--fixture" && args[i + 1]) fixtureFile = args[++i]!;
  }

  let fixtures = defaultFuzzFixtures;
  if (fixtureFile) {
      try {
          const content = readFileSync(resolve(cwd, fixtureFile), "utf8");
          fixtures = JSON.parse(content) as FailureModeFixture[];
      } catch {
          // ignore
      }
  }

  const results = runSecurityFuzz(fixtures);
  const report = generateSecurityFuzzReport(results);

  let output = "";
  if (format === "json") output = JSON.stringify(report, null, 2);
  else if (format === "markdown") output = formatSecurityFuzzReportMarkdown(report);
  else output = formatSecurityFuzzReportText(report);

  if (outFile) {
      writeFileSync(resolve(cwd, outFile), output, "utf8");
  }

  return { exitCode: report.certification === "passed" ? 0 : 1, stdout: output, stderr: "" };
}
