# Grabit

Grabit is an evidence-first marketplace for discovering, verifying and hiring
autonomous DeFi agents on BNB Smart Chain.

It is built for the **BNB Chain Smart Money Era: Build the Era** hackathon. The
product goal is to make an agent's identity, evidence, authority and price
legible enough that a user can decide whether it is worth hiring — and to refuse
to show anything that cannot be traced back to the chain.

## The one idea

Most agent listings answer "what does this agent claim". Grabit answers "what
has this agent actually done", and it answers it the same way for every agent.

Every agent sits on one of six verification rungs:

| Rung | Name | What has actually been shown |
| --- | --- | --- |
| 1 | REGISTERED | An identity exists on chain. Capability is entirely unproven. |
| 2 | METADATA_VALID | Its published description parses and declares real services. |
| 3 | REACHABLE | Its endpoint answered when we asked. It was online, once. |
| 4 | TASK_TESTED | It completed a real task in its own category, under test. |
| 5 | ONCHAIN_EXECUTING | A transaction ties this agent to work someone paid for. |
| 6 | TRACK_RECORDED | Enough completed and failed jobs to be worth comparing. |

The wording is copied from `LADDER` in `lib/verification-ladder.ts`, which is
what the interface renders.

Hiring opens at rung 4. `lib/verification-ladder.ts` walks the rungs from the
bottom and stops at the first unmet check, so a rung is never awarded by
assertion.

**All four listed agents sit on rung 3 today.** The verified tier is therefore
empty, and the product says so rather than filling it. No return figure appears
anywhere in the interface, because none is verifiable from the chain yet.

## What is built

- **Discovery** across all four required categories — Rebalancing, Grid Trading,
  Yield Optimisation and Health Factor Monitoring — at equal depth, indexed live
  from the 8004scan API.
- **A one-screen workspace** at `/` carrying the Agent Store, the evidence
  leaderboard and Active Agents, with the verification ladder on every card.
- **An agent detail screen** at `/activate` that states the rung, the evidence
  behind it, what the agent is and is not for, and a free read-only strategy
  preview that needs no wallet, no signature and no payment.
- **A bounded agent authority** at `/authority`: the agent acts from an Altana
  smart account through a session key whose scope is enforced on chain — exactly
  eight ERC-8183 call signatures, a 1.00 $U per-day spend cap and a one-hour
  expiry, registered in the public Altana KeyStore so a third party can verify
  it without trusting this application. The screen shows what the agent may do,
  what it can never do, and offers a working revoke.
- **A session-signed ERC-8183 hire** that runs the whole buyer lifecycle —
  createJob, registerJob, setBudget, approve, fund — as one atomic relay intent
  signed by the session key, never by a browser wallet and never by the admin
  key.
- **A guarded manual console** at `/activate` for a deliberate user-signed
  canary, with a fixed address and selector allowlist, an exact approval rather
  than an unlimited one, and chain-97 preflight on balance, contract code,
  kernel token and simulation.
- **Server-side data routes** that answer UNAVAILABLE or STALE with a reason,
  and never silently substitute mock data for live data.

## What is not built

Stated here because the same honesty is what the product is arguing for:

- No agent has reached rung 4, so no marketplace hire has been paid. The canary
  path exists to earn that rung and has not yet been run against a funded
  wallet.
- Performance ranking is unavailable until real completed and failed Jobs exist.
- The four listed agents share one owner. A second owner reaching rung 4 is what
  would make diversity real rather than categorical.

Current state is tracked in [docs/PROGRESS.md](docs/PROGRESS.md) and measured
against the published rules in
[docs/REQUIREMENTS_MATRIX.md](docs/REQUIREMENTS_MATRIX.md).

## Run locally

~~~bash
npm install
cp .env.example .env.local   # copy .env.example .env.local on Windows
npm run dev
~~~

Open http://localhost:3000. Discovery works with no configuration at all.

## 8004scan integration

Anonymous 8004scan access works without a key. For higher rate limits, create
one in the 8004scan Builder Hub and set:

~~~bash
SCAN_8004_API_KEY=your_server_only_key
~~~

