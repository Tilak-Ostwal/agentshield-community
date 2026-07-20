import { describe, expect, it } from "vitest";
import { getScoringProfile, parseScoringProfile } from "./scoringProfile.js";

describe("scoringProfile", () => {
  it("loads strict profile", () => {
    expect(getScoringProfile("strict")).toMatchObject({ failOnCriticalFailure: true });
  });

  it("parses balanced profile", () => {
    expect(parseScoringProfile("balanced")).toBe("balanced");
  });
});
