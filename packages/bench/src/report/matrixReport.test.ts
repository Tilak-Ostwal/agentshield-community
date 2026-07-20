import { describe, expect, it } from "vitest";
import { runDefaultBenchmark } from "../index.js";
import { generateMatrixReport } from "./matrixReport.js";

describe("matrixReport", () => {
  it("includes categories and severity counts", () => {
    const report = generateMatrixReport(runDefaultBenchmark("balanced"));
    expect(report).toContain("AgentShield Benchmark Matrix");
    expect(report).toContain("tool_abuse");
    expect(report).toContain("Critical");
  });
});
