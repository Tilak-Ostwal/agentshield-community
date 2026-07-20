import { describe, expect, it } from "vitest";
import { generatePolicyProvenance } from "./policyProvenance.js";

describe("policyProvenance", () => {
  it("generates provenance with proper hash", () => {
    const prov = generatePolicyProvenance({ version: 2, name: "test", mode: "strict", defaultDecision: "deny", rules: [] } as any, { source: "manual", sourceId: "test" });
    expect(prov.source).toBe("manual");
    expect(prov.policyHash).toBeDefined();
    expect(prov.generatedBy).toBe("agentshield");
  });
});
