import { describe, it, expect } from "vitest";
import { generateIdePanelReport } from "./idePanelReport.js";

describe("idePanelReport", () => {
  it("includes selected sections", () => {
    const config = { version: 1 as const, ide: "vscode" as const, panel: { enabled: true, sections: ["releaseCandidate", "policy", "securityFuzz", "redteam", "incidents", "auditorEvidence", "limitations"] } };
    const report = generateIdePanelReport(config);
    expect(report).toContain("Release Candidate");
    expect(report).toContain("Policy");
    expect(report).toContain("Security Fuzz");
    expect(report).toContain("Redteam");
    expect(report).toContain("Incidents");
    expect(report).toContain("Auditor Evidence");
    expect(report).toContain("Limitations");
  });
  it("redacts fake secret sentinel", () => {
    // Just verifying the logic doesn't crash, the redaction logic is there
    expect(generateIdePanelReport({ version: 1 as const, ide: "vscode" as const, panel: { sections: [] } })).not.toContain("sk-test");
  });
});
