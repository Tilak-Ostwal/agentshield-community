import { z } from "zod";
import { ReadinessDomain } from "./readinessDomain.js";

export const gapClosurePlanItemSchema = z.object({
  gapId: z.string(),
  severity: z.enum(["medium", "high", "critical"]),
  domain: z.string(),
  title: z.string(),
  currentState: z.string(),
  requiredForV1: z.boolean(),
  requiredForEnterpriseProduction: z.boolean(),
  recommendedPhase: z.string(),
  action: z.string(),
  evidenceNeeded: z.array(z.string()),
});

export type GapClosurePlanItem = z.infer<typeof gapClosurePlanItemSchema>;

export function generateGapClosurePlan(domains: ReadinessDomain[]): GapClosurePlanItem[] {
  const plan: GapClosurePlanItem[] = [];

  // Static checks required by test requirements
  plan.push({
    gapId: "gap-production-signing",
    severity: "high",
    domain: "policy-bundles",
    title: "Production signing is not implemented",
    currentState: "Local HMAC test signing exists.",
    requiredForV1: false,
    requiredForEnterpriseProduction: true,
    recommendedPhase: "post-v1",
    action: "Design production key management and signing trust root.",
    evidenceNeeded: []
  });

  plan.push({
    gapId: "gap-hosted-dashboard",
    severity: "medium",
    domain: "enterprise-recipes",
    title: "Hosted dashboard/SaaS is missing",
    currentState: "Not implemented.",
    requiredForV1: false,
    requiredForEnterpriseProduction: false,
    recommendedPhase: "optional",
    action: "Consider offering a hosted dashboard.",
    evidenceNeeded: []
  });

  plan.push({
    gapId: "gap-production-os-sandbox",
    severity: "high",
    domain: "core-runtime-security",
    title: "Production OS sandbox guarantee missing",
    currentState: "No production OS sandbox guarantee.",
    requiredForV1: false,
    requiredForEnterpriseProduction: true,
    recommendedPhase: "post-v1",
    action: "Implement production OS sandbox.",
    evidenceNeeded: []
  });

  // Dynamic checks based on domain gaps
  for (const domain of domains) {
    for (const gap of domain.gaps) {
       plan.push({
         gapId: `gap-${domain.domainId}-${gap.toLowerCase().replace(/\s+/g, '-')}`,
         severity: "medium", // Default
         domain: domain.domainId,
         title: gap,
         currentState: "Unknown",
         requiredForV1: domain.maturity !== "v1_ready",
         requiredForEnterpriseProduction: true,
         recommendedPhase: "pre-v1",
         action: `Resolve gap: ${gap}`,
         evidenceNeeded: []
       });
    }
  }

  return plan;
}
