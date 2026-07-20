import { type IdeIntegrationConfig } from "./ideIntegrationSchema.js";

const DANGEROUS_PATTERNS = [/npm publish/, /npm install/, /pnpm add/, /git push/, /git tag/, /curl/, /irm/, /iwr/, /Invoke-WebRequest/i];

export function checkCommandSafety(command: string): boolean {
  for (const pattern of DANGEROUS_PATTERNS) {
    if (pattern.test(command)) return false;
  }
  return true;
}

export function generateVscodeTasks(config: IdeIntegrationConfig) {
  const tasks = [];
  if (config.commands) {
    for (const [key, cmd] of Object.entries(config.commands)) {
      if (!checkCommandSafety(cmd)) {
        throw new Error(`Unsafe command detected: ${cmd}`);
      }
      tasks.push({
        label: `AgentShield: ${key}`,
        type: "shell",
        command: cmd,
        problemMatcher: []
      });
    }
  }
  return { version: "2.0.0", tasks };
}
