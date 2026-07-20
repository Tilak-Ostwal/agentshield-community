import { describe, expect, it } from "vitest";
import { generateIncidentTimeline } from "./incidentTimeline.js";

describe("incidentTimeline", () => {
  it("incident timeline order is deterministic", () => {
    const t = generateIncidentTimeline([{ eventType: "a" }, { eventType: "b" }]);
    expect(t[0]!.step).toBe(1);
    expect(t[1]!.eventType).toBe("b");
  });
});
