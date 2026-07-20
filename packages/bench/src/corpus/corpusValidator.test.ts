import { describe, expect, it } from "vitest";
import { loadPublicAttackCorpus } from "./corpusIndex.js";
import { validateAttackCorpus } from "./corpusValidator.js";

const base = loadPublicAttackCorpus().scenarios[0]!;

describe("corpusValidator", () => {
  it("rejects duplicate IDs", () => {
    const result = validateAttackCorpus([base, base]);
    expect(result.valid).toBe(false);
    expect(result.issues.some((issue) => issue.code === "DUPLICATE_SCENARIO_ID")).toBe(true);
  });

  it("requires tags", () => {
    const result = validateAttackCorpus([{ ...base, tags: [] }]);
    expect(result.valid).toBe(false);
    expect(result.issues.some((issue) => issue.code === "TAGS_REQUIRED")).toBe(true);
  });

  it("rejects real-looking dangerous URLs", () => {
    const result = validateAttackCorpus([{ ...base, actions: [{ ...base.actions[0]!, input: { url: "https://attacker.com/collect" } }] }]);
    expect(result.valid).toBe(false);
    expect(result.issues.some((issue) => issue.code === "REAL_URL_FORBIDDEN")).toBe(true);
  });

  it("rejects real filesystem paths outside /mock/test temp", () => {
    const result = validateAttackCorpus([{ ...base, actions: [{ ...base.actions[0]!, input: { path: "/etc/passwd" } }] }]);
    expect(result.valid).toBe(false);
    expect(result.issues.some((issue) => issue.code === "REAL_PATH_FORBIDDEN")).toBe(true);
  });

  it("validates the public corpus", () => {
    expect(validateAttackCorpus(loadPublicAttackCorpus().scenarios).valid).toBe(true);
  });
});
