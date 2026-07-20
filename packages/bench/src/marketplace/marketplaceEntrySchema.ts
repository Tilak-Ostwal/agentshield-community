import { z } from "zod";

export const MarketplaceEntrySchema = z.object({
  version: z.number(),
  entryId: z.string(),
  name: z.string(),
  description: z.string(),
  packId: z.string(),
  packPath: z.string(),
  publisher: z.object({
    name: z.string(),
    type: z.enum(["maintainer", "community", "third_party", "unknown"])
  }),
  safetyLevel: z.enum(["strict", "balanced", "dev", "enterprise"]),
  maturity: z.enum(["experimental", "reviewed", "recommended"]),
  compatibleWorkspaceProfiles: z.array(z.string()),
  requiredChecks: z.object({
    schemaValidation: z.boolean(),
    policyAudit: z.boolean(),
    policyTest: z.boolean(),
    reviewRecord: z.boolean(),
    bundleRecommended: z.boolean()
  }),
  riskNotes: z.array(z.string()),
  limitations: z.array(z.string())
});

export type MarketplaceEntry = z.infer<typeof MarketplaceEntrySchema>;
