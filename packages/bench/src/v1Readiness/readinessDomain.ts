import { z } from "zod";

export const REQUIRED_DOMAINS = [
  "core-runtime-security",
  "policy-engine",
  "policy-migration",
  "policy-packs",
  "policy-marketplace",
  "policy-bundles",
  "registry-trust",
  "registry-bundles",
  "evidence-traces",
  "auditor-evidence",
  "sensitive-data-detection",
  "attack-graph",
  "attack-graph-explainability",
  "runtime-incidents",
  "redteam-generator",
  "security-fuzz",
  "corpus-v4",
  "benchmark-leaderboard",
  "provider-adapter",
  "framework-adapter",
  "multi-agent-guard",
  "mcp-proxy",
  "sdk-integration",
  "ide-integration",
  "consumer-harness",
  "enterprise-recipes",
  "docs-site",
  "governance-disclosure",
  "supply-chain-hardening",
  "performance-baselines",
  "external-security-review",
  "release-candidate-gate"
] as const;

export type RequiredDomain = typeof REQUIRED_DOMAINS[number];

export const readinessDomainSchema = z.object({
  domainId: z.string(),
  name: z.string(),
  maturity: z.enum(["prototype", "alpha", "beta", "release_candidate", "v1_ready"]),
  status: z.enum(["pass", "warning", "fail"]),
  evidence: z.array(z.string()),
  blockers: z.array(z.string()),
  gaps: z.array(z.string()),
  safeClaims: z.array(z.string()),
  forbiddenClaims: z.array(z.string()),
});

export type ReadinessDomain = z.infer<typeof readinessDomainSchema>;

export function getMissingRequiredDomains(domains: ReadinessDomain[]): string[] {
  const present = new Set(domains.map(d => d.domainId));
  return REQUIRED_DOMAINS.filter(d => !present.has(d));
}
