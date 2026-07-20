import { describe, expect, it } from "vitest";
import { runDefaultBenchmark } from "../index.js";
import { generateMarkdownReport } from "./markdownReport.js";

describe("markdownReport", () => {
  it("includes scenario names and score", () => {
    const report = generateMarkdownReport(runDefaultBenchmark("balanced"));
    expect(report).toContain("AgentShield Bench Report");
    expect(report).toContain("Write Then Exec");
    expect(report).toContain("Score:");
    expect(report).not.toContain("sk-test-REDACT-ME");
  });
});
