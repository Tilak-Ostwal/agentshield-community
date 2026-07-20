import { EnterpriseRecipe } from "./recipeSchema.js";
import { resolve } from "node:path";
import { existsSync } from "node:fs";

export function checkRecipeDoctor(recipe: EnterpriseRecipe, cwd: string): { ok: boolean; warnings: string[] } {
  const warnings: string[] = [];
  
  // Doctor checks referenced files inside commands if they look like relative paths
  for (const cmd of recipe.commands) {
    const parts = cmd.split(" ");
    for (let i = 0; i < parts.length; i++) {
      const part = parts[i]!;
      if (i > 0 && parts[i - 1] === "--out") continue;
      
      if (part.includes("/") || part.includes(".json") || part.includes(".md")) {
        if (!part.startsWith("-")) {
          const p = resolve(cwd, part);
          if (!existsSync(p)) {
            warnings.push(`Referenced file not found: ${part}`);
          }
        }
      }
    }
  }

  return { ok: warnings.length === 0, warnings };
}
