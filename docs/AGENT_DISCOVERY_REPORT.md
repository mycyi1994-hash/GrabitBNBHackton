# Live BSC Agent discovery report

Observed on **2026-08-29 at 13:52 UTC** using the official 8004scan API.

- Builder Hub: <https://8004scan.io/developers>
- BSC registry: <https://8004scan.io/agents?chain=56>
- API base: <https://api.8004scan.io/api/v1>

## Result

8004scan showed 288,128 BSC registrations at observation time. Most search results had no endpoint, feedback or validation. Four candidate identities owned by one Provider passed identity, public Agent Card, service listing and non-funded negotiation checks.

| Category | ERC-8004 identity | Service | Preflight |
| --- | --- | --- | --- |
| Rebalancing | [#304494](https://8004scan.io/agents/bsc/304494) | rebalance_plan | Reachable; quote accepted |
| Grid Trading | [#302258](https://8004scan.io/agents/bsc/302258) | grid_plan | Reachable; quote accepted |
| Yield Optimisation | [#304493](https://8004scan.io/agents/bsc/304493) | yield_plan | Reachable; quote accepted |
| Health Factor Monitoring | [#302257](https://8004scan.io/agents/bsc/302257) | health_factor | Reachable; quote accepted |

Common execution details returned by all four negotiations:

- Provider: 0x73809F69916FcF7Ddc5BB1315fBdf96A569a5963
- Chain ID: 56
- Price: 0.10 $U
- ERC-8183 contract: 0xEa4DAa3100A767e86FDed867729ae7446476EBA6
- Payment token: 0xcE24439F2D9C6a2289F741120FE202248B666666
- Agent Card: <https://agent.brainonbnb.com/.well-known/agent-card.json>
- A2A endpoint: <https://agent.brainonbnb.com/a2a>

The Agent Card and A2A service listing both returned HTTP 200. The list call returned all four required categories. A non-funded negotiate request returned accepted=true for every service and named the same Provider, price, chain and verifying contract.

## Verification level

The candidates are currently **REACHABLE**, not TASK_TESTED.

Passed:

- Chain-56 identity and owner fetched from 8004scan
- Metadata and service declarations parsed
- Public Agent Card returned valid service descriptions
- A2A list call succeeded
- Category negotiation succeeded

Not passed:

- No ERC-8183 Job was funded
- No category deliverable was produced
- No completion, settlement or refund was verified
- No performance history was independently reproduced

They remain marketplace-ineligible under DATA_METHODOLOGY.md until a category task succeeds. They remain direct-hire-ineligible until a real Job reaches verifiable execution.

## Backup candidates

| Category | Candidate | Observation | Decision |
| --- | --- | --- | --- |
| Rebalancing | [Mandate Rebalance #293902](https://8004scan.io/agents/bsc/293902) | Healthy Agent Card and ERC-8183 skills; invocation needs operator-issued OAuth credentials | Backup only |
| Rebalancing | [AiKi LP Rebalancer #315944](https://8004scan.io/agents/bsc/315944) | Public JSON endpoint; read-only recommendation | Advisory backup |
| Grid Trading | [ChainHelix Grid #269224](https://8004scan.io/agents/bsc/269224) | Healthy Agent Card; card advertises ERC-8183, but runtime URL contains localhost | Backup pending task test |
| Yield Optimisation | [TermiX Yield Optimizer #293012](https://8004scan.io/agents/bsc/293012) | Registered A2A service; 8004scan health check returned HTTP 404 | Rejected for now |
| Health Factor Monitoring | [BNB Lending Guardian #292058](https://8004scan.io/agents/bsc/292058) | Relevant Venus description; 8004scan health check returned HTTP 404 | Rejected for now |

## Risks

- All four anchor candidates share one owner and Provider, creating concentration risk.
- Feedback volume is zero or one, so no reputation claim is justified.
- 8004scan health interpretation is inconsistent for the shared A2A route because the Agent Card is a separate URL. Grabit must preserve its own probe result and the upstream result.
- Accepted negotiation proves availability and price, not result quality.
- The main-track interpretation of Testnet execution remains an organizer-confirmation item; these identities and quoted ERC-8183 contract are on chain 56.

## Next decision

Stage 3 may integrate these four identities as PRE-FLIGHT candidates with source links and no performance claims. Stage 4 must complete a small real ERC-8183 Job before the Hire button can be presented as verified.
