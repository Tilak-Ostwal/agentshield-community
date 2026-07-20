import { readFileSync, writeFileSync } from "node:fs";
import { isAbsolute, resolve } from "node:path";

import { createEvidenceBundleFromEvents } from "@agentshield/core";
import {
  defaultCiConfig,
  evaluateCiGate,
  formatCiGateSummary,
  generateHtmlReport,
  generateJsonReport,
  generateMarkdownReport,
  generateMatrixReport,
  generateRegressionSnapshot,
  generateSarifReport,
  parseCiConfig,
  parseScoringProfile,
  runDefaultBenchmark,
  validatePublicAttackCorpus,
  type CiConfig,
  type ScoringProfileName
} from "@agentshield/bench";

import type { CliResult } from "../cli.js";
import { writeEvidenceFile } from "./evidenceFile.js";
import { loadRegistry } from "./registryLoader.js";

export type BenchFormat = "json" | "html" | "markdown" | "matrix";

interface BenchArgs {
  format: BenchFormat;
  profile?: ScoringProfileName;
  failOnCritical?: boolean;
  minimumScorePercentage?: number;
  outPath?: string;
  evidencePath?: string;
  snapshotPath?: string;
  sarifPath?: string;
  configPath?: string;
  registryPath?: string;
  force: boolean;
  validateCorpus: boolean;
  ci: boolean;
}

export function parseBenchFormat(args: string[]): BenchFormat {
  const formatIndex = args.indexOf("--format");

  if (formatIndex === -1) {
    return "json";
  }

  const value = args[formatIndex + 1];

  if (value !== "json" && value !== "html" && value !== "markdown" && value !== "matrix") {
    throw new Error("bench --format must be json, html, markdown, or matrix");
  }

  return value;
}

function parseBenchArgs(args: string[]): BenchArgs {
  const outIndex = args.indexOf("--out");
  const outPath = outIndex === -1 ? undefined : args[outIndex + 1];
  const evidenceIndex = args.indexOf("--evidence");
  const evidencePath = evidenceIndex === -1 ? undefined : args[evidenceIndex + 1];
  const snapshotIndex = args.indexOf("--snapshot");
  const snapshotPath = snapshotIndex === -1 ? undefined : args[snapshotIndex + 1];
  const sarifIndex = args.indexOf("--sarif");
  const sarifPath = sarifIndex === -1 ? undefined : args[sarifIndex + 1];
  const configIndex = args.indexOf("--config");
  const configPath = configIndex === -1 ? undefined : args[configIndex + 1];
  const registryIndex = args.indexOf("--registry");
  const registryPath = registryIndex === -1 ? undefined : args[registryIndex + 1];
  const profileIndex = args.indexOf("--profile");
  const profile = profileIndex === -1 ? undefined : parseScoringProfile(args[profileIndex + 1]);
  const failOnCriticalIndex = args.indexOf("--fail-on-critical");
  const failOnCriticalValue = failOnCriticalIndex === -1 ? undefined : args[failOnCriticalIndex + 1];
  const failOnCritical =
    failOnCriticalValue === undefined ? undefined :
    failOnCriticalValue === "true" ? true :
    failOnCriticalValue === "false" ? false :
    (() => {
      throw new Error("bench --fail-on-critical must be true or false");
    })();
  const minimumScoreIndex = args.indexOf("--minimum-score");
  const minimumScoreValue = minimumScoreIndex === -1 ? undefined : args[minimumScoreIndex + 1];
  const minimumScorePercentage = minimumScoreValue === undefined ? undefined : Number(minimumScoreValue);

  if (outIndex !== -1 && (outPath === undefined || outPath.startsWith("--"))) {
    throw new Error("bench --out requires a file path");
  }

  if (evidenceIndex !== -1 && (evidencePath === undefined || evidencePath.startsWith("--"))) {
    throw new Error("bench --evidence requires a file path");
  }
  if (snapshotIndex !== -1 && (snapshotPath === undefined || snapshotPath.startsWith("--"))) {
    throw new Error("bench --snapshot requires a file path");
  }
  if (sarifIndex !== -1 && (sarifPath === undefined || sarifPath.startsWith("--"))) {
    throw new Error("bench --sarif requires a file path");
  }
  if (configIndex !== -1 && (configPath === undefined || configPath.startsWith("--"))) {
    throw new Error("bench --config requires a file path");
  }
  if (registryIndex !== -1 && (registryPath === undefined || registryPath.startsWith("--"))) {
    throw new Error("bench --registry requires a file path");
  }
  if (failOnCriticalIndex !== -1 && (failOnCriticalValue === undefined || failOnCriticalValue.startsWith("--"))) {
    throw new Error("bench --fail-on-critical requires true or false");
  }
  if (minimumScoreIndex !== -1 && (minimumScoreValue === undefined || minimumScoreValue.startsWith("--"))) {
    throw new Error("bench --minimum-score must be a number from 0 to 100");
  }
  if (minimumScorePercentage !== undefined && (!Number.isFinite(minimumScorePercentage) || minimumScorePercentage < 0 || minimumScorePercentage > 100)) {
    throw new Error("bench --minimum-score must be a number from 0 to 100");
  }

  return {
    format: parseBenchFormat(args),
    ...(profile === undefined ? {} : { profile }),
    ...(failOnCritical === undefined ? {} : { failOnCritical }),
    ...(minimumScorePercentage === undefined ? {} : { minimumScorePercentage }),
    ...(outPath === undefined ? {} : { outPath }),
    ...(evidencePath === undefined ? {} : { evidencePath }),
    ...(snapshotPath === undefined ? {} : { snapshotPath }),
    ...(sarifPath === undefined ? {} : { sarifPath }),
    ...(configPath === undefined ? {} : { configPath }),
    ...(registryPath === undefined ? {} : { registryPath }),
    force: args.includes("--force"),
    validateCorpus: args.includes("--validate-corpus"),
    ci: args.includes("--ci")
  };
}

