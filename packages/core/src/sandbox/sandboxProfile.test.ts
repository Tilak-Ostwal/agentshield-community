import { describe, expect, it } from "vitest";
import { sandboxProfileSchema } from "./sandboxProfile.js";

const validProfile = {
  version: 1,
  profileId: "sandbox_readonly",
  name: "Read Only",
  isolationLevel: "readonly",
  filesystem: { readonly: true, allowRead: ["/mock/project/**"] },
  network: { mode: "blocked" },
  resourceLimits: { maxExecutionMs: 1000 },
  allowedSideEffects: ["local_read"],
  forbiddenSideEffects: ["local_write"],
  reason: "read only"
};

describe("sandbox profile", () => {
  it("parses valid profile", () => {
    expect(sandboxProfileSchema.parse(validProfile)).toMatchObject({ profileId: "sandbox_readonly" });
  });

  it("fails invalid profile", () => {
    expect(() => sandboxProfileSchema.parse({ ...validProfile, isolationLevel: "root" })).toThrow();
  });
});
