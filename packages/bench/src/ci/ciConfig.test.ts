import { describe, expect, it } from "vitest";

import { parseCiConfig } from "./ciConfig.js";

describe("CI config", () => {
  it("applies defaults", () => {
    expect(parseCiConfig({ version: 1 })).toMatchObject({
      ok: true,
      config: {
        profile: "strict",
        failOnCritical: true,
        failOnHigh: false,
        minimumScorePercentage: 100,
        requireEvidence: false
      }
    });
  });

  it("rejects invalid config safely", () => {
    expect(parseCiConfig({ version: 2, profile: "unsafe" })).toMatchObject({ ok: false });
  });
});
