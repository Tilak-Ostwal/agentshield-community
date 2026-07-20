import * as fs from "fs";
import * as path from "path";

export function scanDistributableSecrets(dir: string): { valid: boolean; violations: string[] } {
  const violations: string[] = [];
  
  if (!fs.existsSync(dir)) return { valid: true, violations };

  const rawSentinel = ["sk", "test", "REDACT", "ME"].join("-");
  const credentialLikePatterns = [/\.env(\..+)?$/, /\.pem$/, /id_rsa$/, /credentials\.json$/];

  const scanFile = (filePath: string) => {
    const basename = path.basename(filePath);
    for (const pat of credentialLikePatterns) {
      if (pat.test(basename)) {
        violations.push(`${filePath} looks like a credential file`);
        return;
      }
    }
    
    // Exclude test files, mock fixtures, and scanner logic itself
    if (
      !filePath.includes("distributableSecretScanner") &&
      !filePath.includes("perfBaselineReport") &&
      !filePath.includes("supplyChainReport") &&
      !filePath.includes(".test.") &&
      !filePath.includes("mockMcpFixtures") &&
      !filePath.includes("goldenFixtures") &&
      !filePath.includes("fixtures") &&
      !filePath.includes("examples")
    ) {
        const content = fs.readFileSync(filePath, "utf-8");
        if (content.includes(rawSentinel)) {
          violations.push(`${filePath} contains raw fake secret sentinel`);
        }
    }
  };

  const walk = (currentPath: string) => {
    const entries = fs.readdirSync(currentPath, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.name === "node_modules" || entry.name === ".git") continue;
      
      const fullPath = path.join(currentPath, entry.name);
      
      if (entry.isDirectory()) {
        walk(fullPath);
      } else if (entry.isFile()) {
        scanFile(fullPath);
      }
    }
  };

  walk(dir);
  
  return { valid: violations.length === 0, violations };
}
