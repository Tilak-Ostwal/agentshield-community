# Local Policy Marketplace

AgentShield includes a local-only policy marketplace format to help users discover, inspect, validate, and adopt community or enterprise policy packs without relying on a centralized or hosted marketplace.

## Why a Local Marketplace?
- **No Blind Trust**: We do not want developers blindly `npm install`ing security policies that might have hidden backdoor allows.
- **Review-Driven**: You generate a trust review report and install plan to inspect what the policy actually does.
- **Local Validation**: Ensure entries are safe before merging them into your workspace.
- **No Hosted Dependency**: The marketplace is defined entirely via JSON files (index and entries).

## Format
A marketplace index points to multiple entries. Each entry defines a `MarketplaceEntry` linking to a `PolicyPack`.

### Using the CLI

```bash
pnpm cli -- marketplace list path/to/marketplace.index.json
pnpm cli -- marketplace show path/to/entry.json
pnpm cli -- marketplace validate path/to/marketplace.index.json
pnpm cli -- marketplace install-plan path/to/entry.json
```

## Install Plans
AgentShield refuses to install policies automatically. The `install-plan` command generates a Markdown document explaining the steps you must take to manually review, audit, and integrate the policy.

## Limitations
- Local deterministic marketplace entry only.
- No hosted marketplace yet.
- Not a legal compliance certification.
