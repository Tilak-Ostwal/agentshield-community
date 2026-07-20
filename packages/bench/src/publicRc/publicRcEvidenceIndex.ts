export interface EvidenceIndexItem {
  id: string;
  path: string;
}

export function generateEvidenceIndex(): EvidenceIndexItem[] {
  return [
    { id: "build", path: "build/results" },
    { id: "tests", path: "tests/results" },
    { id: "release-check", path: "release-check" },
    { id: "release-candidate-check", path: "release-candidate-check" },
    { id: "v1-readiness", path: "v1-readiness" },
    { id: "security-review-pack", path: "security-review" },
    { id: "supply-chain-check", path: "supply-chain" },
    { id: "perf-baseline", path: "perf-baseline" },
    { id: "corpus-v4", path: "corpus-v4" },
    { id: "leaderboard-format", path: "leaderboard" },
    { id: "consumer-evaluation", path: "consumer" },
    { id: "governance", path: "governance" },
    { id: "docs-site", path: "docs" }
  ];
}
