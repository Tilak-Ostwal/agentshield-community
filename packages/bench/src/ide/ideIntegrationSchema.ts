import { z } from "zod";

export const ideIntegrationSchema = z.object({
  version: z.literal(1),
  ide: z.literal("vscode"),
  workspaceConfigPath: z.string().optional(),
  commands: z.record(z.string()).optional(),
  diagnostics: z.object({
    sarifEnabled: z.boolean().optional(),
    severityMapping: z.record(z.string()).optional()
  }).optional(),
  panel: z.object({
    enabled: z.boolean().optional(),
    sections: z.array(z.string()).optional()
  }).optional()
});

export type IdeIntegrationConfig = z.infer<typeof ideIntegrationSchema>;
