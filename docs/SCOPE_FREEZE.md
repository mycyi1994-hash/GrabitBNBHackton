# Product scope freeze

Frozen on **2026-08-29**.

> Grabit turns live BSC Agents into hireable financial products: verify the evidence, compare the risk and execute onchain.

## Frozen product surface

~~~text
BNB AGENT DESKTOP
|- Header: BSC status / data time / wallet
|- Categories: All / Rebalancing / Grid / Yield / Health
|- Agent Store
|- Category Leaderboard
|- My Active Agents: Job / result / Stop / Revoke / Refund
~~~

- Detail opens as one desktop window.
- Compare is limited to two Agents inside Detail.
- Activate is one confirmation surface with safe defaults.
- Wallet connection starts only at activation.

## P0

1. Verify public anonymous access.
2. Establish one eligible Agent per category.
3. Replace silent mock fallback with DEMO, STALE and UNAVAILABLE.
4. Attach evidence metadata to every metric.
5. Replace zero-value self-transfer with a real Agent Job.
6. Display Job ID, provider, budget, state, result and transactions.
7. Give all categories equal depth.
8. Handle wallet, network, balance, API and Agent failures.

## P1

- Second verified Agent per category
- Category-specific leaderboards
- Completed Job Action Receipts
- One PancakeSwap flagship
- TermiX experiment report
- Altana only if its 48-hour gate passes

## Parked

- Additional routes
- Global cross-category ROI
- More assets, tokens or pairs
- New ASCII decoration, automatic audio and long transitions
- Agent-to-Agent hiring
- Multiple bounty products
- Advanced charts and settings

Windows 95/ASCII remains, but cannot obscure data or add steps. Sound defaults off before release.

## Decisions

- 8004scan is discovery, not proof of function.
- Existing live Agents are preferred.
- Build a reference Agent only after discovery and endpoint testing fail.
- Non-activatable Agents have no active Hire button.
- Unsupported APR, ROI, PnL, drawdown, reputation, jobs and permissions are removed.
- Mainnet and Testnet never share one LIVE label.
- The current self-transfer is a Wallet Test, not activation.

Target lifecycle:

~~~text
CREATE -> TERMS -> BUDGET -> FUND -> WORK -> DELIVER -> COMPLETE/DISPUTE -> SETTLE/REFUND
~~~

## 48-hour sprint

| Deadline | Evidence | Pivot |
| --- | --- | --- |
| +12h | Four-category candidate inventory | Stop UI work and broaden discovery |
| +24h | Identity, endpoint and task checks | Mark failed candidates ineligible |
| +36h | One real Job reaches funded/working | Stop partner work if missing |
| +48h | Coverage plan and repeatable Job path | Build only missing reference Agents |
