import * as fs from "fs";
import * as path from "path";

export function checkPackageFilesAllowlist(dir: string, denylist: string[]): { valid: boolean; forbiddenFound: string[] } {
  const forbiddenFound: string[] = [];
  
  if (!fs.existsSync(dir)) return { valid: true, forbiddenFound: [] };

  const checkDir = (currentPath: string) => {
    const entries = fs.readdirSync(currentPath, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.name === "node_modules" || entry.name === "dist") continue; // Skip large dirs
      
      const fullPath = path.join(currentPath, entry.name);
      
      if (denylist.includes(entry.name)) {
        forbiddenFound.push(fullPath);
      }
      
      if (entry.isDirectory()) {
        checkDir(fullPath);
      }
    }
  };

  checkDir(dir);
  
  return { valid: forbiddenFound.length === 0, forbiddenFound };
}
