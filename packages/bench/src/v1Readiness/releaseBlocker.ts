import { z } from "zod";

export const releaseBlockerSchema = z.object({
  blockerId: z.string(),
  severity: z.enum(["high", "critical"]),
  description: z.string(),
  remediation: z.string(),
});

export type ReleaseBlocker = z.infer<typeof releaseBlockerSchema>;

export function checkReleaseBlockers(workspaceContent: Record<string, string>): ReleaseBlocker[] {
  const blockers: ReleaseBlocker[] = [];
  
  // File name checks
  for (const file of Object.keys(workspaceContent)) {
    if (file === "v1-readiness-report.md" || file === "v1-readiness-report.json" || file === "v1-gap-closure-plan.md") {
      blockers.push({
        blockerId: "blocker-smoke-file",
        severity: "critical",
        description: `Generated smoke file left in repo root: ${file}`,
        remediation: "Delete the generated report file."
      });
    }
  }

  // Fake secret leak check
  for (const [file, content] of Object.entries(workspaceContent)) {
    if (content.includes(["sk", "test", "REDACT", "ME"].join("-"))) {
      blockers.push({
        blockerId: "blocker-fake-secret-leak",
        severity: "critical",
        description: `Raw fake secret sentinel found in ${file}`,
        remediation: "Use ['sk', 'test', 'REDACT', 'ME'].join('-') instead."
      });
    }
    
    if (content.includes("claim SOC2 certification")) {
        blockers.push({
          blockerId: "blocker-forbidden-claim",
          severity: "critical",
          description: `Forbidden compliance claim found in ${file}`,
          remediation: "Remove the claim. We do not provide compliance certifications."
        });
    }
  }

  return blockers;
}
