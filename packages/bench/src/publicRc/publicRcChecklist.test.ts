import { describe, expect, it } from "vitest";
import { generateLaunchChecklist } from "./publicRcChecklist.js";

describe("publicRcChecklist", () => {
  it("public RC checklist is deterministic", () => {
    expect(generateLaunchChecklist()).toContain("local verification");
  });
  it("final launch checklist includes manual publish warning", () => {
    expect(generateLaunchChecklist()).toContain("manual review before any future GitHub publish");
  });
});
