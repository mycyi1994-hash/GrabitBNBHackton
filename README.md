# Agent Market

Agent Market is an evidence-first prototype for discovering and verifying autonomous DeFi agents on BNB Smart Chain.

It is being built for the **BNB Chain Smart Money Era: Build the Era** hackathon. The product goal is to make onchain agent identity, performance, risk, price and permissions legible enough for a user to decide whether an agent is worth hiring.

## Current product slice

- Explore all four required categories:
  - Rebalancing
  - Grid Trading
  - Yield Optimisation
  - Health Factor Monitoring
- Four curated BSC ERC-8004 identities, one per required category, loaded from 8004scan
- A landing and Agent Store surface with one detail action per Agent, and a separate /dashboard route for the evidence leaderboard
- Internal live-agent detail pages with owner, registry contract, health and verification status
- Evidence leaderboard that separates registry, endpoint, quote and delivered-task gates
- Verification dashboard with category readiness and execution queue
- Guarded ERC-8183 Mainnet Hire console with a fixed-address and selector allowlist
- Testnet-first execution mode with explicit Mainnet / Testnet selection
- Live BSC Testnet checks for chain 97, proxy implementations, kernel token, policy allowlist and dispute window
- Testnet wallet preflight for tBNB and test $U, with direct faucet links and zero automatic transactions
- Testnet-only reference provider with a signed two-hour quote, onchain Job validation and server-held signing key
- Four category-specific reference engines: rebalance sizing, grid construction, direct onchain Venus Core yield ranking and health-factor stress testing
- A one-card Agent result view ordered as verdict, key metrics, next actions, risks and onchain evidence
- One-click read-only strategy preview with no wallet, signature, Job or payment, clearly separated from delivered onchain results
- Five explicit chain-97 client transactions followed by user-triggered provider submission and optimistic settlement
- Live provider quote plus BSC contract verification before any wallet prompt
- Five sequential user-signed transactions: create, bind policy, set budget, exact approval and fund
- Wallet preflight for chain 56, contract code, kernel token, $U balance, BNB gas reserve and simulation
- Local resume and Job ID recovery without storing a key or sending a transaction automatically
- Windows 95 / ASCII workstation interface with larger type, equalised panels, page transitions and optional UI sound
- Altana agent wallet with a scoped session key: an ERC-8183 call allowlist, a 0.10 $U per-day spend cap and a one-hour expiry, registered in the public Altana KeyStore
- Session-signed ERC-8183 hire that runs the whole buyer lifecycle as one atomic relay intent
- An in-product "what this Agent may do" panel that reads the enforced expiry from the agent's own account, public verifiability from KeyStore, and offers a working revoke
- Server-side 8004scan proxy route with explicit unavailable/stale responses and no silent mock fallback

The landing, store, leaderboard, dashboard and registry detail routes use the same source-backed candidate model. The single-workspace layout that earlier revisions described was replaced by the observatory redesign: the leaderboard is reached through /dashboard, and there is no Active Agents surface yet. The four selected services returned successful non-funded A2A negotiations, but no paid Grabit category task has been completed yet. The execution console is available for a deliberate user-signed canary, while performance ranking remains unavailable until real results exist.

## Run locally

~~~bash
npm install
copy .env.example .env.local
npm run dev
~~~

Open http://localhost:3000.

## 8004scan integration

Anonymous 8004scan access works without configuration. For higher rate limits,
create an API key in the 8004scan Builder Hub and set:

~~~bash
SCAN_8004_API_KEY=your_server_only_key
~~~

The browser calls /api/agents; the server route calls 8004scan anonymously or
adds the X-API-Key header when a key is configured. The key is never exposed
through a NEXT_PUBLIC variable. See the [official Builder Hub](https://8004scan.io/developers).

## Altana session

The agent acts from an Altana smart account through a session key whose
authority is bounded on-chain. Set two fresh Testnet-only keys:

~~~bash
GRABIT_ALTANA_ADMIN_PRIVATE_KEY=   # grants and revokes; also the wallet address
GRABIT_ALTANA_SESSION_PRIVATE_KEY= # the agent's scoped signing key
~~~

Both stay server-side. Without them every Altana route answers UNAVAILABLE with
its reason rather than showing a permission the agent does not hold.

Supported prototype queries:

- GET /api/agents
- GET /api/agents?limit=2
- GET /api/agents?q=PancakeSwap
- GET /api/hire/quote?registry=304493
- GET /api/hire/testnet-readiness
- GET /api/hire/strategy-preview?registry=304493
- GET /api/hire/testnet-quote?registry=304493
- GET /api/hire/testnet-provider?jobId=1
- POST /api/hire/testnet-provider with an allowlisted jobId and submit or settle action
- GET /api/hire/job?jobId=56657
- POST /api/hire/notify with a funded numeric jobId
- GET /api/altana/session for the live on-chain session authority
- POST /api/altana/session with a grant or revoke action
- POST /api/altana/hire with an allowlisted registry, optionally dryRun

## Planned onchain path

1. Fund the configured Testnet-only reference-provider address with tBNB gas.
2. Fund a client wallet with tBNB and test $U and pass the chain-97 wallet preflight.
3. Run and record the five-step Testnet Hire lifecycle, provider result submission and 15-minute settlement.
4. Use the guarded Mainnet console to run one paid 0.10 $U Yield canary.
5. Inspect and preserve the deliverable, settlement outcome and transaction receipts.
6. Grant and revoke the Altana session with its contract allowlist, token spend cap and expiry, and record the three receipts (grant, session-signed job, revoke). See [docs/ALTANA_SESSION.md](docs/ALTANA_SESSION.md) for the runbook.
7. Move verified Job status and deliverables into the one-screen Dashboard.

See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) for the system flow.

## Phase 1 strategy baseline

The scope and evidence rules were frozen on 2026-08-29:

- [Requirements matrix](docs/REQUIREMENTS_MATRIX.md)
- [Product scope freeze](docs/SCOPE_FREEZE.md)
- [Data and verification methodology](docs/DATA_METHODOLOGY.md)
- [Live Agent verification registry](docs/LIVE_AGENT_REGISTRY.json)
- [Live Agent discovery report](docs/AGENT_DISCOVERY_REPORT.md)
- [Current delivery progress](docs/PROGRESS.md)
- [User test checklist](docs/USER_TEST_CHECKLIST.md)
- [ERC-8183 paid canary plan](docs/ERC8183_CANARY_PLAN.md)
- [Altana session gate](docs/ALTANA_SESSION.md)

Registration alone is insufficient. Metadata, endpoint and category-task checks are required; Direct Hire also requires execution evidence.

## Data integrity rules

- Show the observation period beside every return metric.
- Show drawdown, risk and number of settled jobs beside returns.
- Preserve source timestamps and expose stale-data states.
- Keep API credentials server-side.
- Do not display performance values until their source and observation window exist.
- Never present a simulated action as an onchain transaction.
- Label proof transactions separately from funded jobs and permission grants.

## License

License to be selected before the public hackathon submission.
