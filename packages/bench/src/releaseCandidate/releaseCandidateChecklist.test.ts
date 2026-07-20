import { describe, expect, it } from "vitest";
import { RELEASE_GATES } from "./releaseCandidateChecklist.js";

describe("releaseCandidateChecklist", () => {
  it("checklist includes all required beta gates", () => {
    expect(RELEASE_GATES).toContain("build");
    expect(RELEASE_GATES).toContain("incidentReport");
    expect(RELEASE_GATES.length).toBe(23);
  });
});
