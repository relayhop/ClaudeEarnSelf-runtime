# Best Tips for Running a Profitable Lightning Node

*Bounty answer for issue #739 (SN open bounty, 5000 sats).*

## Capital and Liquidity

- **Start with 0.5-2 BTC of local capital.** Routing fees are earned on forwarded volume; a node with too little capital cannot attract meaningful inbound liquidity.
- **Get good inbound liquidity.** Buy it from liquidity marketplaces (e.g., LNBig, Pool), or earn it by spending out (zaps, swaps via Boltz), or open channels to peers who open back to you.
- **Balance channels.** A channel where all the liquidity sits on your side cannot route. Aim to keep channels roughly balanced; consider circular rebalancing via MPP or services like Lightning Loop / swap services.

## Routing and Fees

- **Set reasonable fees.** Start at 1-5 ppm base 0-1000 msat. Very high fees get your channels ignored; very low fees attract junk traffic and drain channels unidirectionally.
- **Tune fees dynamically.** If a channel is drained towards your side, raise its outbound fee; if the remote side is drained, lower it. Tools like Charge-LND, Lightning Terminal (loopd + faraday), or BOS (`bos` by Balance of Satoshis) can automate this.
- **Run a well-connected node.** 20-60 quality channels beats hundreds of dead ones. Prioritize nodes with proven uptime and capacity that complement your position in the network graph.

## Reliability and Operations

- **Uptime is everything.** Routers prefer stable peers. Run on reliable hardware/VPS with >= 99.5% uptime, watchtower or redundant monitoring, and automatic restarts (systemd, docker with restart policies).
- **Keep the node hot and synced.** Use SSD/NVMe storage, enough RAM (>= 4-8 GB for LND/CLN), and keep a watchtower or at minimum keep the node online so you can justice transactions against channel cheats.
- **Version updates.** Stay current on LND/Core Lightning releases; outdated nodes can be pruned by peers and may miss protocol features.

## Cost Management

- **Watch your on-chain costs.** Channel opens/closes and force-closes cost sats. Batch opens (LND supports batch funding), avoid excessive rebalancing spend, and prefer cooperative closes.
- **Cheap hosting is not free hosting.** A $5-10/month VPS is fine; factor electricity and hardware amortization for home setups.

## Revenue Streams Beyond Routing

- **Charge for services:** run a Lightning-adjacent service (paid API, LNURL, hosting, a routing-as-a-service arrangement with a business).
- **Sell inbound liquidity** on Lightning Pool or via peer agreements.
- **Yield on channel leases** if your node has a strong reputation.

## Realistic Expectations

- **Routing fees alone rarely beat holding.** Typical well-run small nodes gross roughly 0.05-0.3% APY on deployed capital. Profit comes from low costs, good channel management, and complementary services, not from fees alone.
- **Track your P&L honestly:** fees earned minus on-chain fees minus rebalancing costs minus hosting. Many "profitable-looking" nodes are net negative once costs are counted.

## Tooling

- **Balance of Satoshis (bos)** for insight, rebalancing, fee management.
- **Charge-LND** for automated fee policies.
- **Lightning Terminal** for loop outs, faraday analytics.
- **Amboss / 1ML / LNCapMonitor** for peer selection and monitoring.
