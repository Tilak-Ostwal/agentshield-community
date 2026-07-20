import { describe, it, expect } from "vitest";
import { MAINTAINER_REVIEW_CHECKLIST } from "./maintainerChecklist.js";

describe("maintainerChecklist", () => {
  it("contains necessary checks", () => {
    expect(MAINTAINER_REVIEW_CHECKLIST.length).toBe(4);
    expect(MAINTAINER_REVIEW_CHECKLIST[0]).toContain("Code Review");
  });
});
