import { existsSync } from "node:fs";

import { describe, expect, it } from "vitest";

import {
  formatDemoHtmlReport,
  formatDemoJsonReport,
  runDemoScenarios,
  runDemoScenario
} from "./demoAgent.js";
import { demoScenarios } from "./demoScenarios.js";

describe("demo agent", () => {
  it("returns expected decisions for every demo scenario", () => {
    const run = runDemoScenarios();

    expect(run).toMatchObject({
      total: 5,
      passed: 5,
      failed: 0
    });
    expect(run.results.map((result) => [result.scenarioId, result.actual])).toEqual([
      ["unknown-tool-denied", "deny"],
      ["secret-exfiltration", "deny"],
      ["write-then-exec", "deny"],
      ["fingerprint-change", "require_human_review"],
      ["safe-readonly-allowed", "allow"]
    ]);
  });

  it("does not include the fake secret in output traces", () => {
    const scenario = demoScenarios.find((candidate) => candidate.id === "secret-exfiltration");

    expect(scenario).toBeDefined();

    const result = runDemoScenario(scenario!);
    const serializedTraces = JSON.stringify(result.traceEvents);

    expect(serializedTraces).not.toContain("sk-test-REDACT-ME");
    expect(serializedTraces).toContain("[REDACTED]");
  });

  it("formats valid JSON output", () => {
    const parsed = JSON.parse(formatDemoJsonReport(runDemoScenarios()));

    expect(parsed).toMatchObject({
      total: 5,
      failed: 0
    });
  });

  it("formats HTML output with scenario names", () => {
    const html = formatDemoHtmlReport(runDemoScenarios());

    expect(html).toContain("<!doctype html>");
    expect(html).toContain("Secret Exfiltration");
    expect(html).toContain("Safe Readonly Filesystem Read");
  });

  it("allows safe readonly access only when policy explicitly allows it", () => {
    const scenario = demoScenarios.find((candidate) => candidate.id === "safe-readonly-allowed");

    expect(scenario).toBeDefined();
    expect(runDemoScenario(scenario!).actual).toBe("allow");
  });

  it("does not create mock paths on the real filesystem", () => {
    runDemoScenarios();

    expect(existsSync("/mock/project/file.txt")).toBe(false);
  });
});
