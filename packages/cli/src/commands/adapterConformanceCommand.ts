import { readFileSync, writeFileSync } from "node:fs";
import { isAbsolute, resolve } from "node:path";

import { normalizeCustomToolCall, runAdapterConformance, generateCertificationText, generateCertificationJson, generateCertificationMarkdown, type AdapterCertificationResult, type AgentShieldAdapter } from "@agentshield/sdk";

import type { CliResult } from "../cli.js";

type ConformanceFormat = "text" | "json" | "markdown";

const FAKE_SECRET = ["sk", "test", "REDACT", "ME"].join("-");

function argValue(args: string[], name: string): string | undefined {
  const index = args.indexOf(name);
  return index === -1 ? undefined : args[index + 1];
}

function parseFormat(args: string[]): ConformanceFormat {
  const value = argValue(args, "--format");
  if (value === undefined) return "text";
  if (value === "json" || value === "markdown") return value;
  throw new Error("adapter-conformance --format must be json or markdown");
}

/**
 * Build the conformance test adapter for the example suite.
 * This adapter is used when running `adapter-conformance` against
 * `examples/custom-adapter/adapter-conformance.json`.
 */
function buildConformanceAdapter(): AgentShieldAdapter {
  return {
    adapterId: "mock-custom-agent",
    adapterName: "Mock Custom Agent Adapter",
    protocol: "custom",
    listTools: async () => [
      { toolName: "filesystem.read", capabilities: ["filesystem.read"] },
      { toolName: "filesystem.write", capabilities: ["filesystem.write"] },
      { toolName: "network.post", capabilities: ["network.write"] },
      { toolName: "shell.exec", capabilities: ["shell.exec"] }
    ],
    normalizeToolCall: async (input) => normalizeCustomToolCall(input as never),
    executeAllowedAction: async (action) => {
      if (action.actionId === "exec-error") {
        throw new Error(`adapter internal failure ${FAKE_SECRET}`);
      }
      return {
        ok: true,
        status: "executed",
        output: { toolName: action.toolName, token: FAKE_SECRET }
      };
    }
  };
}

export async function runAdapterConformanceCommand(args: string[], cwd = process.cwd()): Promise<CliResult> {
  const suitePath = args.find((arg) => !arg.startsWith("--") && arg !== "adapter-conformance");
  if (suitePath === undefined || suitePath.length === 0) {
    return {
      exitCode: 1,
      stdout: "",
      stderr: "adapter-conformance requires a suite file path\nUsage: agentshield adapter-conformance <suite.json> [--format text|json|markdown] [--out file]"
    };
  }

  const format = parseFormat(args);
  const outPath = argValue(args, "--out");
  if (outPath !== undefined && outPath.startsWith("--")) {
    return { exitCode: 1, stdout: "", stderr: "adapter-conformance --out requires a file path" };
  }

  const resolvedSuite = isAbsolute(suitePath) ? suitePath : resolve(cwd, suitePath);
  let rawSuite: unknown;
  try {
    rawSuite = JSON.parse(readFileSync(resolvedSuite, "utf8")) as unknown;
  } catch (error) {
    const message = error instanceof Error ? error.message : "could not read suite file";
    return { exitCode: 1, stdout: "", stderr: `adapter-conformance: ${message}` };
  }

  const adapter = buildConformanceAdapter();
  let result: AdapterCertificationResult;
  try {
    result = await runAdapterConformance(adapter, rawSuite, { cwd });
  } catch (error) {
    const message = error instanceof Error ? error.message : "conformance runner failed";
    return { exitCode: 1, stdout: "", stderr: `adapter-conformance: ${message}` };
  }

  const output =
    format === "json" ? generateCertificationJson(result) :
    format === "markdown" ? generateCertificationMarkdown(result) :
    generateCertificationText(result);

  if (outPath !== undefined) {
    const resolvedOut = isAbsolute(outPath) ? outPath : resolve(cwd, outPath);
    try {
      writeFileSync(resolvedOut, output, { encoding: "utf8", flag: args.includes("--force") ? "w" : "wx" });
    } catch (error) {
      const message = error instanceof Error ? error.message : "could not write output file";
      return { exitCode: 1, stdout: "", stderr: `adapter-conformance --out: ${message}` };
    }
    return {
      exitCode: result.certificationStatus === "fail" ? 1 : 0,
      stdout: `wrote adapter conformance report to ${outPath}`,
      stderr: ""
    };
  }

  return {
    exitCode: result.certificationStatus === "fail" ? 1 : 0,
    stdout: output,
    stderr: ""
  };
}
