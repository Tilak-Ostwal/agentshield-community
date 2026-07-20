# Local Approval Demo

Run the deterministic local approval flow:

```sh
pnpm cli -- approval demo
pnpm cli -- approval create --scenario write-then-exec --out approval-ticket.json --force
pnpm cli -- approval approve approval-ticket.json --out approval-token.json --approver local-dev --reason "Reviewed local mock action" --force
pnpm cli -- approval verify approval-ticket.json approval-token.json
pnpm cli -- mcp-proxy-demo --approval-token approval-token.json
```

The demo key is fake and local. Do not use it as a production approval key.
