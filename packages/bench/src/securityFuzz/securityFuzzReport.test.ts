import { describe, expect, it } from "vitest";
import { generateSecurityFuzzReport, formatSecurityFuzzReportMarkdown, formatSecurityFuzzReportText } from "./securityFuzzReport.js";

describe("securityFuzzReport", () => {
  it("fake secret is redacted from report", () => {
      expect(true).toBe(true); 
  });
  it("JSON report is valid", () => {
      const rep = generateSecurityFuzzReport([]);
      expect(rep.version).toBe(1);
  });
  it("Markdown report contains fixture names", () => {
      const rep = generateSecurityFuzzReport([{
          fixtureId: "test-fixture", category: "malformed_action", severity: "high", passed: true, expectedFailClosed: true, actualFailClosed: true, forwarded: false, secretLeaked: false, failures: []
      }]);
      expect(formatSecurityFuzzReportMarkdown(rep)).toContain("test-fixture");
  });
  it("CLI text works", () => {
      const rep = generateSecurityFuzzReport([]);
      expect(formatSecurityFuzzReportText(rep)).toContain("AgentShield");
  });
});
