import { DocsManifest } from "./docsManifestSchema.js";
import { mapDocsFeatureCoverage } from "./docsFeatureCoverage.js";

export function generateDocsMapMarkdown(manifest: DocsManifest) {
  const coverage = mapDocsFeatureCoverage(manifest);
  let md = "# Docs Feature Map\n\n";
  md += "## Covered Features\n";
  for (const c of coverage.covered) {
    md += `- ${c}\n`;
  }
  md += "\n## Missing Features\n";
  if (coverage.missing.length === 0) {
    md += "None!\n";
  } else {
    for (const m of coverage.missing) {
      md += `- ${m}\n`;
    }
  }
  return md;
}
