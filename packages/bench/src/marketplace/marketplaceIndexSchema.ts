import { z } from "zod";

export const MarketplaceIndexSchema = z.object({
  version: z.number(),
  indexId: z.string(),
  name: z.string(),
  entries: z.array(z.string()),
  createdAt: z.string().datetime(),
  limitations: z.array(z.string())
});

export type MarketplaceIndex = z.infer<typeof MarketplaceIndexSchema>;
