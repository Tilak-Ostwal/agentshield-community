import { z } from "zod";

import { actionEnvelopeSchema, policyDecisionSchema } from "@agentshield/core";

export const policyTestExpectedSchema = z.object({
  decision: policyDecisionSchema,
  ruleId: z.string().optional(),
  capabilitiesAny: z.array(z.string()).optional(),
  taintAny: z.array(z.string()).optional(),
  riskMarkersAny: z.array(z.string()).optional(),
  forwarded: z.boolean().optional(),
  approvalTicket: z.boolean().optional(),
  executionPreflightStatus: z.string().optional(),
  sandboxDecision: z.string().optional()
}).strict();

export const policyTestCaseSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  action: actionEnvelopeSchema,
  expected: policyTestExpectedSchema
}).strict();

export const policyTestFileSchema = z
  .object({
    version: z.literal(1),
    name: z.string().min(1),
    policyPath: z.string().min(1),
    registryPath: z.string().min(1).optional(),
    tests: z.array(policyTestCaseSchema).min(1)
  })
  .strict()
  .superRefine((value, context) => {
    const ids = new Set<string>();
    for (const test of value.tests) {
      if (ids.has(test.id)) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["tests"],
          message: `duplicate test id: ${test.id}`
        });
      }
      ids.add(test.id);
    }
  });

export type PolicyTestExpected = z.infer<typeof policyTestExpectedSchema>;
export type PolicyTestCase = z.infer<typeof policyTestCaseSchema>;
export type PolicyTestFile = z.infer<typeof policyTestFileSchema>;

export function parsePolicyTestFile(input: unknown): PolicyTestFile {
  return policyTestFileSchema.parse(input);
}
