# ClaudeEarnSelf - Low Competition Bounty Radar

## Overview
Automated radar for finding fresh, low-competition bounties suitable for AI-assisted completion.

## Radar Output Format
```
[LEVEL] TIMESTAMP | SOURCE | REPO | AMOUNT | AGE
```

### Levels
- 🟢 FRESH_LOW_COMP - New (< 2h), 0 comments, achievable
- 🟡 FRESH_MED - New (< 6h), low competition
- 🟡 TRENDING - Gaining attention, still open
- 🔴 HOT - High competition, may still be worth attempting
- ⚪ STALE - Open > 24h, likely contested

## Scoring Algorithm
```
score = (freshness * 0.3) + (low_competition * 0.3) + (match_quality * 0.2) + (reward_amount * 0.2)
```

Where:
- **freshness**: 1.0 if < 1h, 0.8 if < 4h, 0.5 if < 12h, 0.2 if < 24h
- **low_competition**: 1.0 if 0 comments, 0.7 if 1, 0.3 if 2-3, 0.1 if 4+
- **match_quality**: Based on skill match with available fix capabilities
- **reward_amount**: Normalized to 0-1 scale based on category

## Supported Sources
| Source | Scan Interval | API |
|--------|--------------|-----|
| GitHub Issues | 5 min | REST API |
| Algora | 15 min | Web scrape |
| Gitcoin | 30 min | GraphQL |
| Immunefi | 60 min | REST API |

## Auto-Execution Pipeline
1. Radar detects fresh bounty
2. Match quality assessed
3. If score > 0.7: Auto-fork and fix
4. PR submitted with wallet info
5. Comment posted on issue
6. Results logged for tracking
