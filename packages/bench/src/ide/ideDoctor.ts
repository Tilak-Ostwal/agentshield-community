import { type IdeIntegrationConfig } from "./ideIntegrationSchema.js";
import { checkCommandSafety } from "./vscodeTaskGenerator.js";

export function runIdeDoctor(config: IdeIntegrationConfig) {
  const warnings: string[] = [];
  let valid = true;
  
  if (!config.workspaceConfigPath) {
    warnings.push("Missing workspace config path in IDE config");
  }
  
  if (config.commands) {
    for (const [k, v] of Object.entries(config.commands)) {
      if (!checkCommandSafety(v)) {
        warnings.push(`Unsafe command in ${k}: ${v}`);
        valid = false;
      }
    }
  }
  
  return { valid, warnings };
}
