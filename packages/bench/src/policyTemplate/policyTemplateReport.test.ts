import { describe, expect, it } from "vitest";

import { listPolicyTemplates } from "./builtInPolicyTemplates.js";
import { generatePolicyTemplateJson, generatePolicyTemplateListText, generatePolicyTemplateShowText } from "./policyTemplateReport.js";
import { renderPolicyTemplate } from "./policyTemplateRenderer.js";

describe("policyTemplateReport", () => {
  it("renders list text", () => {
    expect(generatePolicyTemplateListText(listPolicyTemplates())).toContain("strict-mcp-local");
  });

  it("renders show text", () => {
    expect(generatePolicyTemplateShowText(renderPolicyTemplate("strict-mcp-local"))).toContain("Policy template: strict-mcp-local");
  });

  it("renders JSON without raw secrets", () => {
    expect(generatePolicyTemplateJson({ token: "sk-test-REDACT-ME" })).not.toContain("sk-test-REDACT-ME");
  });
});
