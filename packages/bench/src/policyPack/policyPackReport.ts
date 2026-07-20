import { analyzePolicyCoverage } from "../policyAudit/policyCoverageAnalyzer.js";
import { detectPolicyConflicts } from "../policyAudit/policyConflictDetector.js";
import type { PolicyAuditResult, PolicyAuditSeverity } from "../policyAudit/policyAuditSchema.js";
import { getPolicyPack, listPolicyPacks } from "./builtInPolicyPacks.js";
import type { PolicyPack } from "./policyPackSchema.js";
import { renderPolicyPack, type RenderedPolicyPack } from "./policyPackRenderer.js";
import { validatePolicyPack, type PolicyPackValidationResult } from "./policyPackValidator.js";

function severityCounts(findings: PolicyAuditResult["findings"]): Record<PolicyAuditSeverity, number> {
  return {
    critical: findings.filter((finding) => finding.severity === "critical").length,
    high: findings.filter((finding) => finding.severity === "high").length,
    medium: findings.filter((finding) => finding.severity === "medium").length,
    low: findings.filter((finding) => finding.severity === "low").length,
    info: findings.filter((finding) => finding.severity === "info").length
  };
}

function coverageScore(findings: PolicyAuditResult["findings"]): number {
  const penalty = findings.reduce((sum, finding) => {
    if (finding.severity === "critical") return sum + 35;
    if (finding.severity === "high") return sum + 20;
    if (finding.severity === "medium") return sum + 8;
    if (finding.severity === "low") return sum + 3;
    return sum + 1;
  }, 0);
  return Math.max(0, 100 - penalty);
}

function passed(findings: PolicyAuditResult["findings"]): boolean {
  return !findings.some((finding) => finding.severity === "critical" || (finding.severity === "high" && finding.category === "dangerous_allow"));
}

export interface PolicyPackAuditResult {
  pack: RenderedPolicyPack;
  validation: PolicyPackValidationResult;
  audit: PolicyAuditResult;
  ok: boolean;
}

export function auditPolicyPack(packOrId: PolicyPack | string): PolicyPackAuditResult {
  const pack = typeof packOrId === "string" ? getPolicyPack(packOrId) : packOrId;
  const rendered = renderPolicyPack(pack);
  const findings = [...analyzePolicyCoverage(rendered.policy), ...detectPolicyConflicts(rendered.policy)].sort((left, right) => left.id.localeCompare(right.id));
  const counts = severityCounts(findings);
  const audit: PolicyAuditResult = {
    summary: {
      policyPath: `policy-pack:${rendered.packId}`,
      totalFindings: findings.length,
      ...counts,
      coverageScore: coverageScore(findings),
      passed: passed(findings)
    },
    findings
  };
  const validation = validatePolicyPack(pack);
  return { pack: rendered, validation, audit, ok: validation.ok && audit.summary.passed };
}

export function generatePolicyPackListText(packs: PolicyPack[] = listPolicyPacks()): string {
  return ["AgentShield policy packs", ...packs.map((pack) => `${pack.packId} - ${pack.safetyLevel} - ${pack.description}`)].join("\n");
}

export function generatePolicyPackShowText(rendered: RenderedPolicyPack): string {
  return [
    `Policy pack: ${rendered.packId}`,
    rendered.name,
    rendered.description,
    `Safety level: ${rendered.safetyLevel}`,
    `Compatible workspace profiles: ${rendered.compatibleWorkspaceProfiles.join(", ")}`,
    `Required checks: ${Object.entries(rendered.requiredChecks).filter(([, enabled]) => enabled).map(([name]) => name).join(", ")}`,
    ...(rendered.warnings.length === 0 ? [] : ["Warnings:", ...rendered.warnings.map((warning) => `- ${warning}`)]),
    `Rendered policy rules: ${rendered.policy.rules.length}`
  ].join("\n");
}

export function generatePolicyPackAuditText(result: PolicyPackAuditResult): string {
  return [
    `AgentShield policy pack audit: ${result.ok ? "PASS" : "WARN"} (${result.audit.summary.coverageScore}/100)`,
    `Pack: ${result.pack.packId}`,
    `Findings: ${result.audit.summary.totalFindings} total, ${result.audit.summary.critical} critical, ${result.audit.summary.high} high, ${result.audit.summary.medium} medium, ${result.audit.summary.low} low, ${result.audit.summary.info} info`,
    ...result.validation.findings.map((finding) => `${finding.severity.toUpperCase()} ${finding.id} - ${finding.message}`),
    ...result.audit.findings.map((finding) => `${finding.severity.toUpperCase()} ${finding.category} ${finding.id} - ${finding.title}`)
  ].join("\n");
}

export function generatePolicyPackJson(value: unknown): string {
  return JSON.stringify(value, null, 2);
}
