import { expect, test } from "vitest";
import { LeaderboardEntrySchema } from "./leaderboardEntrySchema.js";

test("LeaderboardEntrySchema parses valid entry", () => {
  const entry = LeaderboardEntrySchema.parse({
    version: 1,
    entryId: "test",
    projectName: "Test",
    projectVersion: "1.0",
    resultPath: "test.json",
    score: 100,
    grade: "pass",
    corpusVersion: "v3",
    verified: true,
    verificationSummary: "ok",
    limitations: []
  });
  expect(entry.entryId).toBe("test");
});
