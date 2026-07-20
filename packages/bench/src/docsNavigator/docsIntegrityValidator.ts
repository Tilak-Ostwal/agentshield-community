import * as fs from "fs";
import * as path from "path";
import { docsManifestSchema } from "./docsManifestSchema.js";
import { docsNavigationSchema } from "./docsNavigationSchema.js";

export interface DocsValidationResult {
  valid: boolean;
  errors: string[];
}

export function validateDocsIntegrity(manifestPath: string, cwd: string): DocsValidationResult {
  const errors: string[] = [];
  
  const manifestAbs = path.resolve(cwd, manifestPath);
  const relManifest = path.relative(cwd, manifestAbs);
  if (relManifest.startsWith("..") || path.isAbsolute(relManifest)) {
    return { valid: false, errors: [`Manifest path out of bounds: ${manifestPath}`] };
  }

  if (!fs.existsSync(manifestAbs)) {
    return { valid: false, errors: [`Manifest not found: ${manifestPath}`] };
  }

  let manifestRaw;
  try {
    manifestRaw = JSON.parse(fs.readFileSync(manifestAbs, "utf-8"));
  } catch (error: unknown) {
    return { valid: false, errors: [`Failed to parse manifest: ${error instanceof Error ? error.message : String(error)}`] };
  }

  const parsedManifest = docsManifestSchema.safeParse(manifestRaw);
  if (!parsedManifest.success) {
    return { valid: false, errors: [`Invalid manifest schema: ${parsedManifest.error.message}`] };
  }
  const manifest = parsedManifest.data;
  
  const rootDir = path.dirname(manifestAbs);
  
  const navAbs = path.resolve(rootDir, path.relative(manifest.root, manifest.navigationPath));
  if (!fs.existsSync(navAbs)) {
    errors.push(`Navigation file not found: ${manifest.navigationPath}`);
  } else {
    try {
      const navRaw = JSON.parse(fs.readFileSync(navAbs, "utf-8"));
      const parsedNav = docsNavigationSchema.safeParse(navRaw);
      if (!parsedNav.success) {
        errors.push(`Invalid navigation schema: ${parsedNav.error.message}`);
      } else {
        const nav = parsedNav.data;
        for (const sec of nav.sections) {
          for (const item of sec.items) {
             const pageAbs = path.resolve(rootDir, path.relative(manifest.root, item.path));
             if (!fs.existsSync(pageAbs)) {
               errors.push(`Navigation reference missing page: ${item.path}`);
             }
          }
        }
      }
    } catch (error: unknown) {
      errors.push(`Failed to parse navigation: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  for (const page of manifest.pages) {
    const pageAbs = path.resolve(rootDir, path.relative(manifest.root, page.path));
    if (!fs.existsSync(pageAbs)) {
       if (page.required) errors.push(`Required page missing: ${page.path}`);
       continue;
    }
    
    const content = fs.readFileSync(pageAbs, "utf-8");
    
    if (content.includes(["sk", "test", "REDACT", "ME"].join("-"))) {
      errors.push(`Raw fake secret sentinel found in page: ${page.path}`);
    }
    if (content.match(/SOC2|ISO 27001|HIPAA|PCI DSS|compliance certification/i)) {
      errors.push(`Compliance certification claim found in page: ${page.path}`);
    }
    if (content.includes("curl ") || content.includes("irm ") || content.includes("Invoke-WebRequest") || content.includes("wget ")) {
      errors.push(`Unsafe install instruction found in page: ${page.path}`);
    }
    
    if (manifest.limitationsRequired && content.includes("mock-only") && !content.toLowerCase().includes("limitation")) {
      errors.push(`Mock-only feature missing limitation note in page: ${page.path}`);
    }
  }

  return {
    valid: errors.length === 0,
    errors
  };
}
