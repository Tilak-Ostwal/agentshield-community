import { describe, expect, it } from "vitest";
import { formatAuditorEvidenceMarkdown, formatAuditorEvidenceJson } from "./auditorEvidenceReport.js";
import type { AuditorEvidencePack } from "./auditorEvidencePackSchema.js";

interface AuditorEvidenceJsonReport {
  packId: string;
}

describe("auditorEvidenceReport", () => {
  const pack: AuditorEvidencePack = {
    version: 1,
    packId: "pack-1",
    createdAt: "2026-06-29T00:00:00.000Z",
    checks: {
      releaseCheck: { passed: true, total: 100 }
    },
    evidence: { traceBundlesVerified: true, rawSecretLeakDetected: false, redactionRequired: true },
    limitations: ["Local deterministic evidence only; not a legal certification."],
    packHash: "abc"
  };

  it("report JSON is valid", () => {
    const json = formatAuditorEvidenceJson(pack);
    const parsed = JSON.parse(json) as AuditorEvidenceJsonReport;
    expect(parsed.packId).toBe("pack-1");
  });

  it("report Markdown contains major sections", () => {
    const md = formatAuditorEvidenceMarkdown(pack);
    expect(md).toContain("## Workspace");
    expect(md).toContain("## Core Security");
    expect(md).toContain("## Checks");
    expect(md).toContain("## Integrity");
  });

  it("report contains no raw fake secret", () => {
    const md = formatAuditorEvidenceMarkdown(pack);
    expect(md).not.toContain("sk-test-REDACT-ME");
  });

  it("report includes non-certification disclaimer", () => {
    const md = formatAuditorEvidenceMarkdown(pack);
    expect(md).toContain("Local deterministic evidence only; not a legal certification.");
  });
});
