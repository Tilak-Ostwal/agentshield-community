import { readFileSync } from "node:fs";
import { isAbsolute, resolve } from "node:path";

import { compilePolicyV2, formatPolicyDiagnostics, parsePolicy } from "@agentshield/core";

import type { CliResult } from "../cli.js";

export function runCheckCommand(args: string[], cwd = process.cwd()): CliResult {
  const policyPath = args[0];

  if (policyPath === undefined) {
    return {
      exitCode: 1,
      stdout: "",
      stderr: "usage: agentshield check <policy.json>"
    };
  }

  try {
    const resolvedPolicyPath = isAbsolute(policyPath) ? policyPath : resolve(cwd, policyPath);
    const rawPolicy = readFileSync(resolvedPolicyPath, "utf8");
    const parsedJson = JSON.parse(rawPolicy) as unknown;
    if (typeof parsedJson === "object" && parsedJson !== null && (parsedJson as { version?: unknown }).version === 2) {
      const result = compilePolicyV2(parsedJson);
      const diagnostics = formatPolicyDiagnostics(result.diagnostics);

      if (!result.ok || result.policy === undefined) {
        return {
          exitCode: 1,
          stdout: "",
          stderr: ["policy invalid", ...diagnostics].join("\n")
        };
      }

      return {
        exitCode: 0,
        stdout: [
          "policy valid",
          `version: 2`,
          `name: ${result.policy.name}`,
          `default decision: ${result.policy.defaultDecision}`,
          `mode: ${result.policy.mode}`,
          `rule count: ${result.policy.rules.length}`,
          ...diagnostics
        ].join("\n"),
        stderr: ""
      };
    }

    const result = parsePolicy(parsedJson);

    if (!result.ok) {
      return {
        exitCode: 1,
        stdout: "",
        stderr: `policy invalid: ${result.error ?? "unknown validation error"}`
      };
    }

    return {
      exitCode: 0,
      stdout: "policy valid",
      stderr: ""
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "unknown error";

    return {
      exitCode: 1,
      stdout: "",
      stderr: `policy invalid: ${message}`
    };
  }
}
