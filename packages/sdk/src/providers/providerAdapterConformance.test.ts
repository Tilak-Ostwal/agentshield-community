import { describe, expect, it } from "vitest";
import { checkProviderConformance } from "./providerAdapterConformance.js";

describe("providerAdapterConformance", () => {
  it("provider conformance report passes required fixtures", () => {
    const res = checkProviderConformance();
    expect(res.ok).toBe(true);
  });
});
