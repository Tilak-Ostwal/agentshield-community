import { describe, expect, it } from "vitest";

import { labelsFromSources, mergeTaintLabels, propagation } from "./taintPropagation.js";

describe("taint propagation", () => {
  it("deduplicates labels from sources", () => {
    expect(
      labelsFromSources([
        { label: "secret", reason: "a" },
        { label: "secret", reason: "b" },
        { label: "token", reason: "c" }
      ])
    ).toEqual(["secret", "token"]);
  });

  it("merges taint labels deterministically", () => {
    expect(mergeTaintLabels(["token"], ["secret", "token"])).toEqual(["secret", "token"]);
  });

  it("creates propagation records", () => {
    expect(propagation(["secret"], "same resource", { fromActionId: "a1", resource: "/mock/.env" })).toMatchObject({
      labels: ["secret"],
      fromActionId: "a1",
      resource: "/mock/.env"
    });
  });
});
