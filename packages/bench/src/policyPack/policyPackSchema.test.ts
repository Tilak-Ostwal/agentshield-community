import { describe, expect, it } from "vitest";

import { strictMcpLocalPolicyPack } from "./builtInPolicyPacks.js";
import { parsePolicyPack } from "./policyPackSchema.js";

describe("policy pack schema", () => {
  it("parses valid pack", () => {
    expect(parsePolicyPack(strictMcpLocalPolicyPack)).toMatchObject({ ok: true });
  });

  it("rejects invalid pack", () => {
    expect(parsePolicyPack({ ...strictMcpLocalPolicyPack, safetyLevel: "unsafe" })).toMatchObject({ ok: false });
  });
});
