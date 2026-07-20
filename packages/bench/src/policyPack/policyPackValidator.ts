import { readFileSync } from "node:fs";

import { compilePolicyV2 } from "@agentshield/core";

import { parsePolicyPack, type PolicyPack } from "./policyPackSchema.js";
import { renderPolicyPack } from "./policyPackRenderer.js";

export type PolicyPackValidationSeverity = "info" | "low" | "medium" | "high" | "critical";

export interface PolicyPackValidationFinding {
  id: string;
  severity: PolicyPackValidationSeverity;
  message: string;
  recommendation: string;
}

export interface PolicyPackValidationResult {
  ok: boolean;
  pack?: PolicyPack;
  findings: PolicyPackValidationFinding[];
}

function finding(id: string, severity: PolicyPackValidationSeverity, message: string, recommendation: string): PolicyPackValidationFinding {
  return { id, severity, message, recommendation };
}

function blocking(findings: PolicyPackValidationFinding[]): boolean {
  return findings.some((item) => item.severity === "high" || item.severity === "critical");
}

export function validatePolicyPack(input: unknown): PolicyPackValidationResult {
  const parsed = parsePolicyPack(input);
  if (!parsed.ok || parsed.pack === undefined) {
    return {
      ok: false,
      findings: [finding("policy-pack.invalid", "critical", `policy pack is invalid: ${parsed.error ?? "unknown validation error"}`, "Fix schema errors before using this pack.")]
    };
  }

  const pack = parsed.pack;
  const findings: PolicyPackValidationFinding[] = [];
  const compiled = compilePolicyV2(renderPolicyPack(pack).policy);
  if (!compiled.ok) {
    findings.push(
      finding(
        "policy-pack.rendered-policy.invalid",
        "critical",
        `rendered policy is invalid: ${compiled.diagnostics.map((diagnostic) => diagnostic.message).join("; ")}`,
        "Fix pack rules so the rendered Policy v2 compiles."
      )
    );
  }

  if (pack.packId === "dev-warning-mode" || pack.safetyLevel === "dev") {
    const warns = pack.warnings.some((warning) => warning.toLowerCase().includes("not production-ready"));
    findings.push(
      finding(
        "policy-pack.dev-warning",
        warns ? "medium" : "critical",
        warns ? "dev-warning-mode is clearly marked not production-ready" : "dev-warning-mode is missing production warning metadata",
        "Keep dev-warning-mode out of production and preserve explicit warning metadata."
      )
    );
  }

  const serialized = JSON.stringify(pack);
  if (serialized.includes(["sk", "test", "REDACT", "ME"].join("-"))) {
    findings.push(finding("policy-pack.raw-fake-secret", "critical", "policy pack contains raw fake secret sentinel", "Remove raw secret-like values from pack metadata and rules."));
  }

  return {
    ok: !blocking(findings),
    pack,
    findings: findings.sort((left, right) => left.id.localeCompare(right.id))
  };
}

export function validatePolicyPackFile(path: string): PolicyPackValidationResult {
  try {
    return validatePolicyPack(JSON.parse(readFileSync(path, "utf8")) as unknown);
  } catch (error) {
    const message = error instanceof Error ? error.message : "unknown load error";
    return {
      ok: false,
      findings: [finding("policy-pack.load-failed", "critical", `failed to load policy pack: ${message}`, "Ensure the pack file exists and contains valid JSON.")]
    };
  }
}
