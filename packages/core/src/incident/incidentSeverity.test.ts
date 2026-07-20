import { describe, expect, it } from "vitest";
import { determineIncidentSeverity } from "./incidentSeverity.js";

describe("incidentSeverity", () => {
  it("severity classifier marks secret exfiltration as critical", () => {
    expect(determineIncidentSeverity("secret_exfiltration")).toBe("critical");
  });

  it("severity classifier marks PII export as high or critical", () => {
    expect(determineIncidentSeverity("pii_export")).toBe("high");
  });
});
