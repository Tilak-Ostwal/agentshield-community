import { describe, expect, it } from "vitest";

import { getPolicyPack, listPolicyPacks } from "./builtInPolicyPacks.js";

describe("built-in policy packs", () => {
  it("includes all required packs", () => {
    expect(listPolicyPacks().map((pack) => pack.packId)).toEqual([
      "ci-security",
      "dev-warning-mode",
      "enterprise-sensitive-data",
      "registry-enforced",
      "sandbox-required",
      "strict-mcp-local"
    ]);
  });

  it("dev-warning-mode includes production warning", () => {
    expect(getPolicyPack("dev-warning-mode").warnings.join(" ")).toContain("not production-ready");
  });

  it("registry-enforced includes registry trust expectations", () => {
    expect(JSON.stringify(getPolicyPack("registry-enforced"))).toContain("registry");
    expect(JSON.stringify(getPolicyPack("registry-enforced"))).toContain("capability_drift");
  });
});
