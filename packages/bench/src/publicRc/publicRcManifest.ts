import { z } from "zod";

export const publicRcManifestSchema = z.object({
  version: z.literal(1),
  releaseId: z.string(),
  name: z.string(),
  maturity: z.literal("advanced_public_rc"),
  createdAt: z.string(),
  requiredEvidence: z.array(z.string()),
  requiredDocs: z.array(z.string()),
  forbiddenClaims: z.array(z.string()),
  limitations: z.array(z.string())
});

export type PublicRcManifest = z.infer<typeof publicRcManifestSchema>;

export const defaultPublicRcManifest: PublicRcManifest = {
  version: 1,
  releaseId: "agentshield-veritas-advanced-public-rc",
  name: "AgentShield Veritas Advanced Public Release Candidate",
  maturity: "advanced_public_rc",
  createdAt: "2026-06-29T00:00:00.000Z",
  requiredEvidence: [
    "build",
    "tests",
    "release-check",
    "release-candidate-check",
    "v1-readiness",
    "security-review-pack",
    "supply-chain-check",
    "perf-baseline",
    "corpus-v4",
    "leaderboard-format",
    "consumer-evaluation",
    "governance",
    "docs-site"
  ],
  requiredDocs: [
    "README.md",
    "SECURITY.md",
    "CONTRIBUTING.md",
    "CODE_OF_CONDUCT.md",
    "docs/known-limitations.md",
    "docs/security-claims-boundary.md",
    "docs/v1-readiness-report.md",
    "docs/advanced-public-release-candidate.md",
    "docs/public-evaluation-guide.md",
    "docs/final-launch-checklist.md"
  ],
  forbiddenClaims: [
    "SOC2 certified",
    "ISO certified",
    "HIPAA compliant",
    "PCI compliant",
    "guaranteed production secure",
    "unbreakable",
    "impossible to bypass"
  ],
  limitations: [
    "Local deterministic release candidate pack only.",
    "Not a legal compliance certification.",
    "Does not guarantee production security.",
    "Some integrations are prototype/mock/local-only."
  ]
};
