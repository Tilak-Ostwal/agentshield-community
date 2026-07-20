import { expect, test } from "vitest";
import { BenchmarkSubmissionManifestSchema } from "./benchmarkSubmissionManifest.js";

test("BenchmarkSubmissionManifestSchema parses valid manifest", () => {
  const manifest = BenchmarkSubmissionManifestSchema.parse({
    version: 1,
    submissionId: "test",
    resultPath: "res.json",
    leaderboardEntryPath: "entry.json",
    requiredArtifacts: [],
    reproducibility: {
      commands: ["pnpm build", "pnpm test"],
      networkRequired: false,
      cloudRequired: false
    }
  });
  expect(manifest.submissionId).toBe("test");
});

test("BenchmarkSubmissionManifestSchema rejects unsafe commands", () => {
  expect(() => BenchmarkSubmissionManifestSchema.parse({
    version: 1,
    submissionId: "test",
    resultPath: "res.json",
    leaderboardEntryPath: "entry.json",
    requiredArtifacts: [],
    reproducibility: {
      commands: ["npm install"],
      networkRequired: false,
      cloudRequired: false
    }
  })).toThrow("unsafe reproducibility commands");
});
