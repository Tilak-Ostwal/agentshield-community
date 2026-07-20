import { recipeSchema } from "./recipeSchema.js";

export function validateRecipe(recipe: unknown): { valid: boolean; failures: string[] } {
  const failures: string[] = [];
  const parsed = recipeSchema.safeParse(recipe);
  if (!parsed.success) {
    failures.push("Schema invalid: " + parsed.error.message);
    return { valid: false, failures };
  }

  const r = parsed.data;
  for (const cmd of r.commands) {
    if (cmd.includes("curl") || cmd.includes("wget") || cmd.includes("npm install") || cmd.includes("npm publish") || cmd.includes("rm -rf")) {
      failures.push("Recipe contains unsafe, network, publish, or destructive commands: " + cmd);
    }
    if (cmd.includes("&&") || cmd.includes("||") || cmd.includes(";")) {
      failures.push("Recipe contains unsafe compound commands: " + cmd);
    }
  }

  return { valid: failures.length === 0, failures };
}