function loadCiConfig(configPath: string | undefined, cwd: string): { ok: true; config: CiConfig } | { ok: false; error: string } {
  if (configPath === undefined) {
    return { ok: true, config: defaultCiConfig };
  }

  const resolved = isAbsolute(configPath) ? configPath : resolve(cwd, configPath);

  try {
    const parsed = parseCiConfig(JSON.parse(readFileSync(resolved, "utf8")));

    if (!parsed.ok || parsed.config === undefined) {
      return { ok: false, error: `invalid CI config: ${parsed.errors.join("; ")}` };
    }

    return { ok: true, config: parsed.config };
  } catch (error) {
    const message = error instanceof Error ? error.message : "unknown read error";

    return { ok: false, error: `invalid CI config: ${message}` };
  }
}

export function runBenchCommand(args: string[], cwd = process.cwd()): CliResult {
  const parsedArgs = parseBenchArgs(args);
  const validation = validatePublicAttackCorpus();

  if (parsedArgs.validateCorpus) {
    return {
      exitCode: validation.valid ? 0 : 1,
      stdout: validation.valid ? "benchmark corpus valid" : "",
      stderr: validation.valid ? "" : validation.issues.map((issue) => `${issue.code}: ${issue.message}`).join("\n")
    };
  }

  const ciConfigResult = parsedArgs.ci ? loadCiConfig(parsedArgs.configPath, cwd) : undefined;

  if (ciConfigResult?.ok === false) {
    return {
      exitCode: 1,
      stdout: "",
      stderr: ciConfigResult.error
    };
  }

  const ciConfig =
    ciConfigResult?.config === undefined && (parsedArgs.failOnCritical !== undefined || parsedArgs.minimumScorePercentage !== undefined)
      ? {
          ...defaultCiConfig,
          ...(parsedArgs.failOnCritical === undefined ? {} : { failOnCritical: parsedArgs.failOnCritical }),
          ...(parsedArgs.minimumScorePercentage === undefined ? {} : { minimumScorePercentage: parsedArgs.minimumScorePercentage })
        }
      : ciConfigResult?.config === undefined
        ? undefined
        : {
            ...ciConfigResult.config,
            ...(parsedArgs.failOnCritical === undefined ? {} : { failOnCritical: parsedArgs.failOnCritical }),
            ...(parsedArgs.minimumScorePercentage === undefined ? {} : { minimumScorePercentage: parsedArgs.minimumScorePercentage })
          };
  const registryResult = parsedArgs.registryPath === undefined ? undefined : loadRegistry(parsedArgs.registryPath, cwd);
  if (registryResult?.ok === false) {
    return {
      exitCode: 1,
      stdout: "",
      stderr: `invalid registry: ${registryResult.error}`
    };
  }
  const profile = parsedArgs.profile ?? ciConfig?.profile ?? "balanced";
  const scorecard = runDefaultBenchmark(profile, registryResult?.ok === true ? { toolRegistry: registryResult.toolRegistry } : {});
  const output =
    parsedArgs.format === "html" ? generateHtmlReport(scorecard) :
    parsedArgs.format === "markdown" ? generateMarkdownReport(scorecard) :
    parsedArgs.format === "matrix" ? generateMatrixReport(scorecard) :
    generateJsonReport(scorecard);

  const evidencePath = parsedArgs.evidencePath ?? (parsedArgs.ci ? ciConfig?.evidenceOutput : undefined);
  const sarifPath = parsedArgs.sarifPath ?? (parsedArgs.ci ? ciConfig?.sarifOutput : undefined);
  const outPath = parsedArgs.outPath ?? (parsedArgs.ci && parsedArgs.format === "markdown" ? ciConfig?.markdownOutput : undefined);

  if (evidencePath !== undefined) {
    const bundle = createEvidenceBundleFromEvents({
      traceId: "trace_bench",
      generatedAt: "2026-06-26T00:00:00.000Z",
      events: scorecard.results.flatMap((result) => result.evidenceEvents)
    });
    const writeResult = writeEvidenceFile({
      evidencePath,
      bundle,
      cwd,
      force: parsedArgs.force
    });

    if (!writeResult.ok) {
      return {
        exitCode: 1,
        stdout: "",
        stderr: `failed to write benchmark evidence: ${writeResult.error}`
      };
    }
  }

  if (sarifPath !== undefined) {
    const resolvedSarifPath = isAbsolute(sarifPath) ? sarifPath : resolve(cwd, sarifPath);

    try {
      writeFileSync(resolvedSarifPath, generateSarifReport(scorecard), { encoding: "utf8", flag: parsedArgs.force ? "w" : "wx" });
    } catch (error) {
      const message = error instanceof Error ? error.message : "unknown write error";

      return {
        exitCode: 1,
        stdout: "",
        stderr: `failed to write SARIF report: ${message}`
      };
    }
  }

  if (parsedArgs.snapshotPath !== undefined) {
    const resolvedSnapshotPath = isAbsolute(parsedArgs.snapshotPath) ? parsedArgs.snapshotPath : resolve(cwd, parsedArgs.snapshotPath);

    try {
      writeFileSync(resolvedSnapshotPath, generateRegressionSnapshot(scorecard), { encoding: "utf8", flag: parsedArgs.force ? "w" : "wx" });
    } catch (error) {
      const message = error instanceof Error ? error.message : "unknown write error";

      return {
        exitCode: 1,
        stdout: "",
        stderr: `failed to write benchmark snapshot: ${message}`
      };
    }
  }

  if (outPath !== undefined) {
    const resolvedOutPath = isAbsolute(outPath) ? outPath : resolve(cwd, outPath);

    try {
      writeFileSync(resolvedOutPath, output, { encoding: "utf8", flag: parsedArgs.force ? "w" : "wx" });
    } catch (error) {
      const message = error instanceof Error ? error.message : "unknown write error";

      return {
        exitCode: 1,
        stdout: "",
        stderr: `failed to write benchmark report: ${message}`
      };
    }
  }

  if (parsedArgs.ci) {
    const gate = evaluateCiGate(scorecard, ciConfig ?? defaultCiConfig, {
      ...(sarifPath === undefined ? {} : { sarifPath }),
      ...(evidencePath === undefined ? {} : { evidencePath }),
      ...(outPath === undefined ? {} : { markdownPath: outPath })
    });

    return {
      exitCode: gate.exitCode,
      stdout: formatCiGateSummary(gate),
      stderr: ""
    };
  }

  return {
    exitCode: scorecard.failed === 0 ? 0 : 1,
    stdout: outPath === undefined ? output : `wrote benchmark report to ${outPath}`,
    stderr: ""
  };
}
