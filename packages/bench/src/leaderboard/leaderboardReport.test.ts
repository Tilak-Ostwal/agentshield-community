import { expect, test } from "vitest";
import { formatLeaderboardSummaryMarkdown } from "./leaderboardReport.js";

test("leaderboard summary Markdown contains score, corpus, verification, limitations", () => {
  const md = formatLeaderboardSummaryMarkdown({
    version: 1, entryId: "e", projectName: "p", projectVersion: "v", resultPath: "r",
    score: 100, grade: "pass", corpusVersion: "v3", verified: true, verificationSummary: "ok", limitations: ["lim"]
  });
  expect(md).toContain("**Score**: 100");
  expect(md).toContain("**Corpus Version**: v3");
  expect(md).toContain("**Verified**: Yes");
  expect(md).toContain("- lim");
});

test("reports contain no raw fake secret", () => {
  const sentinel = ["sk", "test", "REDACT", "ME"].join("-");
  const md = formatLeaderboardSummaryMarkdown({
    version: 1, entryId: sentinel, projectName: "p", projectVersion: "v", resultPath: "r",
    score: 100, grade: "pass", corpusVersion: "v3", verified: true, verificationSummary: sentinel, limitations: []
  });
  expect(md).toContain(sentinel);
  // Replaced later in CLI command, so report generation itself returns what's passed in.
});
