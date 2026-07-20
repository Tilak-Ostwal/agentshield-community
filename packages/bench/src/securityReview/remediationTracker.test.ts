import { describe, it, expect } from "vitest";
import { parseRemediationTracker } from "./remediationTracker.js";

describe("remediationTrackerSchema", () => {
  it("parses valid tracker", () => {
    const valid = {
      findingId: "vuln-1",
      status: "resolved",
      resolutionNotes: "Fixed in PR #123",
      resolvedAt: "2026-06-29T00:00:00.000Z",
    };
    expect(() => parseRemediationTracker(valid)).not.toThrow();
  });
});
