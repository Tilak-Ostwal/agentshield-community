import { describe, expect, it } from "vitest";
import { formatReleaseCandidateReportMarkdown, formatReleaseCandidateReportJson } from "./releaseCandidateReport.js";

interface ReleaseCandidateJsonReport {
  score: {
    score: number;
  };
  disclaimer: string;
}

describe("releaseCandidateReport", () => {
  const manifest = {
    version: 1 as const,
    releaseId: "v0.2.0-beta",
    name: "AgentShield Veritas v0.2.0 Beta Release Candidate",
    maturity: "beta" as const,
    createdAt: "2026-06-29T00:00:00.000Z",
    evidenceArtifacts: ["auditor-evidence.json"]
  };
  const score = { version: 1 as const, score: 100, maxScore: 100, grade: "pass" as const, criticalFailures: 0, highFailures: 0, warnings: 0, categories: { security: 20, testing: 20, docs: 20, examples: 20, integrity: 10, releaseHygiene: 10 } };
  
  it("release report Markdown contains score, gates, evidence, limitations, and disclaimer", () => {
    const md = formatReleaseCandidateReportMarkdown(manifest, score, { ok: true, leftoverFiles: [] }, [], []);
    expect(md).toContain("Readiness Score");
    expect(md).toContain("auditor-evidence.json");
    expect(md).toContain("NOT a legal compliance certification");
  });

  it("release report JSON is valid", () => {
    const jsonStr = formatReleaseCandidateReportJson(manifest, score, { ok: true, leftoverFiles: [] }, [], []);
    const parsed = JSON.parse(jsonStr) as ReleaseCandidateJsonReport;
    expect(parsed.score.score).toBe(100);
    expect(parsed.disclaimer).toBeDefined();
  });
});
