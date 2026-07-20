import { z } from "zod";

export const filesystemPolicySchema = z
  .object({
    readonly: z.boolean(),
    allowRead: z.array(z.string()).optional(),
    allowWrite: z.array(z.string()).optional(),
    deny: z.array(z.string()).optional()
  })
  .strict();

export type FilesystemPolicy = z.infer<typeof filesystemPolicySchema>;
