import { CorpusScenarioMetadata } from "./corpusScenarioMetadata.js";

export function generateCorpusCoverageMap(corpus: CorpusScenarioMetadata[]) {
  const cats: Record<string, number> = {};
  const fams: Record<string, number> = {};
  const sevs: Record<string, number> = {};
  const diffs: Record<string, number> = {};

  for (const c of corpus) {
    cats[c.category] = (cats[c.category] || 0) + 1;
    fams[c.family] = (fams[c.family] || 0) + 1;
    sevs[c.severity] = (sevs[c.severity] || 0) + 1;
    diffs[c.difficulty] = (diffs[c.difficulty] || 0) + 1;
  }

  return { categories: cats, families: fams, severities: sevs, difficulties: diffs };
}

export function generateCorpusCoverageMarkdown(corpus: CorpusScenarioMetadata[]) {
  const map = generateCorpusCoverageMap(corpus);
  let md = "# Corpus Coverage Map\n\n";
  md += "## Categories\n";
  for (const [k, v] of Object.entries(map.categories)) md += `- ${k}: ${v}\n`;
  md += "## Families\n";
  for (const [k, v] of Object.entries(map.families)) md += `- ${k}: ${v}\n`;
  md += "## Severities\n";
  for (const [k, v] of Object.entries(map.severities)) md += `- ${k}: ${v}\n`;
  md += "## Difficulties\n";
  for (const [k, v] of Object.entries(map.difficulties)) md += `- ${k}: ${v}\n`;
  return md;
}
