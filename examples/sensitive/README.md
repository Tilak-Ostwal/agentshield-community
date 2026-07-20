# Sensitive Data Examples

These files demonstrate the detection and redaction behavior.

`sample-sensitive-input.json` contains simulated API keys, PII, and paths.

`sample-redacted-report.json` contains a report with a raw fake secret sentinel that should fail verification.

## Try it:

```bash
pnpm cli -- sensitive scan examples/sensitive/sample-sensitive-input.json
pnpm cli -- sensitive verify-report examples/sensitive/sample-redacted-report.json
```
