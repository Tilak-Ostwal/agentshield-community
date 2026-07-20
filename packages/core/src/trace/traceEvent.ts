import { z } from "zod";

export const traceActorSchema = z
  .object({
    kind: z.string().min(1),
    id: z.string().min(1)
  })
  .strict();

export const traceRedactionSchema = z
  .object({
    field: z.string().min(1),
    reason: z.string().min(1),
    strategy: z.literal("replace")
  })
  .strict();

export const traceEventSchema = z
  .object({
    trace_id: z.string().min(1),
    event_id: z.string().min(1),
    parent_event_id: z.string().min(1).optional(),
    timestamp: z.string().datetime(),
    type: z.string().min(1),
    actor: traceActorSchema,
    data: z.record(z.unknown()),
    redactions: z.array(traceRedactionSchema)
  })
  .strict();

export type TraceActor = z.infer<typeof traceActorSchema>;
export type TraceRedaction = z.infer<typeof traceRedactionSchema>;
export type TraceEvent = z.infer<typeof traceEventSchema>;
