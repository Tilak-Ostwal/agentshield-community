import { describe, expect, it } from "vitest";
import { resourceLimitsSchema } from "./resourceLimits.js";

describe("resource limits", () => {
  it("parses valid limits", () => {
    expect(resourceLimitsSchema.parse({ maxExecutionMs: 1000, maxOutputBytes: 4096 })).toMatchObject({ maxExecutionMs: 1000 });
  });
});
