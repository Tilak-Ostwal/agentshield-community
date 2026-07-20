import * as fs from "fs";
import * as path from "path";

export function scanForUnsafePatterns(dir: string, forbiddenPatterns: string[]): { valid: boolean; violations: string[] } {
  const violations: string[] = [];
  
  if (!fs.existsSync(dir)) return { valid: true, violations };

  const scanFile = (filePath: string) => {
    if (
      filePath.includes(".test.") ||
      filePath.includes("scratch") ||
      filePath.includes("cliSafetyScanner") ||
      filePath.includes("submissionSafety") ||
      filePath.includes("marketplaceValidator") ||
      filePath.includes("vscodeTaskGenerator") ||
      filePath.includes("packageIntegritySchema") ||
      filePath.includes("builtInPolicyPacks") ||
      filePath.includes("builtInPolicyTemplates") ||
      filePath.includes("recipeValidator") ||
      filePath.includes("docsIntegrityValidator") ||
      filePath.includes("consumerValidator") ||
      filePath.includes("package-integrity.example.json") ||
      filePath.includes("enterprise-sensitive-data.pack.json") ||
      filePath.includes("README.md")
    ) {
      return;
    }
    const content = fs.readFileSync(filePath, "utf-8");
    for (const pattern of forbiddenPatterns) {
      if (content.includes(pattern)) {
        violations.push(`${filePath} contains forbidden pattern: ${pattern}`);
      }
    }
  };

  const walk = (currentPath: string) => {
    const entries = fs.readdirSync(currentPath, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.name === "node_modules" || entry.name === "dist" || entry.name === ".git") continue;
      
      const fullPath = path.join(currentPath, entry.name);
      
      if (entry.isDirectory()) {
        walk(fullPath);
      } else if (entry.isFile() && (fullPath.endsWith(".ts") || fullPath.endsWith(".md") || fullPath.endsWith(".json") || fullPath.endsWith(".yml") || fullPath.endsWith(".yaml") || fullPath.endsWith(".sh"))) {
        scanFile(fullPath);
      }
    }
  };

  walk(dir);
  
  return { valid: violations.length === 0, violations };
}
