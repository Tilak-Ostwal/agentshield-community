import { describe, it, expect } from "vitest";
import { formatConsumerEvaluationReportMarkdown } from "./consumerEvaluationReport.js";

describe("ConsumerEvaluationReport", () => {
  it("consumer report Markdown contains score, checks, evidence, limitations, and next steps", () => {
    const report = {
      score: 100,
      passedChecks: ["test-check"],
      failedChecks: ["fail-check"],
      evidence: ["test-evidence"],
      limitations: ["test-limit"],
      nextSteps: ["test-step"]
    };
    const md = formatConsumerEvaluationReportMarkdown(report);
    expect(md).toContain("**Score**: 100");
    expect(md).toContain("test-check");
    expect(md).toContain("fail-check");
    expect(md).toContain("test-evidence");
    expect(md).toContain("test-limit");
    expect(md).toContain("test-step");
  });
});
