import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { CliResult } from "../cli.js";
import { builtInRecipes, validateRecipe, formatRecipeMarkdown, checkRecipeDoctor } from "@agentshield/bench";

export function runRecipeCommand(args: string[], cwd: string): CliResult {
  const [subcommand, recipeIdOrPath, ...flags] = args;

  if (subcommand === "list") {
    const formatIndex = flags.indexOf("--format");
    const format = formatIndex >= 0 ? flags[formatIndex + 1] : "text";

    if (format === "json") {
      const list = Object.values(builtInRecipes).map(r => ({ recipeId: r.recipeId, maturity: r.maturity, purpose: r.name }));
      return { exitCode: 0, stdout: JSON.stringify(list, null, 2), stderr: "" };
    }

    let out = "Built-in Enterprise Recipes:\n\n";
    for (const r of Object.values(builtInRecipes)) {
      out += `- ${r.recipeId} (${r.maturity}): ${r.name}\n`;
    }
    return { exitCode: 0, stdout: out, stderr: "" };
  }

  if (subcommand === "show") {
    if (!recipeIdOrPath) return { exitCode: 1, stdout: "", stderr: "Must specify a recipe ID." };
    const r = builtInRecipes[recipeIdOrPath];
    if (!r) return { exitCode: 1, stdout: "", stderr: "Unknown built-in recipe." };
    
    const formatIndex = flags.indexOf("--format");
    const format = formatIndex >= 0 ? flags[formatIndex + 1] : "text";

    if (format === "json") {
      return { exitCode: 0, stdout: JSON.stringify(r, null, 2), stderr: "" };
    }
    if (format === "markdown") {
      return { exitCode: 0, stdout: formatRecipeMarkdown(r), stderr: "" };
    }
    
    return { exitCode: 0, stdout: `Recipe: ${r.name}\n${r.description}\nMaturity: ${r.maturity}\n`, stderr: "" };
  }

  if (subcommand === "validate") {
    if (!recipeIdOrPath) return { exitCode: 1, stdout: "", stderr: "Must specify a file path." };
    const formatIndex = flags.indexOf("--format");
    const format = formatIndex >= 0 ? flags[formatIndex + 1] : "text";
    
    const p = resolve(cwd, recipeIdOrPath);
    let data;
    try {
      data = JSON.parse(readFileSync(p, "utf-8"));
    } catch {
      return { exitCode: 1, stdout: "", stderr: "Failed to read or parse input file." };
    }

    const result = validateRecipe(data);
    if (format === "json") {
      return { exitCode: result.valid ? 0 : 1, stdout: JSON.stringify(result, null, 2), stderr: "" };
    }
    if (result.valid) {
      return { exitCode: 0, stdout: "Recipe verified successfully.", stderr: "" };
    }
    return { exitCode: 1, stdout: "", stderr: "Recipe verification failed: \n" + result.failures.join("\n") };
  }

  if (subcommand === "doctor") {
    if (!recipeIdOrPath) return { exitCode: 1, stdout: "", stderr: "Must specify a recipe ID." };
    const r = builtInRecipes[recipeIdOrPath];
    if (!r) return { exitCode: 1, stdout: "", stderr: "Unknown built-in recipe." };

    const formatIndex = flags.indexOf("--format");
    const format = formatIndex >= 0 ? flags[formatIndex + 1] : "text";
    
    const doc = checkRecipeDoctor(r, cwd);
    if (format === "json") {
      return { exitCode: doc.ok ? 0 : 1, stdout: JSON.stringify(doc, null, 2), stderr: "" };
    }
    if (format === "markdown") {
      return { exitCode: doc.ok ? 0 : 1, stdout: `# Recipe Doctor: ${r.recipeId}\n${doc.ok ? "PASS" : "FAIL"}\n\n${doc.warnings.join("\n")}`, stderr: "" };
    }
    if (doc.ok) {
      return { exitCode: 0, stdout: "Recipe doctor checks passed.", stderr: "" };
    }
    return { exitCode: 1, stdout: "", stderr: "Recipe doctor checks failed: \n" + doc.warnings.join("\n") };
  }

  return { exitCode: 1, stdout: "", stderr: "Usage: agentshield recipe list|show|validate|doctor <id_or_file.json> [...]" };
}
