import { describe, expect, it } from "vitest";
import { defaultFuzzFixtures } from "./securityFuzzFixtures.js";

describe("securityFuzzFixtures", () => {
  it("provides required fixtures", () => {
    expect(defaultFuzzFixtures.length).toBeGreaterThan(0);
  });
});
