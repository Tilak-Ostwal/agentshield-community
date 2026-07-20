import * as fs from "fs";
import * as path from "path";

export interface BuildArtifact {
  path: string;
  size: number;
}

export function generateBuildArtifactInventory(dir: string): BuildArtifact[] {
  const artifacts: BuildArtifact[] = [];
  
  if (!fs.existsSync(dir)) return artifacts;

  const walk = (currentPath: string) => {
    const entries = fs.readdirSync(currentPath, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.name === "node_modules") continue;
      
      const fullPath = path.join(currentPath, entry.name);
      
      if (entry.isDirectory()) {
        walk(fullPath);
      } else {
        artifacts.push({
          path: path.relative(dir, fullPath).replace(/\\/g, "/"),
          size: fs.statSync(fullPath).size
        });
      }
    }
  };

  walk(dir);
  
  // Sort for determinism
  artifacts.sort((a, b) => a.path.localeCompare(b.path));
  return artifacts;
}
