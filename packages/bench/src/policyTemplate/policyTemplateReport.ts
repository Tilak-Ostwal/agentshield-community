import { redactSecrets } from "@agentshield/core";

import type { PolicyTemplate } from "./policyTemplateSchema.js";
import type { RenderedPolicyTemplate } from "./policyTemplateRenderer.js";

export function generatePolicyTemplateListText(templates: PolicyTemplate[]): string {
  return String(redactSecrets(["AgentShield policy templates", ...templates.map((template) => `${template.id} - ${template.name} (${template.safetyLevel})`)].join("\n")).value);
}

export function generatePolicyTemplateShowText(rendered: RenderedPolicyTemplate): string {
  return String(redactSecrets([
    `Policy template: ${rendered.templateId}`,
    rendered.name,
    rendered.description,
    ...(rendered.warnings.length === 0 ? [] : ["Warnings:", ...rendered.warnings.map((warning) => `- ${warning}`)]),
    `Rules: ${rendered.policy.rules.length}`
  ].join("\n")).value);
}

export function generatePolicyTemplateJson(value: unknown): string {
  return JSON.stringify(redactSecrets(value).value, null, 2);
}
