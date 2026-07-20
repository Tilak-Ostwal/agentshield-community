import { describe, expect, it } from "vitest";
import { generateIncidentRemediation } from "./incidentRemediation.js";

describe("incidentRemediation", () => {
  it("remediation output is deterministic", () => {
    const r = generateIncidentRemediation("secret_exfiltration");
    expect(r[0]!.title).toContain("deny rules enabled");
  });
});
