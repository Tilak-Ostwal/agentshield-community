import { describe, expect, it } from "vitest";
import { policyV2Schema } from "./policyV2Schema.js";

describe("policyV2Schema", () => {
  it("parses valid policy v2", () => {
    expect(policyV2Schema.safeParse({
      version: 2,
      name: "test",
      defaultDecision: "deny",
      mode: "strict",
      rules: [{
        id: "allow-read",
        effect: "allow",
        priority: 1,
        match: { capability: "filesystem.read" }
      }]
    }).success).toBe(true);
  });

  it("rejects invalid rule effect", () => {
    expect(policyV2Schema.safeParse({
      version: 2,
      name: "test",
      defaultDecision: "deny",
      mode: "strict",
      rules: [{
        id: "bad",
        effect: "permit",
        priority: 1,
        match: { capability: "filesystem.read" }
      }]
    }).success).toBe(false);
  });
});
