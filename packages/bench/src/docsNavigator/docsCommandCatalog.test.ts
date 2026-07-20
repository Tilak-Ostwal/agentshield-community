import { describe, it, expect } from "vitest";
import { generateCommandCatalog } from "./docsCommandCatalog.js";

describe("docsCommandCatalog", () => {
  it("command catalog is deterministic", () => {
    const a = generateCommandCatalog();
    const b = generateCommandCatalog();
    expect(a).toEqual(b);
  });
  it("command catalog includes policy-pack commands", () => {
    expect(generateCommandCatalog()).toContain("policy-pack");
  });
  it("command catalog includes provider/framework/multi-agent commands", () => {
    expect(generateCommandCatalog()).toContain("multi-agent");
  });
});
