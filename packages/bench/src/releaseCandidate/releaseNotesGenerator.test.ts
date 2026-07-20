import { describe, expect, it } from "vitest";
import { generateReleaseNotes } from "./releaseNotesGenerator.js";

describe("releaseNotesGenerator", () => {
  const manifest = {
    version: 1 as const,
    releaseId: "v0.2.0-beta",
    name: "Test Release",
    maturity: "beta" as const,
    createdAt: "2026-06-29T00:00:00.000Z"
  };

  it("release notes generator creates deterministic notes", () => {
    const notes1 = generateReleaseNotes(manifest);
    const notes2 = generateReleaseNotes(manifest);
    expect(notes1).toEqual(notes2);
  });

  it("release notes include Phase 0–45 capability summary", () => {
    const notes = generateReleaseNotes(manifest);
    expect(notes).toContain("Phase 0–45 Capability Summary");
  });

  it("release notes include known limitations", () => {
    const notes = generateReleaseNotes(manifest);
    expect(notes).toContain("Known Limitations");
  });

  it("release notes do not claim legal compliance certification", () => {
    const notes = generateReleaseNotes(manifest);
    expect(notes).toContain("NOT a legal compliance certification");
    expect(notes).toContain("does not confer SOC2, ISO, HIPAA, or PCI compliance");
  });
});
