import { describe, expect, it } from "vitest";

import { parsePolicyTemplate } from "./policyTemplateSchema.js";

const validTemplate = {
  id: "test",
  name: "Test",
  description: "Test template",
  safetyLevel: "strict",
  productionReady: false,
  warnings: [],
  tags: ["test"],
  policy: {
    version: 2,
    name: "test",
    defaultDecision: "deny",
    mode: "strict",
    rules: [{ id: "deny-shell", effect: "deny", priority: 1, match: { capability: "shell.exec" } }]
  }
};

describe("policyTemplateSchema", () => {
  it("parses valid template", () => {
    expect(parsePolicyTemplate(validTemplate).id).toBe("test");
  });

  it("rejects invalid template", () => {
    expect(() => parsePolicyTemplate({ ...validTemplate, policy: { version: 2 } })).toThrow();
  });
});
