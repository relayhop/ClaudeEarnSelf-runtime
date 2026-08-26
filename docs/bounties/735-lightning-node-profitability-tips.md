# Bounty #735: Best Tips for Running a Profitable Lightning Node

> Reward: 5000 sats · Status: OPEN_BOUNTY · Tags: bitcoin, lightning

This document answers the bounty question with practical, actionable guidance for operators who want their Lightning node to be net-positive.

## 1. Fees: The Only Real Revenue

A Lightning node earns from routing fees and, optionally, from channel leasing (hosted channels). Everything else is cost.

- **Set realistic base/ppm fees.** Start with a low ppm (e.g. 1-10 ppm) and a small base fee (0-1 sat) on well-connected peers; raise fees on channels where you see consistent routing volume and demand.
- **Automate fee management.** Tools like `charge-lnd`, `lnd-fee-optimizer` (RTL), or `boltz-fee-policy` adjust fees based on channel flow imbalance. A channel that is stuck all on one side should have its fee raised to push flow back.
- **Watch routing attempts, not just successes.** If HTLCs fail because of fee policy or lack of inbound capacity, you are leaving money on the table.

## 2. Liquidity Management

- **Buy balanced channels.** Channels from reputable liquidity providers (via LNMarket, amboss liquidity ads, Ring of Fire, Lightning Pool historically) give you routing capacity quickly. Only buy when you have a strategy for the inbound side.
- **Keep channels balanced.** Use circular rebalancing (`rebalance-lnd`, `balanceofsatoshis`) when the cost of the rebalance is far below the expected routing revenue of the unlocked capacity.
- **Prefer many medium channels over one huge channel.** A single 0.5 BTC channel is a single point of failure and rarely routes more than several smaller well-placed channels.
- **Seek inbound capacity deliberately.** Open channels to nodes that will send you traffic, not just big nodes. Peer selection matters more than channel size.

## 3. Node Placement and Peering

- **Get good uptime (99.9%+).** A node that is offline fails HTLCs, gets penalized in routing scores, and loses fees.
- **Use watchtowers** so your node stays safe even during downtime.
- **Maintain 15-30 active, well-chosen channels** rather than hundreds of zombie channels. Each channel costs on-chain fees to open/close and adds watchtower/backup overhead.
- **Peer with nodes complementary to yours:** if you connect to major exchanges and merchants, you capture two-sided flow.

## 4. Cost Control

- **Run your own full node** (Bitcoin Core) rather than a third-party backend (Neutrino). Neutrino degrades routing performance.
- **Hardware:** a small VPS or a Raspberry Pi 4/5 with an SSD is enough for LND/Core Lightning. Avoid overpaying for hosting.
- **Anchor-approval channel type** (LND 0.17+) to reduce on-chain cost of force-closes.
- **Close zombie channels.** Channels with no routing in 60-90 days still cost backup storage and watchtower slots. Consolidate that liquidity.

## 5. Security (Profitable = Not Robbed)

- **Encrypted static channel backups**, off-machine.
- **Watchtowers** (e.g. third-party watchtower networks) for justice transactions.
- **Keep hot wallet small**: sweep routing earnings periodically to a cold wallet.
- **Keep software updated** — force-close exploits and fee-stealing bugs have existed in all implementations.

## 6. Measure Everything

- Monitor with RTL, ThunderHub, LNmetrics, or `lncli fwdinghistory`.
- Track **profit per channel per month** (routing fees minus rebalance and on-chain costs) and prune the losers.
- Expect realistic numbers: small hobby nodes typically route a few hundred thousand to a few million sats/month; a well-run mid-size node can earn a modest but real passive income. Do not expect to get rich — treat it as an earned education in liquidity.

## TL;DR

1. Automate fee policies based on channel balance.
2. Buy liquidity only when you know where the inbound will come from.
3. Keep uptime high and software patched.
4. Prune unprofitable channels ruthlessly.
5. Route volume matters more than channel count or size.
