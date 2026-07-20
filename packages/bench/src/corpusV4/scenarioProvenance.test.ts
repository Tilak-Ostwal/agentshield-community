import { describe, it, expect } from "vitest";
import { scenarioProvenanceSchema } from "./scenarioProvenance.js";

describe("scenarioProvenance", () => {
  it("scenario provenance is required", () => {
    expect(scenarioProvenanceSchema.safeParse({}).success).toBe(false);
  });
});
