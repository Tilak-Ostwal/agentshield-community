import { compilePolicyV2, redactSecrets, type PolicyV2 } from "@agentshield/core";

import { getPolicyTemplate } from "./builtInPolicyTemplates.js";
import type { PolicyTemplate } from "./policyTemplateSchema.js";

export interface RenderedPolicyTemplate {
  templateId: string;
  name: string;
  description: string;
  warnings: string[];
  policy: PolicyV2;
}

export function renderPolicyTemplate(templateOrId: PolicyTemplate | string): RenderedPolicyTemplate {
  const template = typeof templateOrId === "string" ? getPolicyTemplate(templateOrId) : templateOrId;
  const compiled = compilePolicyV2(template.policy);
  if (!compiled.ok) {
    throw new Error(`invalid policy template ${template.id}: ${compiled.diagnostics.map((diagnostic) => diagnostic.message).join("; ")}`);
  }
  return redactSecrets({
    templateId: template.id,
    name: template.name,
    description: template.description,
    warnings: template.warnings,
    policy: template.policy
  }).value as RenderedPolicyTemplate;
}

export function renderPolicyTemplateJson(templateOrId: PolicyTemplate | string): string {
  return JSON.stringify(renderPolicyTemplate(templateOrId).policy, null, 2);
}
