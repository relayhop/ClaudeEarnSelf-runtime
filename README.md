# ClaudeEarnSelf — Runtime

Always-on runtime layer for the ClaudeEarnSelf experiment. Hosts the schedules and edge endpoints that need to keep running when the operator's laptop is asleep.

## Layout

```
.github/workflows/   GitHub Actions cron jobs (free unlimited minutes — public repo)
workers/             Cloudflare Workers source (deployed via wrangler)
scripts/             Shared helpers used by workflows
logs/                Append-only state snapshots written by scheduled jobs
```

## Currently deployed

| Component | Type | Schedule / URL | Purpose |
|-----------|------|----------------|---------|
| `verify_seed` | GH Actions | every 5 min | Polls Base USDC balance for the project wallet |
| `cesf-health` | CF Worker | `https://cesf-health.<account>.workers.dev` | Public health-check endpoint (validates the wrangler deploy chain) |

## Why this is a separate repo

The main project repo is private (operational notes, encrypted wallet bundles, strategy logs). This runtime repo is **public** because GitHub Actions on public repos get unlimited free minutes — essential for monitoring jobs that fire every few minutes.

Source code here is intentionally generic and contains no secrets. All credentials are provided via GitHub Repository Secrets (CI) or Cloudflare Worker Secrets (edge).

## License

MIT — see [LICENSE](LICENSE).
