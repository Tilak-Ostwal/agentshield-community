import { describe, expect, it } from "vitest";
import { generateCapabilityMaturityMatrix } from "./capabilityMaturityMatrix.js";
import { REQUIRED_DOMAINS } from "./readinessDomain.js";

describe("capabilityMaturityMatrix", () => {
  it("capability maturity matrix includes all required domains", () => {
    const matrix = generateCapabilityMaturityMatrix();
    for (const domain of REQUIRED_DOMAINS) {
      expect(matrix[domain]).toBeDefined();
    }
  });
});
