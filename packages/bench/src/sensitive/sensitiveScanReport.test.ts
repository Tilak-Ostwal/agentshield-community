import { describe, expect, it } from "vitest";
import { generateSensitiveScanReport, formatSensitiveScanReportMarkdown } from "./sensitiveScanReport.js";

describe("sensitiveScanReport", () => {
  it("generates a report with findings", () => {
    const report = generateSensitiveScanReport({ email: "test@example.com" });
    expect(report.totalFindings).toBe(1);
    expect(report.findings[0]?.type).toBe("email_address");
  });

  it("fake secret sentinel is redacted in JSON report", () => {
    const report = generateSensitiveScanReport({ foo: "sk-test-REDACT-ME" });
    expect(JSON.stringify(report)).not.toContain("sk-test-REDACT-ME");
    expect(JSON.stringify(report)).toContain("[REDACTED:unknown_secret_like]");
  });

  it("fake secret sentinel is redacted in Markdown report", () => {
    const report = generateSensitiveScanReport({ foo: "sk-test-REDACT-ME" });
    const md = formatSensitiveScanReportMarkdown(report);
    expect(md).not.toContain("sk-test-REDACT-ME");
    expect(md).toContain("[REDACTED:unknown_secret_like]");
  });
});
