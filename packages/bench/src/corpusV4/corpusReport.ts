import { CorpusScenarioMetadata } from "./corpusScenarioMetadata.js";
import { generateCorpusCoverageMap } from "./corpusCoverageMap.js";
import { runCorpusQualityGate } from "./corpusQualityGate.js";

export function generateCorpusReportMarkdown(corpus: CorpusScenarioMetadata[]) {
  const map = generateCorpusCoverageMap(corpus);
  const gate = runCorpusQualityGate(corpus);
  let md = "# Corpus V4 Report\n\n";
  md += `Total Scenarios: ${corpus.length}\n`;
  md += `Quality Gate: ${gate.valid ? "PASS" : "FAIL"}\n\n`;
  
  md += "## Coverage Gaps\n";
  if (gate.valid) md += "None.\n\n";
  else {
    for (const e of gate.errors) md += `- ${e}\n`;
    md += "\n";
  }

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

export function generateCorpusReportJson(corpus: CorpusScenarioMetadata[]) {
  const map = generateCorpusCoverageMap(corpus);
  const gate = runCorpusQualityGate(corpus);
  return {
    version: 4,
    total: corpus.length,
    gate: gate.valid ? "PASS" : "FAIL",
    errors: gate.errors,
    map
  };
}
