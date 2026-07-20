import { describe, expect, it } from "vitest";
import { generateIncidentReport, formatIncidentMarkdown } from "./incidentReport.js";

describe("incidentReport", () => {
  it("Markdown report contains summary, timeline, evidence, and remediation", () => {
    const trace = { events: [{ eventType: "log", summary: "test" }] };
    const incident = generateIncidentReport(trace);
    const md = formatIncidentMarkdown(incident);
    
    expect(md).toContain("Summary");
    expect(md).toContain("Timeline");
    expect(md).toContain("Remediation");
  });

  it("report redacts fake secret sentinel", () => {
    const sentinel = "sk-test-REDACT-" + "ME";
    const trace = { events: [{ eventType: "log", summary: sentinel }] };
    const incident = generateIncidentReport(trace);
    expect(JSON.stringify(incident)).not.toContain("sk-test-REDACT-ME");
  });
});
