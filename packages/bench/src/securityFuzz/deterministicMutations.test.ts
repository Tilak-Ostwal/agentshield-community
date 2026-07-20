import { describe, expect, it } from "vitest";
import { applyDeterministicMutations } from "./deterministicMutations.js";

describe("deterministicMutations", () => {
  it("deterministic mutation engine returns stable output", () => {
    const output = applyDeterministicMutations({ a: 1 });
    expect(output.length).toBe(3);
    expect(output[0]).toEqual({});
  });
});
