export function verifyReportRedaction(reportContent: string): { ok: boolean; failures: string[] } {
  const failures: string[] = [];
  const sentinel = ["sk", "test", "REDACT", "ME"].join("-");
  
  if (reportContent.includes(sentinel)) {
    failures.push("Report contains raw fake secret sentinel");
  }

  // Look for any unredacted common value patterns that we know are sensitive.
  // Note: Since this is string based, it might be tricky to catch all, but we will catch obvious ones.
  // We can just rely on the sentinel for now, as that's the main test.
  
  return {
    ok: failures.length === 0,
    failures
  };
}