The browser calls `/api/agents`; the server route calls 8004scan anonymously, or
adds the `X-API-Key` header when a key is configured. The key is never exposed
through a `NEXT_PUBLIC` variable. See the
[Builder Hub](https://8004scan.io/developers).

## Altana session

Two fresh Testnet-only keys, both server-side:

~~~bash
GRABIT_ALTANA_ADMIN_PRIVATE_KEY=   # grants and revokes; also the wallet address
GRABIT_ALTANA_SESSION_PRIVATE_KEY= # the agent's scoped signing key
~~~

They are deliberately separate. The admin key grants and revokes and never signs
a job; the session key signs jobs and holds no authority beyond the allowlist
and the cap. A leaked session key can replay the capped lifecycle against
allowlisted contracts and can do nothing else.

Without them every Altana route answers UNAVAILABLE with its reason, rather than
displaying a permission the agent does not hold.

~~~bash
npm run altana keys    # generate the two keys locally; nothing is transmitted
npm run altana check   # report whether the agent can act yet
~~~

Runbook: [docs/ALTANA_SESSION.md](docs/ALTANA_SESSION.md).

## Agent Advantage Report

The hackathon requires a report comparing real tasks run through the marketplace
against the same tasks run without an agent. Grabit measures that rather than
estimating it: both sides answer the identical prompt from
`docs/advantage/tasks.json` — the same string the product sends an agent — and
the harness records wall-clock time itself.

~~~bash
npm run advantage list
npm run advantage manual start 302258
npm run advantage manual stop 302258
npm run advantage agent 302258
npm run advantage score 302258 manual
npm run advantage render
~~~

Runbook: [docs/ADVANTAGE_RUNBOOK.md](docs/ADVANTAGE_RUNBOOK.md).

## Routes

| Route | What it is |
| --- | --- |
| `/` | Landing, Agent Store, evidence leaderboard, Active Agents |
| `/activate` | Agent detail, strategy preview and the guarded hire console |
| `/authority` | What the agent may do, its live on-chain scope, and revoke |
| `/dashboard` | Category readiness and execution queue |
| `/compare` | Side-by-side evidence across candidates |
| `/registry/[tokenId]` | Registry identity detail, hardened against upstream failure |
| `/agents/[slug]` | Per-agent profile |

## API

- `GET /api/agents` — live 8004scan index; also `?limit=` and `?q=`
- `GET /api/hire/quote?registry=304493`
- `GET /api/hire/strategy-preview?registry=304493` — free, read-only, no wallet
- `GET /api/hire/testnet-readiness`
- `GET /api/hire/testnet-quote?registry=304493`
- `GET|POST /api/hire/testnet-provider`
- `GET /api/hire/job?jobId=56657`
- `POST /api/hire/notify`
- `GET /api/altana/session` — the live on-chain session authority
- `POST /api/altana/session` — grant or revoke
- `POST /api/altana/hire` — session-signed hire; `dryRun` proves the plan without spending

## Data integrity rules

These are enforced in code, not just documented:

- Never present a simulated action as an on-chain transaction.
- Never let an API failure fabricate data — answer STALE with a timestamp, or
  UNAVAILABLE with a reason.
- Registered is not Verified. Apply the ladder in
  [docs/DATA_METHODOLOGY.md](docs/DATA_METHODOLOGY.md).
- Show the observation window beside every return metric, and do not display a
  performance value before its source and window exist.
- Show drawdown, risk and settled-Job count beside any return.
- Keep Mainnet and Testnet labelled distinctly on every agent, metric and Job.
- Keep API credentials server-side.
- Label proof transactions separately from funded Jobs and permission grants.

## Documentation

- [Architecture](docs/ARCHITECTURE.md)
- [Requirements matrix](docs/REQUIREMENTS_MATRIX.md)
- [Delivery progress](docs/PROGRESS.md)
- [Altana session gate](docs/ALTANA_SESSION.md)
- [Agent Advantage Report runbook](docs/ADVANTAGE_RUNBOOK.md)
- [Data and verification methodology](docs/DATA_METHODOLOGY.md)
- [ERC-8183 paid canary plan](docs/ERC8183_CANARY_PLAN.md)
- [Live Agent discovery report](docs/AGENT_DISCOVERY_REPORT.md)
- [Live Agent verification registry](docs/LIVE_AGENT_REGISTRY.json)
- [Product scope freeze](docs/SCOPE_FREEZE.md)
- [User test checklist](docs/USER_TEST_CHECKLIST.md)

## License

[Apache License 2.0](LICENSE).

Apache-2.0 rather than MIT because the main-track prize is adoption of the
winning submission as the official BNB Agent Studio marketplace: its explicit
patent grant and contribution terms are what make that adoption safe for both
sides. It also matches the licence of the Altana SDK this project builds on.
