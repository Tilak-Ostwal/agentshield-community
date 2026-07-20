import { describe, expect, it } from "vitest";
import { REQUIRED_DOMAINS, getMissingRequiredDomains } from "./readinessDomain.js";
import type { ReadinessDomain } from "./readinessDomain.js";

describe("readinessDomain", () => {
  it("readiness domains include all required domains", () => {
    expect(REQUIRED_DOMAINS.length).toBeGreaterThan(0);
    expect(REQUIRED_DOMAINS).toContain("core-runtime-security");
    expect(REQUIRED_DOMAINS).toContain("release-candidate-gate");
  });

  it("missing critical domain creates blocker", () => {
    const emptyDomains: ReadinessDomain[] = [];
    const missing = getMissingRequiredDomains(emptyDomains);
    expect(missing).toContain("core-runtime-security");
  });
});
