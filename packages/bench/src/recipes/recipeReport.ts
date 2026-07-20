import { EnterpriseRecipe } from "./recipeSchema.js";

export function formatRecipeMarkdown(recipe: EnterpriseRecipe): string {
  let md = `# Recipe: ${recipe.name}\n\n`;
  md += `**ID:** ${recipe.recipeId}\n`;
  md += `**Maturity:** ${recipe.maturity.toUpperCase()}\n\n`;
  md += `## Description\n${recipe.description}\n\n`;
  
  if (recipe.recommendedFor.length > 0) {
    md += `## Recommended For\n- ${recipe.recommendedFor.join("\n- ")}\n\n`;
  }

  md += `## Commands\n\`\`\`sh\n${recipe.commands.join("\n")}\n\`\`\`\n\n`;

  md += `## Controls\n`;
  for (const c of recipe.controls) {
    md += `- **${c.controlId}**: ${c.name}\n`;
  }
  md += `\n`;
  
  md += `## Limitations\n`;
  if (recipe.limitations.length === 0) {
    md += `- Local deterministic checks only; not a legal compliance certification.\n`;
  } else {
    for (const lim of recipe.limitations) {
      md += `- ${lim}\n`;
    }
  }

  return md;
}
