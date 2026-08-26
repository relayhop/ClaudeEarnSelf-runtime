# Tips for Running a Profitable Lightning Node

This document answers open bounty 1549793 (OPEN_BOUNTY, HOT): "Best tips for running a profitable lightning node?"

## Channel Management
1. **Open channels to well-connected, routing-heavy peers** — nodes with high betweenness centrality (see 1ml.com or Amboss) generate more forwarding fees per satoshi of locked liquidity.
2. **Keep liquidity balanced** — aim for ~50/50 local/remote balance on routing channels. Use circular rebalancing (loop out / splice) when a channel becomes too one-sided; a dead-balance channel earns nothing.
3. **Close unproductive channels** — audit monthly. If a channel earned less in fees than its proportional share of on-chain costs, close or repurpose it.
4. **Prefer inbound-fee-aware routing** — since the inbound fee update (2025), set both outbound and inbound fee policies; watch that inbound fees do not push peers away.

## Fee Policy
5. **Set fees dynamically** — start near the network median, then adjust based on your own routing data. Channels with high attempted-but-failed forwards signal fees that are too high or liquidity that is too thin.
6. **Differentiate fees per channel** — charge more on channels where you have routing leverage, less on channels used primarily for rebalancing.
7. **Avoid fee races to the bottom** — a 1-sat fee node earns almost nothing and attracts mostly unprofitable traffic.

## Liquidity & Capital Efficiency
8. **Size channels appropriately** — small channels (<2M sats) rarely route; large channels tie up capital. Find your sweet spot based on observed flow.
9. **Use just-in-time liquidity and splicing** — LND 0.18+ and Core Lightning both support splicing, letting you resize channels without closing them (avoids on-chain fees and downtime).
10. **Buy inbound liquidity strategically** — swap services or peer swaps can direct liquidity where routing demand exists.

## Reliability & Operations
11. **Run a reliable node** — 99.9%+ uptime. Failed forwards destroy reputation scores and future routing. Use a VPS or bare metal with DDoS protection, monitored with watchtowers (LND) or ESMS (CLN).
12. **Keep watchtowers configured** — you cannot be online 24/7 yourself; watchtowers enforce channel breaches on your behalf.
13. **Stay on the latest stable release** — fee/routing upgrades (e.g., inbound fees, dual funding, onion messages) change the economics; outdated nodes lose routing share.
14. **Sync the chain with your own backend or a trusted neutrino/fulcrum instance** — routing failures from stale chain data are silent profit killers.

## Accounting & Taxes
15. **Track every channel open/close and fee event** — tools like SPECTER or lnmetrics exports make tax reporting feasible; routing income is generally taxable income.
16. **Watch the fee market vs. on-chain fees** — when on-chain fees spike, avoid rebalancing via channel closes; prefer splicing or peer swaps.

## Realistic Expectations
17. **Routing alone rarely beats holding** — typical well-run small nodes earn low single-digit annualized APY on deployed liquidity. Profitability comes from combining routing with value-added services (e.g., paid APIs, LNURL services, liquidity leasing via Lightning Pool-style markets).

## Quick-Start Checklist
- [ ] Node online with >99% uptime
- [ ] Watchtowers configured
- [ ] 5-20 channels to high-centrality peers
- [ ] Fees near network median, reviewed weekly
- [ ] Monthly channel audit (close unproductive)
- [ ] Rebalancing strategy defined
- [ ] Fee/earnings accounting exported regularly
