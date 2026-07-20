import { describe, expect, it } from "vitest";
import { failureModeFixtureSchema } from "./failureModeSchema.js";

describe("failureModeSchema", () => {
  it("parses valid fixture", () => {
    const fixture = {
      version: 1,
      fixtureId: "test-fixture",
      category: "malformed_action",
      severity: "critical",
      description: "Test",
      input: {},
      expected: {
        decision: "deny",
        mustFailClosed: true,
        mustNotForward: true,
        mustNotLeakSecret: true
      }
    };
    expect(failureModeFixtureSchema.safeParse(fixture).success).toBe(true);
  });
});
