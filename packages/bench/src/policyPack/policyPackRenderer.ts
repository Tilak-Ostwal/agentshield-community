import { compilePolicyV2, redactSecrets, type PolicyV2 } from "@agentshield/core";

import { getPolicyPack } from "./builtInPolicyPacks.js";
import type { PolicyPack } from "./policyPackSchema.js";

export interface RenderedPolicyPack {
  packId: string;
  name: string;
  description: string;
  safetyLevel: PolicyPack["safetyLevel"];
  compatibleWorkspaceProfiles: PolicyPack["compatibleWorkspaceProfiles"];
  tags: string[];
  requiredChecks: PolicyPack["requiredChecks"];
  warnings: string[];
  policy: PolicyV2;
}

function modeForSafetyLevel(safetyLevel: PolicyPack["safetyLevel"]): PolicyV2["mode"] {
  if (safetyLevel === "dev") return "balanced";
  return "strict";
}

export function renderPolicyPack(packOrId: PolicyPack | string): RenderedPolicyPack {
  const pack = typeof packOrId === "string" ? getPolicyPack(packOrId) : packOrId;
  const policy: PolicyV2 = {
    version: 2,
    name: pack.packId,
    defaultDecision: "deny",
    mode: modeForSafetyLevel(pack.safetyLevel),
    rules: pack.rules
  };
  const compiled = compilePolicyV2(policy);
  if (!compiled.ok) {
    throw new Error(`invalid policy pack ${pack.packId}: ${compiled.diagnostics.map((diagnostic) => diagnostic.message).join("; ")}`);
  }

  return redactSecrets({
    packId: pack.packId,
    name: pack.name,
    description: pack.description,
    safetyLevel: pack.safetyLevel,
    compatibleWorkspaceProfiles: pack.compatibleWorkspaceProfiles,
    tags: pack.tags,
    requiredChecks: pack.requiredChecks,
    warnings: pack.warnings,
    policy
  }).value as RenderedPolicyPack;
}

export function renderPolicyPackJson(packOrId: PolicyPack | string): string {
  return JSON.stringify(renderPolicyPack(packOrId).policy, null, 2);
}
