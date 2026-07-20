import { describe, expect, it } from "vitest";

import { defaultDenyPolicy, parseSdkConfig, sdkConfigSchema } from "./sdkConfig.js";

describe("SDK config", () => {
  it("parses an empty default safe config", () => {
    expect(parseSdkConfig({})).toEqual({});
  });

  it("rejects invalid mode", () => {
    expect(sdkConfigSchema.safeParse({ mode: "unsafe" }).success).toBe(false);
  });

  it("provides a default deny policy", () => {
    expect(defaultDenyPolicy()).toMatchObject({ version: 1, defaultDecision: "deny" });
  });
});
