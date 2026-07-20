import { readFileSync } from "node:fs";
import { isAbsolute, resolve } from "node:path";

import { compilePolicyV2, evaluateCompiledPolicyV2, formatPolicyDiagnostics, parsePolicy } from "@agentshield/core";

import type { CliResult } from "../cli.js";

const sampleAction = {
  actionId: "policy_explain_sample",
  timestamp: "2026-06-26T00:00:00.000Z",
  actionType: "tool_call",
  toolName: "filesystem.read",
  input: { path: "/mock/project/README.md" }
};

export function runExplainPolicyCommand(args: string[], cwd = process.cwd()): CliResult {
  const policyPath = args[0];

  if (policyPath === undefined) {
    return {
      exitCode: 1,
      stdout: "",
      stderr: "usage: agentshield explain-policy <policy.json>"
    };
  }

  try {
    const resolvedPolicyPath = isAbsolute(policyPath) ? policyPath : resolve(cwd, policyPath);
    const parsedJson = JSON.parse(readFileSync(resolvedPolicyPath, "utf8")) as unknown;

    if (typeof parsedJson !== "object" || parsedJson === null || (parsedJson as { version?: unknown }).version !== 2) {
      const v1 = parsePolicy(parsedJson);
      return {
        exitCode: v1.ok ? 0 : 1,
        stdout: v1.ok ? "policy valid\nversion: 1\nexplain-policy is available for policy v2 decisions" : "",
        stderr: v1.ok ? "" : `policy invalid: ${v1.error ?? "unknown validation error"}`
      };
    }

    const compiled = compilePolicyV2(parsedJson);
    const diagnostics = formatPolicyDiagnostics(compiled.diagnostics);

    if (!compiled.ok || compiled.policy === undefined) {
      return {
        exitCode: 1,
        stdout: "",
        stderr: ["policy invalid", ...diagnostics].join("\n")
      };
    }

    const evaluation = evaluateCompiledPolicyV2(compiled.policy, sampleAction, {
      capabilities: ["filesystem.read"],
      taintLabels: [],
      riskSeverity: "low"
    });

    return {
      exitCode: 0,
      stdout: [
        "policy valid",
        `name: ${compiled.policy.name}`,
        `default decision: ${compiled.policy.defaultDecision}`,
        `rule count: ${compiled.policy.rules.length}`,
        diagnostics.length === 0 ? "diagnostics: none" : "diagnostics:",
        ...diagnostics,
        "sample explanation:",
        `decision: ${evaluation.decision}`,
        `winning rule: ${evaluation.policyExplanation?.winningRule ?? evaluation.ruleId}`,
        `matched rules: ${(evaluation.policyExplanation?.matchedRules ?? []).join(", ") || "none"}`,
        `precedence: ${evaluation.policyExplanation?.precedenceReason ?? evaluation.reason}`,
        `observed capabilities: ${(evaluation.policyExplanation?.observed.capabilities ?? []).join(", ") || "none"}`,
        `observed taint: ${(evaluation.policyExplanation?.observed.taint ?? []).join(", ") || "none"}`
      ].join("\n"),
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
