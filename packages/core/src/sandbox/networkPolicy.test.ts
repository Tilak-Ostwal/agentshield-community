import { describe, expect, it } from "vitest";
import { networkPolicySchema } from "./networkPolicy.js";

describe("network policy", () => {
  it("parses allowlist policy", () => {
    expect(networkPolicySchema.parse({ mode: "allowlist", allowDomains: ["example.invalid"] })).toMatchObject({ mode: "allowlist" });
  });
});
