interface PolicyV2BenchmarkFixture {
  id: string;
  description: string;
  expected: "allow" | "deny" | "redact" | "require_human_review";
}

export const policyV2BenchmarkFixtures: PolicyV2BenchmarkFixture[] = [
  { id: "deny-beats-allow", description: "deny beats allow when both match", expected: "deny" },
  { id: "priority-allow-cannot-beat-deny", description: "higher priority allow cannot beat explicit deny", expected: "deny" },
  { id: "resource-deny-overrides-allow", description: "resource deny overrides resource allow", expected: "deny" },
  { id: "broad-allow-warning", description: "broad allow warning is emitted", expected: "deny" },
  { id: "shell-exec-allow-warning", description: "shell.exec allow warning is emitted", expected: "deny" },
  { id: "safe-filesystem-read-allowed", description: "v2 policy allows safe filesystem.read under allowed scope", expected: "allow" },
  { id: "filesystem-read-outside-scope-denied", description: "v2 policy denies filesystem.read outside allowed scope", expected: "deny" },
  { id: "secret-tainted-network-denied", description: "v2 policy denies network.write with secret taint", expected: "deny" },
  { id: "filesystem-write-review", description: "v2 policy requires review for filesystem.write", expected: "require_human_review" },
  { id: "explanation-winning-observed", description: "v2 policy explanation includes winning rule and observed capabilities/taint", expected: "allow" }
];
