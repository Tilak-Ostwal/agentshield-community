import { describe, expect, it } from "vitest";
import { calculateReadinessScore } from "./v1ReadinessScore.js";

describe("v1ReadinessScore", () => {
  it("readiness score fails critical blocker", () => {
    const result = calculateReadinessScore([], [{ blockerId: "1", severity: "critical", description: "", remediation: "" }]);
    expect(result.grade).toBe("fail");
  });

  it("readiness score warns high blocker", () => {
    const result = calculateReadinessScore([], [{ blockerId: "2", severity: "high", description: "", remediation: "" }]);
    expect(result.grade).toBe("warning");
  });

  it("readiness score passes complete bounded report", () => {
    const result = calculateReadinessScore([{ domainId: "1", name: "", maturity: "v1_ready", status: "pass", evidence: [], blockers: [], gaps: [], safeClaims: [], forbiddenClaims: [] }], []);
    expect(result.grade).toBe("pass");
  });
});
