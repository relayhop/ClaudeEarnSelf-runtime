# ClaudeEarnSelf-runtime

Automated runtime for ClaudeEarnSelf — a self-sustaining, AI-driven bounty hunting system.

## Overview

This repository powers the runtime layer of the ClaudeEarnSelf ecosystem. It scans GitHub issues across multiple repositories, evaluates their bounty potential, and generates actionable demand signals for automated agents.

## Features

- **Demand Radar**: Scans GitHub for open issues with bounty tags and computes priority scores.
- **Timezone Radar**: Tracks issue activity across time zones to identify high-value windows.
- **SN Radar**: Monitors social noise (SN) signals for trending topics.
- **Gumroad Integration**: Filters prohibited content and captures ratings snapshots.
- **Whitelist Scan**: Validates contributor whitelists for secure access.
- **Verify Seed**: Ensures seed data integrity for reproducible runs.
- **Check Zaps**: Validates zap configurations for automation workflows.

## Workflows

All workflows are defined in `.github/workflows/` and run on a scheduled or event-driven basis:

| Workflow | Schedule | Purpose |
|----------|----------|---------|
| `demand_radar.yml` | Every 6 hours | Scans GitHub issues for high-priority bounty signals |
| `timezone_radar.yml` | Daily | Analyzes issue timestamps across time zones |
| `sn_radar.yml` | Every 4 hours | Monitors social noise for trending topics |
| `gumroad_prohibited_filter.yml` | Daily | Filters prohibited content from Gumroad listings |
| `gumroad_ratings_snapshot.yml` | Weekly | Captures ratings snapshots for Gumroad products |
| `whitelist_scan.yml` | On push | Validates contributor whitelist against repository |
| `verify_seed.yml` | On push | Verifies seed data integrity |
| `check_zaps.yml` | On push | Validates zap configurations |

## Demand Radar Signals

The demand radar generates priority signals based on:
- **Source**: Platform (e.g., GitHub, Gumroad)
- **Priority Score**: 0.0–10.0 (higher = more urgent)
- **Bounty Value**: USD amount offered
- **Tags**: Comma-separated labels (e.g., `OPEN_ISSUE`, `LOW_COMP`)
- **URL**: Direct link to the issue
- **Title**: Issue description

### Example Signal
```
5	github	0.9	$50	OPEN_ISSUE,LOW_COMP	https://github.com/xevrion-v2/agent-playground/issues/33	Bug Bounty Program — How to Participate
```

## Data

Demand radar outputs are stored as TSV files in `data/demand/` with timestamps in the filename (e.g., `demand_2026-05-01T16-15-20.tsv`).

## Getting Started

1. Clone the repository:
   ```bash
   git clone https://github.com/relayhop/ClaudeEarnSelf-runtime.git
   cd ClaudeEarnSelf-runtime
   ```

2. Review workflow configurations in `.github/workflows/`.

3. Trigger a workflow manually via GitHub Actions or wait for the scheduled run.

## License

MIT License — see [LICENSE](LICENSE) for details.

## Deployment Notes

See [DEPLOY_NOTES.md](DEPLOY_NOTES.md) for deployment instructions and environment setup.
