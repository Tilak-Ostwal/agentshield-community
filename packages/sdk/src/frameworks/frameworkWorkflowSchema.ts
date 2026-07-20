import { z } from "zod";

export const frameworkWorkflowStepSchema = z.object({
  stepId: z.string().min(1),
  toolName: z.string().min(1),
  input: z.record(z.unknown()).optional()
}).strict();

export type FrameworkWorkflowStep = z.infer<typeof frameworkWorkflowStepSchema>;

export const frameworkWorkflowSchema = z.object({
  version: z.literal(1),
  workflowId: z.string().min(1),
  name: z.string().min(1),
  steps: z.array(frameworkWorkflowStepSchema),
  expectedFinalDecision: z.enum(["allow", "deny", "review"]).optional()
}).strict();

export type FrameworkWorkflow = z.infer<typeof frameworkWorkflowSchema>;

export function parseFrameworkWorkflow(input: unknown): FrameworkWorkflow {
  return frameworkWorkflowSchema.parse(input);
}
