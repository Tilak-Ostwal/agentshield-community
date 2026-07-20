import { describe, expect, it } from "vitest";
import { computeIncidentHash, verifyIncident } from "./incidentVerifier.js";
import { RuntimeIncident } from "./incidentSchema.js";

describe("incidentVerifier", () => {
  const validIncident: Omit<RuntimeIncident, "incidentHash"> = {
    version: 1,
    incidentId: "inc-1",
    createdAt: new Date().toISOString(),
    title: "T",
    severity: "info",
    status: "blocked",
    category: "unknown",
    summary: "S",
    finalDecision: "allow",
    affectedTools: [],
    timeline: [],
    remediation: [],
    limitations: []
  };

  it("incident hash is deterministic", () => {
    const hash1 = computeIncidentHash(validIncident);
    const hash2 = computeIncidentHash(validIncident);
    expect(hash1).toBe(hash2);
  });

  it("changing incident contents fails verification", () => {
    const hash = computeIncidentHash(validIncident);
    const incident = { ...validIncident, incidentHash: hash };
    const modified = { ...incident, summary: "modified" };
    expect(verifyIncident(modified).valid).toBe(false);
  });

  it("changing incidentHash fails verification", () => {
    const incident = { ...validIncident, incidentHash: "wrong" };
    expect(verifyIncident(incident).valid).toBe(false);
  });
});
