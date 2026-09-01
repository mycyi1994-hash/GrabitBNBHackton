# Agent Advantage Report

Generated 2026-09-01T03:52:33.941Z by `scripts/advantage-report.mjs render`.

Every figure below was measured by that script at the moment the work ran.
Nothing here is estimated. Prompts come from `docs/advantage/tasks.json`, which
is also what the product sends an agent, so both sides answered the same string.

## Method

- **Time** is wall clock, recorded by the harness, not typed in afterwards.
- **Cost** on the agent side is what the Job escrowed on chain, with the transaction linked.
  On the manual side there is no out-of-pocket cost, only labour, priced at
  $60/hour. A mid-level DeFi analyst rate. It is stated rather than assumed because a comparison that prices human labour at zero flatters the agent by construction.
- **The manual side** is an operator working from BscScan with a general-purpose AI assistant.
  This is the realistic alternative to hiring an agent in 2026, and it is a harder baseline than an operator working alone, so any advantage the marketplace shows is measured against the stronger comparison. It is still 'without an agent hired through this marketplace', which is what the requirement asks. Naming it matters: a reader who assumed 'manual' meant unaided would be reading the wrong comparison.
- **Networks.** Analysis reads BNB Smart Chain mainnet (chain 56); settlement runs on
  BNB Smart Chain testnet (chain 97). The tasks ask for live market state — pool prices, Venus collateral factors, real positions — and that state only exists on mainnet. A testnet pool with no real liquidity would make every number meaningless. Payment is a different question: ERC-8183 and the Altana session key are exercised on chain 97, where the $U token is a valueless test token, because no part of this demonstration should move real funds. So each task reads mainnet and escrows on testnet, and both sides of the comparison read the same mainnet state.
- **Output quality** is five binary criteria, fixed before any run and applied
  identically to both sides:

  1. Produces the artifact that was asked for, not a description of how one would produce it.
  2. Every quantitative claim names where it came from: a contract address, a block height, or a named public endpoint.
  3. Inputs the answer had to assume are written down rather than silently chosen.
  4. At least one concrete way the plan loses money or fails is identified.
  5. A third party can re-derive the same numbers from what is written, without asking the author.

> **On timing.** Task 302258 is the exception on timing. Its method was derived in conversation before the clock was started, so its recorded time covers verification and write-up only and understates the manual cost. That error runs against the agent, not for it. Every later task was timed from before the first question was asked.

## Results

| Task | Category | Domain | Manual time | Agent time | Manual cost | Agent cost | Manual quality | Agent quality |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 304494 | Rebalancing | trading | 150s | 6s | $2.50 | 0.10 test $U | 5/5 | 4/5 |
| 302258 | Grid Trading | trading | 110s | 8s | $1.83 | 0.10 test $U | 5/5 | 4/5 |
| 304493 | Yield Optimisation | yield | 548s | 6s | $9.13 | 0.10 test $U | 5/5 | 2/5 |

Totals across 3 tasks: 808s manual against 20s through the marketplace,
and $13.46 of labour against 3 escrowed jobs.

Domains covered: trading, yield. The submission requires at least one of
trading, stock or security; this report carries trading.

## Tasks

### 304494 — Rebalancing

> Price a read-only rebalance plan for a WBNB/USDT position. Include the proposed weights, estimated pool costs and source block. Do not move funds.

| | Manual | Through Grabit |
| --- | --- | --- |
| Time | 150s | 6s |
| Cost | $2.50 of operator time | 0.10 test $U escrowed |
| Quality | 5/5 | 4/5 |
| Output | [`docs/advantage/outputs/304494.manual.md`](advantage/outputs/304494.manual.md) | [`docs/advantage/outputs/304494.agent.md`](advantage/outputs/304494.agent.md) |

On-chain Job 851: https://testnet.bscscan.com/tx/0x74bf586e63280f88d3be548020bd78a273683e773e2916a0823ca581e9bcd2e9

Quality differed on:

- Every quantitative claim names where it came from: a contract address, a block height, or a named public endpoint. — manual yes, agent no

Manual note: tick cross-check pins the price; the block is a bound, not a point, and the write-up says so

Agent note: no mainnet market data was read at all; position and fee are both demo inputs

### 302258 — Grid Trading

> Build a read-only WBNB grid plan with 10 levels across a 15% band and 1000 USD notional. Include fees, break-even spacing and source block. Do not trade.

| | Manual | Through Grabit |
| --- | --- | --- |
| Time | 110s | 8s |
| Cost | $1.83 of operator time | 0.10 test $U escrowed |
| Quality | 5/5 | 4/5 |
| Output | [`docs/advantage/outputs/302258.manual.md`](advantage/outputs/302258.manual.md) | [`docs/advantage/outputs/302258.agent.md`](advantage/outputs/302258.agent.md) |

On-chain Job 850: https://testnet.bscscan.com/tx/0x67aa71c48b2e7ca00c8b74917cb1f958ce1574a1a56c3a720dd40fd8f68e2ea8

Quality differed on:

- Every quantitative claim names where it came from: a contract address, a block height, or a named public endpoint. — manual yes, agent no

Manual note: tick cross-check made the price defensible; band-exit risk is the real weakness of the plan

Agent note: pool fee is a 0.25% generic reference, not read from the pool — the real fee is 0.05%, so break-even is 5x off

### 304493 — Yield Optimisation

> Rank current Venus supply yields for USDT on BNB Chain, include net APY, gas break-even and source block. Do not move funds.

| | Manual | Through Grabit |
| --- | --- | --- |
| Time | 548s | 6s |
| Cost | $9.13 of operator time | 0.10 test $U escrowed |
| Quality | 5/5 | 2/5 |
| Output | [`docs/advantage/outputs/304493.manual.md`](advantage/outputs/304493.manual.md) | [`docs/advantage/outputs/304493.agent.md`](advantage/outputs/304493.agent.md) |

On-chain Job 852: https://testnet.bscscan.com/tx/0x81afca369c4c5cf66373c91b80b0823639b667fb2e23bf756ee0bb6e013cf5de

Quality differed on:

- Every quantitative claim names where it came from: a contract address, a block height, or a named public endpoint. — manual yes, agent no
- Inputs the answer had to assume are written down rather than silently chosen. — manual yes, agent no
- A third party can re-derive the same numbers from what is written, without asking the author. — manual yes, agent no

Manual note: tick cross-check made the price defensible; band-exit risk is the real weakness of the plan

Agent note: blocks-per-year was chosen silently; 1.71% cannot be re-derived from supplyRatePerBlock and the observed 0.45s block time gives 2.91%

