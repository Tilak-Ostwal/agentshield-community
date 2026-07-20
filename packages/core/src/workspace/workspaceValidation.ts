import { existsSync } from "node:fs";
import { isAbsolute, resolve } from "node:path";

import { loadWorkspaceConfig, parseWorkspaceConfig, type WorkspaceConfig } from "./workspaceConfig.js";
import { readFileSync } from "node:fs";
import { checkPolicyCompatibility } from "../policy/migration/policyCompatibilityChecker.js";

export type WorkspaceValidationSeverity = "info" | "low" | "medium" | "high" | "critical";
export type WorkspaceValidationCategory = "missing_file" | "invalid_config" | "unsafe_setting" | "recommendation";

export interface WorkspaceValidationFinding {
  id: string;
  severity: WorkspaceValidationSeverity;
  category: WorkspaceValidationCategory;
  message: string;
  recommendation: string;
}

export interface WorkspaceValidationResult {
  ok: boolean;
  config?: WorkspaceConfig;
  findings: WorkspaceValidationFinding[];
}

function finding(
  id: string,
  severity: WorkspaceValidationSeverity,
  category: WorkspaceValidationCategory,
  message: string,
  recommendation: string
): WorkspaceValidationFinding {
  return { id, severity, category, message, recommendation };
}

function resolveConfigPath(rootDir: string, path: string): string {
  return isAbsolute(path) ? path : resolve(rootDir, path);
}

function hasBlockingFindings(findings: WorkspaceValidationFinding[]): boolean {
  return findings.some((item) => item.severity === "high" || item.severity === "critical");
}

export function validateWorkspaceConfig(configInput: unknown, rootDir = process.cwd()): WorkspaceValidationResult {
  const parsed = parseWorkspaceConfig(configInput);
  if (!parsed.ok || parsed.config === undefined) {
    return {
      ok: false,
      findings: [
        finding(
          "workspace.invalid-config",
          "critical",
          "invalid_config",
          `workspace config is invalid: ${parsed.error ?? "unknown validation error"}`,
          "Fix the workspace config schema errors before using it."
        )
      ]
    };
  }

  const config = parsed.config;
  const findings: WorkspaceValidationFinding[] = [];

  if (config.policyPath) {
    const pPath = resolveConfigPath(rootDir, config.policyPath);
    if (!existsSync(pPath)) {
      findings.push(
        finding(
          "workspace.policy-path.missing",
          "high",
          "missing_file",
          `policyPath does not exist: ${config.policyPath}`,
          "Create the policy file or update policyPath to an existing local policy."
        )
      );
    } else {
      try {
        const raw = readFileSync(pPath, "utf-8");
        const parsed = JSON.parse(raw);
        const compat = checkPolicyCompatibility(parsed);
        if (compat.status === "incompatible") {
          findings.push(finding("workspace.policy.incompatible", "high", "invalid_config", `Policy version ${compat.fromVersion} is unsupported`, compat.recommendedAction));
        } else if (compat.status === "migration_required") {
          findings.push(finding("workspace.policy.migration_required", "low", "recommendation", `Policy version ${compat.fromVersion} should be migrated`, compat.recommendedAction));
        }
      } catch {}
    }
  }

  if (config.registryPath && !existsSync(resolveConfigPath(rootDir, config.registryPath))) {
    findings.push(
      finding(
        "workspace.registry-path.missing",
        "medium",
        "missing_file",
        `registryPath does not exist: ${config.registryPath}`,
        "Create the registry file or update registryPath to an existing local registry."
      )
    );
  }

  if (config.profile === "dev") {
    findings.push(
      finding(
        "workspace.profile.dev",
        "medium",
        "unsafe_setting",
        "dev profile is intended for temporary local experiments only",
        "Use strict or enterprise for release-candidate and CI evaluation."
      )
    );
  }

  if (config.policyPack !== undefined && config.policyPath !== undefined && config.policyBundlePath !== undefined) {
    findings.push(
      finding(
        "workspace.policy-bundle.precedence",
        "low",
        "recommendation",
        `workspace config defines policyPack, policyPath, and policyBundlePath`,
        "When policyBundlePath is present, it will supersede raw policy files. Treat policyBundlePath as the explicit source."
      )
    );
  } else if (config.policyPack && config.policyPath) {
    findings.push(
      finding(
        "workspace.policy-pack.precedence",
        "low",
        "recommendation",
        `workspace config defines both policyPack (${config.policyPack}) and policyPath (${config.policyPath})`,
        "Treat policyPath as the explicit policy source today; use policyPack for future workspace-aware rendering or remove one field to avoid ambiguity."
      )
    );
  }

  if (config.registryPath && config.registryBundlePath) {
    findings.push(
      finding(
        "workspace.registry.precedence",
        "low",
        "recommendation",
        `workspace config defines both registryPath (${config.registryPath}) and registryBundlePath (${config.registryBundlePath})`,
        "Treat registryPath as the explicit source today; remove one field to avoid ambiguity."
      )
    );
  }

  if (!config.evidence.enabled || !config.evidence.redactionRequired) {
    findings.push(
      finding(
        "workspace.evidence.redaction",
        "critical",
        "unsafe_setting",
        "evidence redaction must remain enabled and required",
        "Set evidence.enabled and evidence.redactionRequired to true."
      )
    );
  }

  if (config.bench.minimumScore < 100 && (config.profile === "strict" || config.profile === "enterprise")) {
    findings.push(
      finding(
        "workspace.bench.minimum-score",
        "medium",
        "recommendation",
        "strict and enterprise profiles should keep benchmark minimumScore at 100",
        "Set bench.minimumScore to 100 before release-candidate handoff."
      )
    );
  }

  if ((config.profile === "strict" || config.profile === "enterprise") && !config.adapters.conformanceRequired) {
    findings.push(
      finding(
        "workspace.adapters.conformance",
        "high",
        "unsafe_setting",
        "strict and enterprise profiles require adapter conformance",
        "Set adapters.conformanceRequired to true."
      )
    );
  }

  return {
    ok: !hasBlockingFindings(findings),
    config,
    findings: findings.sort((left, right) => left.id.localeCompare(right.id))
  };
}

export function validateWorkspaceConfigFile(path: string, rootDir = process.cwd()): WorkspaceValidationResult {
  const loaded = loadWorkspaceConfig(path);
  if (!loaded.ok || loaded.config === undefined) {
    return {
      ok: false,
      findings: [
        finding(
          "workspace.load-failed",
          "critical",
          "invalid_config",
          `failed to load workspace config: ${loaded.error ?? "unknown load error"}`,
          "Ensure the workspace config exists and contains valid JSON."
        )
      ]
    };
  }

  return validateWorkspaceConfig(loaded.config, rootDir);
}
