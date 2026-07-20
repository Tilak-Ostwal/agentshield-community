import { z } from "zod";

export const docsNavigationSchema = z.object({
  version: z.literal(1),
  sections: z.array(z.object({
    sectionId: z.string(),
    title: z.string(),
    items: z.array(z.object({
      title: z.string(),
      path: z.string()
    }))
  }))
}).strict();

export type DocsNavigation = z.infer<typeof docsNavigationSchema>;
