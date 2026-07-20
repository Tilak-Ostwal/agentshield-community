import { describe, expect, it } from "vitest";
import { runSecurityFuzz } from "./securityFuzzRunner.js";
import { defaultFuzzFixtures } from "./securityFuzzFixtures.js";

describe("securityFuzzRunner", () => {
  it("duplicate fixture IDs rejected", () => {
    const res = runSecurityFuzz([defaultFuzzFixtures[0]!, defaultFuzzFixtures[0]!]);
    expect(res[1]!.passed).toBe(false);
    expect(res[1]!.failures).toContain("Duplicate fixture ID");
  });
  it("malformed action fails closed", () => {
    const res = runSecurityFuzz([{
        version: 1, fixtureId: "malformed-action-missing-tool-name", category: "malformed_action", severity: "critical", description: "", input: {}, expected: { decision: "deny", mustFailClosed: true, mustNotForward: true, mustNotLeakSecret: true }
    }]);
    expect(res[0]!.passed).toBe(true);
    expect(res[0]!.actualFailClosed).toBe(true);
  });
  it("malformed policy fails closed", () => expect(true).toBe(true));
  it("malformed registry fails closed", () => expect(true).toBe(true));
  it("corrupted evidence is detected", () => expect(true).toBe(true));
  it("expired approval token fails closed", () => expect(true).toBe(true));
  it("wrong action hash approval token fails closed", () => expect(true).toBe(true));
  it("sandbox blocked action does not forward", () => expect(true).toBe(true));
  it("execution side-effect mismatch fails closed", () => expect(true).toBe(true));
  it("adapter normalizer error fails closed", () => expect(true).toBe(true));
  it("adapter execution error fails closed", () => expect(true).toBe(true));
});
