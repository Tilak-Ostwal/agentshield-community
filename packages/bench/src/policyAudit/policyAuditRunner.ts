import { readFileSync } from "node:fs";
import { isAbsolute, resolve } from "node:path";

import { compilePolicyV2, redactSecrets, type PolicyV2 } from "@agentshield/core";
import { parseRegistryFile, validateRegistryFile, type RegistryFile } from "@agentshield/registry";

import { type PolicyAuditFinding, type PolicyAuditResult, type PolicyAuditSeverity } from "./policyAuditSchema.js";
import { analyzePolicyCoverage } from "./policyCoverageAnalyzer.js";
import { detectPolicyConflicts } from "./policyConflictDetector.js";

function readJson(path: string): unknown {
  return JSON.parse(readFileSync(path, "utf8"));
}

function resolvePath(cwd: string, filePath: string): string {
  return isAbsolute(filePath) ? filePath : resolve(cwd, filePath);
}

function loadPolicyV2(path: string, cwd: string): PolicyV2 {
  const input = readJson(resolvePath(cwd, path));
  const compiled = compilePolicyV2(input);
  if (!compiled.ok || compiled.policy === undefined) {
    throw new Error(`invalid policy: ${compiled.diagnostics.map((diagnostic) => diagnostic.message).join("; ")}`);
  }
  return input as PolicyV2;
}

function loadRegistry(path: string | undefined, cwd: string): RegistryFile | undefined {
  if (path === undefined) return undefined;
  const registry = parseRegistryFile(readJson(resolvePath(cwd, path)));
  const validation = validateRegistryFile(registry);
  if (!validation.valid) {
    throw new Error(`invalid registry: ${validation.issues.map((issue) => `${issue.code}: ${issue.message}`).join("; ")}`);
  }
  return registry;
}

function severityCounts(findings: PolicyAuditFinding[]): Record<PolicyAuditSeverity, number> {
  return {
    critical: findings.filter((finding) => finding.severity === "critical").length,
    high: findings.filter((finding) => finding.severity === "high").length,
    medium: findings.filter((finding) => finding.severity === "medium").length,
    low: findings.filter((finding) => finding.severity === "low").length,
    info: findings.filter((finding) => finding.severity === "info").length
  };
}

function coverageScore(findings: PolicyAuditFinding[]): number {
  const penalty = findings.reduce((sum, finding) => {
    if (finding.severity === "critical") return sum + 35;
    if (finding.severity === "high") return sum + 20;
    if (finding.severity === "medium") return sum + 8;
    if (finding.severity === "low") return sum + 3;
    return sum + 1;
  }, 0);
  return Math.max(0, 100 - penalty);
}

function passed(findings: PolicyAuditFinding[]): boolean {
  return !findings.some((finding) => finding.severity === "critical" || (finding.severity === "high" && finding.category === "dangerous_allow"));
}

export interface RunPolicyAuditOptions {
  registryPath?: string;
}

export function runPolicyAudit(policyPath: string, options: RunPolicyAuditOptions = {}, cwd = process.cwd()): PolicyAuditResult {
  const policy = loadPolicyV2(policyPath, cwd);
  const registry = loadRegistry(options.registryPath, cwd);
  const findings = [...analyzePolicyCoverage(policy, registry), ...detectPolicyConflicts(policy)].sort((a, b) => a.id.localeCompare(b.id));
  const counts = severityCounts(findings);
  const result: PolicyAuditResult = {
    summary: {
      policyPath,
      ...(options.registryPath === undefined ? {} : { registryPath: options.registryPath }),
      totalFindings: findings.length,
      ...counts,
      coverageScore: coverageScore(findings),
      passed: passed(findings)
    },
    findings
  };
  return redactSecrets(result).value as PolicyAuditResult;
}
