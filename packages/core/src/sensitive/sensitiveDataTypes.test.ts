import { describe, expect, it } from "vitest";
import { sensitiveDetectionResultSchema } from "./sensitiveDataTypes.js";

describe("sensitiveDataTypes", () => {
  it("schema parses valid detection result", () => {
    const valid = {
      type: "api_key",
      confidence: "high",
      path: "$.input.headers.authorization",
      evidence: "key_name",
      redaction: "[REDACTED:api_key]"
    };
    expect(sensitiveDetectionResultSchema.parse(valid)).toEqual(valid);
  });
});
