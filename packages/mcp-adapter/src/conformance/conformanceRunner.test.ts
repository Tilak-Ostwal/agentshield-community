import { describe, expect, it } from "vitest";
import { runConformanceFixture, runConformanceFixtures, runOversizedLineFixture } from "./conformanceRunner.js";
import { defineConformanceFixture } from "./conformanceFixture.js";

describe("conformanceRunner", () => {
  it("passes valid fixtures", () => {
    expect(runConformanceFixtures().failed).toBe(0);
  });

  it("fails when denied call is forwarded", () => {
    const result = runConformanceFixture(defineConformanceFixture({
      id: "bad",
      name: "Bad",
      description: "Expected impossible forwarded forbidden tool.",
      inputMessages: [{ jsonrpc: "2.0", id: "read", method: "tools/call", params: { name: "filesystem.read", arguments: { path: "/mock/project/README.md" } } }],
      expected: { forbiddenForwardedToolNames: ["filesystem.read"] }
    }));
    expect(result.passed).toBe(false);
  });

  it("detects unredacted fake secret expectation", () => {
    const result = runConformanceFixture(defineConformanceFixture({
      id: "secret-check",
      name: "Secret Check",
      description: "Impossible secret check should fail if present.",
      inputMessages: [{ jsonrpc: "2.0", id: "list", method: "tools/list" }],
      expected: { mustRedactSecrets: ["filesystem.read"] }
    }));
    expect(result.passed).toBe(false);
  });

  it("oversized message is rejected safely", () => {
    expect(runOversizedLineFixture()).toMatchObject({ passed: true });
  });
});
