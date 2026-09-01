# Smart Money Era requirements matrix

Verified against the official BNB Chain page on **2026-08-29**, and corrected on
**2026-08-31** after MT-12 was found filed under the TermiX partner track rather
than the main track.
Source: <https://www.bnbchain.org/en/hackathons/smart-money-era?tab=tracks>

PASS = evidenced, PARTIAL = truthful prototype, FAIL = required evidence missing.

| ID | Requirement | Current repository evidence | Status | Required evidence/action |
| --- | --- | --- | --- | --- |
| MT-01 | Public and functional during judging | Deployment exists; anonymous access is not recorded | FAIL | Private-window and external-network test |
| MT-02 | Surfaced Agents are live on BSC | Home fetches two chain-56 identities; endpoints and tasks are untested | PARTIAL | Identity, metadata, endpoint, canary task and activity |
| MT-03 | Land, find, understand, activate with minimal friction | Landing carries readiness and the next action; Store, Leaderboard and Active Agents share one workspace with anchor navigation | PASS | Re-check after each redesign; this regressed once already |
| MT-04 | Accurate decision-quality data | Registry identity is live; performance and risk are representative | FAIL | Source, time, window, formula and verification level |
| MT-05 | Rebalancing is first-class | Representative cards only | FAIL | One eligible Agent with category metrics and activation |
| MT-06 | Grid Trading is first-class | Representative cards only | FAIL | Same depth as MT-05 |
| MT-07 | Yield Optimisation is first-class | Representative cards only | FAIL | Same depth as MT-05 |
| MT-08 | Health Factor Monitoring is first-class | Representative cards only | FAIL | Same depth as MT-05 |
| MT-09 | Activate hires an Agent | Zero-value self-transaction only | FAIL | Job ID, provider, budget, lifecycle, result and settlement/refund |
| MT-10 | Four categories have equal depth | Generic Agent model and comparison rows | FAIL | Common trust fields plus category-correct metrics |
| MT-11 | Agent diversity is legible | Four anchors share one owner; seven further identities across all four categories are published with the exact check that stopped each | PARTIAL | A second owner reaching TASK_TESTED in any category |
| MT-12 | Agent Advantage Report is attached | Harness built (`scripts/advantage-report.mjs`, `docs/ADVANTAGE_RUNBOOK.md`); no task has been run on either side | FAIL | Three or more tasks run both ways with time, cost, quality and the actual outputs, at least one from trading, stock or security |

## Truth and safety gates

| Gate | Current status | Release rule |
| --- | --- | --- |
| Mock never appears as live | FAIL | Show DEMO, STALE or UNAVAILABLE; never silently substitute |
| Registered is not Verified | FAIL | Apply DATA_METHODOLOGY.md levels |
| Mainnet and Testnet are distinct | PARTIAL | Label every Agent, metric and Job |
| Stop, Revoke, allowance removal and refund are distinct | FAIL | Confirm onchain state before displaying success |
| API failure cannot fabricate data | FAIL | Timestamped stale data or unavailable |
| No unlimited authority | PASS for current proof | Must remain true after real execution |

## Optional tracks

| Track | Decision | Gate |
| --- | --- | --- |
| TermiX | GO for evidence collection | Covered by MT-12. This row previously carried the Agent-versus-manual requirement as though it were TermiX-specific; it is a main-track submission condition scored at 30%, and is now tracked as MT-12 |
| PancakeSwap | Conditional GO | One flagship with measurable LP or trader benefit |
| Altana | BUILT · UNEXECUTED | Wallet, allowlist, cap, expiry and UI revoke are implemented (`docs/ALTANA_SESSION.md`). Session transaction pending a funded chain-97 key |

Partner work stops whenever a main-track FAIL blocks the journey. Altana is the
exception: the published prize gate requires live on-chain transactions through
an Altana session key, so it is a main-track requirement rather than optional
partner work.

## Release gate

0. The Agent Advantage Report is attached. Without it the submission is
   ineligible, whatever else is true.
1. Anonymous production access is recorded.
2. Four categories each contain an eligible live BSC Agent.
3. Unsupported performance claims are absent.
4. Categories have equal discovery, evidence and activation depth.
5. A real Agent Job completes end to end; no fake Hire button exists.
6. Wallet rejection, wrong network, insufficient balance, API failure and Agent timeout recover safely.
