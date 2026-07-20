import { describe, expect, it } from "vitest";
import { generateFixRecommendations } from "./fixRecommendation.js";

describe("fixRecommendation", () => {
  it("recommendations are deterministic", () => {
    const recs = generateFixRecommendations("secret_exfiltration_chain", []);
    expect(recs[0]!.title).toBe("Deny secret-to-network flows");
  });
});
