export function generateLaunchChecklist(): string {
  return `# Final Launch Checklist
- local verification
- repo hygiene
- docs review
- claims boundary review
- security disclosure review
- generated file cleanup
- manual review before any future GitHub publish
- no automatic publish
`;
}
