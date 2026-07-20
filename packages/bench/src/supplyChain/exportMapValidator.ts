import * as fs from "fs";

interface PackageJsonExports {
  exports?: unknown;
}

export function validateExportMap(packageJsonPath: string): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  if (!fs.existsSync(packageJsonPath)) {
    return { valid: false, errors: ["Missing package.json"] };
  }
  const pkg = JSON.parse(fs.readFileSync(packageJsonPath, "utf-8")) as PackageJsonExports;
  if (pkg.exports !== undefined && typeof pkg.exports === "object" && pkg.exports !== null) {
    for (const [key, val] of Object.entries(pkg.exports)) {
      if (typeof val === "string") {
        if (val.includes("..")) errors.push(`Export ${key} points outside package: ${val}`);
      } else if (typeof val === "object" && val !== null) {
        for (const subVal of Object.values(val)) {
          if (typeof subVal === "string" && subVal.includes("..")) {
            errors.push(`Export ${key} points outside package: ${subVal}`);
          }
        }
      }
    }
  }
  return { valid: errors.length === 0, errors };
}
