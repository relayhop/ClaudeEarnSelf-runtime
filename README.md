# ClaudeEarnSelf-runtime

Automated bounty scanning and timezone-aware opportunity detection for MergeOS ecosystem.

## Overview

This repository contains a set of GitHub Actions workflows that continuously monitor fresh, low-competition bounty opportunities across multiple timezones. The system is designed to give first-mover advantage by detecting and alerting on new issues and pull requests as soon as they appear.

## Workflows

### Timezone Radar (`timezone_radar.yml`)
- Scans GitHub for fresh, low-competition issues and PRs
- Runs on a schedule aligned with Asian daytime hours for first-mover advantage
- Outputs structured data for downstream processing

### Demand Radar (`demand_radar.yml`)
- Tracks demand signals from the MergeOS ecosystem
- Collects timestamped snapshots of active opportunities
- Data stored in `data/demand/` directory

### Check Zaps (`check_zaps.yml`)
- Validates and checks zap configurations
- Ensures automation pipelines are healthy

### Gumroad Prohibited Filter (`gumroad_prohibited_filter.yml`)
- Filters Gumroad product listings for prohibited content
- Maintains compliance with platform policies

### Gumroad Ratings Snapshot (`gumroad_ratings_snapshot.yml`)
- Takes periodic snapshots of Gumroad product ratings
- Tracks rating trends over time

### SN Radar (`sn_radar.yml`)
- Social network opportunity radar
- Monitors for trending discussions and opportunities

### Verify Seed (`verify_seed.yml`)
- Verifies seed data integrity
- Ensures data consistency across workflows

### Whitelist Scan (`whitelist_scan.yml`)
- Scans for whitelisted addresses or accounts
- Maintains access control lists

## Data

- `data/demand/` — Timestamped TSV files containing demand radar snapshots
- Each file is named with the pattern `demand_YYYY-MM-DDTHH-MM-SS.tsv`

## Current Opportunities (as of 2026-05-26T12:49 UTC)

| Type | Source | Score | Age (days) | Competitors | URL | Description |
|------|--------|-------|------------|-------------|-----|-------------|
| FRESH_LOW_COMP | github | 0.3 | 0 | 0 | https://github.com/mergeos-bounties/mergeos/pull/22 | fix(auth): Preserve local frontend host for OAuth redirects |
| FRESH_LOW_COMP | github | 0.4 | 0 | 0 | https://github.com/mergeos-bounties/mergeos/issues/21 | [1500 MRG] Live project creation updates on dashboard and homepage via WebSocket |
| FRESH_LOW_COMP | github | 0.4 | 0 | 0 | https://github.com/mergeos-bounties/mergeos/issues/20 | [200 MRG] Fix logout bug |
| FRESH_LOW_COMP | github | 0.4 | 0 | 0 | https://github.com/mergeos-bounties/mergeos/issues/19 | [3000 MRG] Implement public and logged-in notifications |
| FRESH_LOW_COMP | github | 0.4 | 0 | 0 | https://github.com/mergeos-bounties/mergeos/issues/18 | [2000 MRG] Add dashboard payment history after login |
| FRESH_LOW_COMP | github | 0.4 | 0 | 0 | https://github.com/mergeos-bounties/mergeos/issues/17 | [2000 MRG] Fix project view after login from dashboard |

## License

MIT