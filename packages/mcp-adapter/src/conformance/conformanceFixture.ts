import { z } from "zod";

export const conformanceFixtureSchema = z
  .object({
    id: z.string().min(1),
    name: z.string().min(1),
    description: z.string().min(1),
    inputMessages: z.array(z.unknown()).min(1),
    expected: z
      .object({
        responseCount: z.number().int().nonnegative().optional(),
        requiredMethodsSeen: z.array(z.string().min(1)).optional(),
        forbiddenForwardedMethods: z.array(z.string().min(1)).optional(),
        forbiddenForwardedToolNames: z.array(z.string().min(1)).optional(),
        requiredErrorCodes: z.array(z.string().min(1)).optional(),
        requiredDecisions: z.array(z.string().min(1)).optional(),
        mustRedactSecrets: z.array(z.string().min(1)).optional()
      })
      .strict()
  })
  .strict();

export type ConformanceFixture = z.infer<typeof conformanceFixtureSchema>;

export function defineConformanceFixture(fixture: ConformanceFixture): ConformanceFixture {
  return conformanceFixtureSchema.parse(fixture);
}
