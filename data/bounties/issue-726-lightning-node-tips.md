# Best Tips for Running a Profitable Lightning Node

*Bounty ID: 1549793 | Asset: bitcoin | Amount: 5000 sats | Issue: #726*

## 1. Channel Management

- **Open channels to well-connected peers**: Target nodes with high betweenness centrality (use 1ml.com or Amboss to research). Routing revenue depends on being in the payment path.
- **Keep channels balanced**: Use circular rebalancing (loop out/in) when liquidity skews too far in one direction. Aim for a 50/50 local/remote split on high-traffic channels.
- **Close dead channels**: Channels with no routing volume for 30+ days cost you nothing but capital. Rotate that liquidity to productive peers.
- **Prefer larger, fewer channels** over many tiny ones when starting out: fees and management overhead scale with channel count.

## 2. Liquidity Strategy

- **Inbound liquidity is the bottleneck**: You earn fees when payments flow *through* you, which requires remote balance. Acquire it via:
  - Opening channels to nodes that will route back to you.
  - Using Lightning Loop (loop out) to convert outbound into inbound.
  - Selling goods/services over Lightning.
- **Two-way liquidity matters**: A node that can only route in one direction earns half as much. Pair inbound-heavy channels with outbound-heavy counterparts.
- **Anchor to major routing hubs** (e.g., well-run swap services and exchanges) for steady two-sided flow.

## 3. Fee Setting

- **Don't chase 1-sat base fees blindly**: Lower fees only help if you have routing volume. Test fee tiers and watch actual forwarded volume.
- **Segment your channels**: High-traffic channels can sustain higher fees; long-tail channels should be near-zero to attract flow.
- **Use fee management tooling**: Charge Lightning (lnd), Bos (Balance of Satoshis), or LNMonitor to auto-adjust fees by channel performance.

## 4. Cost Control

- **Run on cheap, reliable infrastructure**: A VPS at $5-10/month is enough for most small nodes. Don't over-provision.
- **Watch your on-chain costs**: Channel opens/closes and rebalancing transactions eat directly into routing revenue. Batch opens where possible and use fee estimation aggressively.
- **Back up static channel backups** and verify your recovery path — losing funds is the fastest way to be unprofitable.

## 5. Reliability (the #1 profitability factor)
- **99%+ uptime**: Routing peers avoid unreliable nodes. Use watchtowers if you can't be online 24/7.
- **Keep your node synced and updated**: Timelock-expired or force-closed channels due to stale software are costly.
- **Low latency helps**: Peers and routers prefer responsive nodes.

## 6. Realistic Expectations

- **Small nodes rarely beat a savings account on routing fees alone**: Return on deployed liquidity is typically low single digits annually.
- **Diversify revenue**: Routing + on-chain batch arbitrage + Lightning services (e.g., offering swaps, liquidity leases via Lightning Pool) stack better than routing alone.
- **Track your ROI properly**: Log forwarded volume, fees earned, and on-chain costs per channel. Kill channels whose cost exceeds their revenue.

## 7. Tooling Recommendations

- **lnd**: mature, best-documented; use with Balance of Satoshis for rebalancing and fee management.
- **Core Lightning (CLN)**: excellent for plugin-driven automation.
- **Monitoring**: RTL, ThunderHub, or LNmetrics dashboards to watch per-channel profitability.

---

*Summary: profitability = reliable uptime + balanced, well-placed liquidity + disciplined fee/cost management. Start small, measure per-channel ROI, and rotate liquidity toward channels that actually earn.*
