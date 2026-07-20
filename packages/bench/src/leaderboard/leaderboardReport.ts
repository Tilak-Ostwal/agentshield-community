import { LeaderboardEntry } from "./leaderboardEntrySchema.js";

export function formatLeaderboardSummaryMarkdown(entry: LeaderboardEntry): string {
  return [
    `# Leaderboard Entry: ${entry.projectName} (${entry.projectVersion})`,
    ``,
    `**Entry ID**: ${entry.entryId}`,
    `**Score**: ${entry.score}`,
    `**Grade**: ${entry.grade}`,
    `**Corpus Version**: ${entry.corpusVersion}`,
    `**Verified**: ${entry.verified ? "Yes" : "No"}`,
    ``,
    `## Verification Summary`,
    entry.verificationSummary,
    ``,
    `## Limitations`,
    ...(entry.limitations.length > 0 ? entry.limitations.map(l => `- ${l}`) : ["None"])
  ].join("\n");
}
