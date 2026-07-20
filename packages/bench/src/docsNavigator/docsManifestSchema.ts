import { z } from "zod";

export const docsManifestSchema = z.object({
  version: z.literal(1),
  siteId: z.string(),
  name: z.string(),
  root: z.string(),
  navigationPath: z.string(),
  pages: z.array(z.object({
    pageId: z.string(),
    title: z.string(),
    path: z.string(),
    audience: z.array(z.string()).optional(),
    featuresCovered: z.array(z.string()).optional(),
    required: z.boolean().optional()
  })),
  requiredSections: z.array(z.string()).optional(),
  limitationsRequired: z.boolean().optional(),
  nonCertificationDisclaimerRequired: z.boolean().optional()
}).strict();

export type DocsManifest = z.infer<typeof docsManifestSchema>;
