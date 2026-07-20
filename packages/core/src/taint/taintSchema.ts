import { z } from "zod";

import { TAINT_LABELS } from "./taintTypes.js";

export const taintLabelSchema = z.enum(TAINT_LABELS);

export const taintSourceSchema = z
  .object({
    label: taintLabelSchema,
    reason: z.string().min(1),
    actionId: z.string().min(1).optional(),
    resource: z.string().min(1).optional()
  })
  .strict();
