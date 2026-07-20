import { describe, expect, it } from "vitest";
import { runtimeIncidentSchema } from "./incidentSchema.js";

describe("runtimeIncidentSchema", () => {
  it("incident schema parses valid incident", () => {
    const valid = {
      version: 1,
      incidentId: "inc-1",
      createdAt: new Date().toISOString(),
      title: "Test",
      severity: "critical",
      status: "blocked",
      category: "unknown",
      summary: "Sum",
      finalDecision: "deny",
      affectedTools: [],
      timeline: [],
      remediation: [],
      limitations: ["Test limitation"],
      incidentHash: "hash"
    };
    expect(runtimeIncidentSchema.safeParse(valid).success).toBe(true);
  });

  it("invalid incident is rejected", () => {
    expect(runtimeIncidentSchema.safeParse({}).success).toBe(false);
  });
});
