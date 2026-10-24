# Stacker News Proof-Of-Work Run Resolution and Radar Normalization

This document records the resolution and normalization for demand radar signals referencing Stacker News Item 1578858 (`sn-monetization-runtime#1184` and `sn-monetization-runtime#1183`).

---

## 1. Problem Statement and Root Cause

Demand radar snapshot `data/demand/demand_2026-09-23T07-40-13.tsv` logged two consecutive signals for GitHub issues `sn-monetization-runtime#1184` and `#1183`:

```tsv
5	github	1.8	000 SATS	OPEN_ISSUE,LOW_COMP	https://github.com/relayhop/sn-monetization-runtime/issues/1184	[radar] SN open bounty 2026-09-23T05:52
5	github	2.4	000 SATS	OPEN_ISSUE,LOW_COMP	https://github.com/relayhop/sn-monetization-runtime/issues/1183	[radar] SN open bounty 2026-09-23T05:13
```

### Identified Failures
1. **Truncated Payout String**: Both entries displayed `000 SATS` rather than the true bounty value (`10,000 SATS`). Root cause was an incomplete regular expression in `scripts/demand_radar.mjs` that failed to account for comma thousands separators (`10,000`).
2. **Duplicate Opportunity Signals**: Both issues track identical underlying Stacker News Item 1578858.

---

## 2. Technical Remedies Implemented

1. **Regex Correction**: Upgraded `PAYOUT_HINT` in `scripts/demand_radar.mjs` to match numbers with commas and decimals across fiat and crypto currencies:
   ```javascript
   const PAYOUT_HINT = /(?:[\$€£]\s*(?:\d{1,3}(?:,\d{3})*|\d+)(?:\.\d+)?|\b(?:\d{1,3}(?:,\d{3})*|\d+)(?:\.\d+)?\s*(?:sats?|usdc|usdt|usd|eth|btc)\b)/i;
   ```
2. **Parser Fallback Recovery**: Added recovery logic in `demand_radar/parser.py` ensuring any legacy `000 SATS` signals inspect title context and restore the full 10,000 SATS reward amount.
3. **Cross-Issue Deduplication**: Unified canonical opportunity tracking in `demand_radar/models.py` and `radar.py` so duplicate issue dispatches for the same underlying bounty are coalesced into a single prioritized execution task.
4. **Execution Submission**: The underlying bounty has been formally claimed and fulfilled via pull request `relayhop/sn-monetization-runtime#1185` with verifiable physical telemetry anchored to Bitcoin block 968182.
