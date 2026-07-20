import { describe, expect, it } from "vitest";
import { detectSensitive } from "./sensitiveDetector.js";

describe("sensitiveDetector", () => {
  it("recursive scanner returns JSON paths", () => {
    const input = {
      config: {
        api_key: "sk-1234567890",
        nested: [
          { token: "abc" }
        ]
      }
    };
    const res = detectSensitive(input);
    expect(res).toHaveLength(2);
    expect(res.map(r => r.path)).toContain("$.config.api_key");
    expect(res.map(r => r.path)).toContain("$.config.nested[0].token");
  });
});
