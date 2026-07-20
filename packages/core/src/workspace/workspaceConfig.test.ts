import { describe, expect, it } from "vitest";

import { defaultWorkspaceConfig, parseWorkspaceConfig, renderWorkspaceConfigJson } from "./workspaceConfig.js";

describe("workspace config schema", () => {
  it("parses valid config", () => {
    const result = parseWorkspaceConfig(defaultWorkspaceConfig);

    expect(result.ok).toBe(true);
    expect(result.config).toMatchObject({ profile: "strict", policyPack: "strict-mcp-local", evidence: { redactionRequired: true } });
  });

  it("rejects invalid profile", () => {
    const result = parseWorkspaceConfig({ ...defaultWorkspaceConfig, profile: "unsafe" });

    expect(result.ok).toBe(false);
    expect(result.error).toContain("Invalid enum value");
  });

  it("renders config without raw fake secrets", () => {
    expect(renderWorkspaceConfigJson()).not.toContain("sk-test-REDACT-ME");
  });
});
