import { describe, expect, it } from "vitest";

import { parseGithubActionInputs } from "./githubActionInputs.js";

describe("GitHub Action inputs", () => {
  it("parses default action inputs", () => {
    expect(parseGithubActionInputs({})).toEqual({
      profile: "strict",
      failOnCritical: true,
      minimumScore: 100
    });
  });

  it("rejects invalid profile", () => {
    expect(() => parseGithubActionInputs({ profile: "unsafe" })).toThrow("bench --profile must be strict, balanced, audit, or dev");
  });

  it("rejects unsafe output path", () => {
    expect(() => parseGithubActionInputs({ sarif: "../secret.sarif.json" })).toThrow("safe relative path");
  });
});
