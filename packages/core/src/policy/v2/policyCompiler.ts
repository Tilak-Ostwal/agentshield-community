import { z } from "zod";
import { type Capability } from "../../capabilities/capabilityTypes.js";
import { POLICY_EFFECT_STRENGTH, compareCompiledRules, type CompiledPolicyV2 } from "./compiledPolicy.js";
import { hasPolicyErrors, type PolicyDiagnostic } from "./policyDiagnostics.js";
import { policyV2Schema, type PolicyV2 } from "./policyV2Schema.js";

export interface CompilePolicyV2Result {
  ok: boolean;
  policy?: CompiledPolicyV2;
  diagnostics: PolicyDiagnostic[];
}

const criticalCapabilities = new Set<Capability>([
  "shell.exec",
  "code_execution",
  "package.install",
  "network.exfiltration_risk",
  "secret.read"
]);

const boundaryRequiredCapabilities = new Set<Capability>([
  "filesystem.read",
  "filesystem.write",
  "network.write",
  "shell.exec"
]);

function zodDiagnostics(error: z.ZodError): PolicyDiagnostic[] {
  return error.issues.map((issue) => ({
    severity: "error",
    code: "POLICY_V2_SCHEMA_INVALID",
    message: issue.message,
    path: issue.path.join(".")
  }));
}

function collectMatchedCapabilities(rule: PolicyV2["rules"][number]): Capability[] {
  return [
    ...(rule.match.capability === undefined ? [] : [rule.match.capability]),
    ...(rule.match.capabilitiesAny ?? []),
    ...(rule.match.capabilitiesAll ?? [])
  ];
}

function addPolicyWarnings(policy: PolicyV2, diagnostics: PolicyDiagnostic[]): void {
  for (const rule of policy.rules) {
    const capabilities = collectMatchedCapabilities(rule);

    if (rule.effect === "allow" && Object.keys(rule.match).length <= 1) {
      diagnostics.push({
        severity: "warning",
        code: "POLICY_V2_BROAD_ALLOW",
        message: "allow rule has a broad match",
        ruleId: rule.id
      });
    }

    if (rule.effect === "allow" && capabilities.some((capability) => criticalCapabilities.has(capability))) {
      diagnostics.push({
        severity: "warning",
        code: "POLICY_V2_CRITICAL_CAPABILITY_ALLOW",
        message: "allow rule matches a critical capability",
        ruleId: rule.id
      });
    }

    if (
      rule.effect === "allow" &&
      rule.match.resource === undefined &&
      capabilities.some((capability) => boundaryRequiredCapabilities.has(capability))
    ) {
      diagnostics.push({
        severity: "warning",
        code: "POLICY_V2_ALLOW_WITHOUT_RESOURCE_BOUNDARY",
        message: "allow rule for sensitive resource capability has no resource boundary",
        ruleId: rule.id
      });
    }
  }
}

export function compilePolicyV2(input: unknown): CompilePolicyV2Result {
  const parsed = policyV2Schema.safeParse(input);
  const diagnostics: PolicyDiagnostic[] = [];

  if (!parsed.success) {
    return { ok: false, diagnostics: zodDiagnostics(parsed.error) };
  }

  const ids = new Set<string>();

  for (const rule of parsed.data.rules) {
    if (ids.has(rule.id)) {
      diagnostics.push({
        severity: "error",
        code: "POLICY_V2_DUPLICATE_RULE_ID",
        message: `duplicate rule id ${rule.id}`,
        ruleId: rule.id
      });
    }

    ids.add(rule.id);
  }

  addPolicyWarnings(parsed.data, diagnostics);

  if (hasPolicyErrors(diagnostics)) {
    return { ok: false, diagnostics };
  }

  const compiled: CompiledPolicyV2 = {
    version: 2,
    name: parsed.data.name,
    defaultDecision: parsed.data.defaultDecision,
    mode: parsed.data.mode,
    diagnostics,
    rules: parsed.data.rules
      .map((rule, sourceIndex) => ({
        rule,
        sourceIndex,
        safetyStrength: POLICY_EFFECT_STRENGTH[rule.effect],
        hasExactToolName: rule.match.toolName !== undefined
      }))
      .sort(compareCompiledRules)
  };

  return { ok: true, policy: compiled, diagnostics };
}
