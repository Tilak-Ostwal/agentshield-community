import { describe, expect, it } from "vitest";

import { DEFAULT_POLICY_DECISION, failClosed } from "./index.js";

describe("core policy primitives", () => {
  it("defaults to deny", () => {
    expect(DEFAULT_POLICY_DECISION).toBe("deny");
  });

  it("fails closed", () => {
    expect(failClosed("invalid input")).toEqual({
      decision: "deny",
      ruleId: "fail-closed",
      reason: "invalid input"
    });
  });
});
