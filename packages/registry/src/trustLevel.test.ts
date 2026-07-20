import { describe, expect, it } from "vitest";

import { trustDecisionImpact } from "./trustLevel.js";

describe("trust level", () => {
  it("maps trust to conservative decision impacts", () => {
    expect(trustDecisionImpact("trusted")).toBe("none");
    expect(trustDecisionImpact("reviewed")).toBe("none");
    expect(trustDecisionImpact("unknown")).toBe("require_human_review");
    expect(trustDecisionImpact("blocked")).toBe("deny");
  });
});
