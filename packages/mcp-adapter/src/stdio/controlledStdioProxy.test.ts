import { describe, expect, it } from "vitest";

import { runMcpStdioDemo } from "../proxy/mcpProxy.js";

describe("controlled stdio proxy integration", () => {
  it("forwards allowed filesystem.read to controlled stdio only after gates pass", () => {
    const run = runMcpStdioDemo({ includeEvidenceBundle: true });
    const read = run.results.find((result) => result.scenario.includes("filesystem.read"));

    expect(read?.status).toBe("PASS");
    expect(read?.forwarded).toBe(true);
    expect(run.processLifecycleEvents).toBeGreaterThan(0);
  });

  it("does not forward denied, human-review, or dangerous calls", () => {
    const run = runMcpStdioDemo();

    expect(run.results.find((result) => result.scenario.includes("unknown"))?.forwarded).toBe(false);
    expect(run.results.find((result) => result.scenario.includes("network.post"))?.forwarded).toBe(false);
    expect(run.results.find((result) => result.scenario.includes("filesystem.write"))?.forwarded).toBe(false);
    expect(run.results.find((result) => result.scenario.includes("shell.exec"))?.forwarded).toBe(false);
  });

  it("redacts process lifecycle evidence and does not leak the fake secret", () => {
    const run = runMcpStdioDemo({ includeEvidenceBundle: true });
    const serialized = JSON.stringify(run);

    expect(run.evidenceBundle?.events.some((event) => event.type === "process_started")).toBe(true);
    expect(serialized).not.toContain("sk-test-REDACT-ME");
    expect(run.failed).toBe(0);
  });

  it("works with sandbox enabled without forwarding sandbox-blocked actions", () => {
    const run = runMcpStdioDemo({ includeEvidenceBundle: true, sandboxEnabled: true });

    expect(run.results.find((result) => result.scenario.includes("safe filesystem.read"))?.forwarded).toBe(true);
    expect(run.results.find((result) => result.scenario.includes("shell.exec"))?.forwarded).toBe(false);
    expect(run.results.find((result) => result.scenario.includes("network.post"))?.forwarded).toBe(false);
  });
});
