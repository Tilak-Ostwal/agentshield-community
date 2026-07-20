import { describe, expect, it } from "vitest";

import { inferCapabilities } from "./capabilityInference.js";

describe("capability inference", () => {
  it("detects filesystem.read", () => {
    expect(inferCapabilities({ actionType: "tool_call", toolName: "filesystem.read", input: { path: "/mock/a" } })).toContain("filesystem.read");
  });

  it("detects shell.exec and code_execution", () => {
    expect(inferCapabilities({ actionType: "tool_call", toolName: "shell.exec", input: { command: "node x" } })).toEqual(
      expect.arrayContaining(["shell.exec", "code_execution"])
    );
  });

  it("detects network.post exfiltration risk", () => {
    expect(inferCapabilities({ actionType: "tool_call", toolName: "network.post", input: { url: "https://example.invalid" } })).toEqual(
      expect.arrayContaining(["network.write", "network.exfiltration_risk", "external_side_effect"])
    );
  });

  it("ignores unknown declared capabilities", () => {
    expect(
      inferCapabilities({
        actionType: "tool_call",
        toolName: "custom.safe",
        metadata: { tool: { capabilities: ["not.real"] } }
      })
    ).toEqual([]);
  });
});
