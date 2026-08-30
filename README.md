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
- Internal live-agent detail pages with owner, registry contract, health and verification status
- Evidence leaderboard that separates registry, endpoint, quote and delivered-task gates
- Verification dashboard with category readiness and execution queue
- Guarded ERC-8183 Mainnet Hire console with a fixed-address and selector allowlist
- Live provider quote plus BSC contract verification before any wallet prompt
- Five sequential user-signed transactions: create, bind policy, set budget, exact approval and fund
- Wallet preflight for chain 56, contract code, kernel token, $U balance, BNB gas reserve and simulation
- Local resume and Job ID recovery without storing a key or sending a transaction automatically
- Windows 95 / ASCII workstation interface with larger type, equalised panels, page transitions and optional UI sound
- Server-side 8004scan proxy route with explicit unavailable/stale responses and no silent mock fallback

The home, leaderboard, dashboard and registry detail pages use the same source-backed candidate model. The four selected services returned successful non-funded A2A negotiations, but no paid Grabit category task has been completed yet. The execution console is available for a deliberate user-signed canary, while performance ranking remains unavailable until real results exist. The earlier self-transaction proof and representative performance dataset were removed from the user-facing product.

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

Supported prototype queries:

- GET /api/agents
- GET /api/agents?limit=2
- GET /api/agents?q=PancakeSwap
- GET /api/hire/quote?registry=304493
- GET /api/hire/job?jobId=56657
- POST /api/hire/notify with a funded numeric jobId

## Planned onchain path

1. Use the guarded console to run one paid 0.10 $U Yield canary.
2. Inspect and preserve the deliverable and all five transaction receipts.
3. Wait for settlement or exercise the documented dispute/refund path.
4. Grant and revoke an Altana session with a contract allowlist, token spend cap and expiry.
5. Move verified Job status and deliverables into the one-screen Dashboard.

See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) for the system flow.

## Phase 1 strategy baseline

The scope and evidence rules were frozen on 2026-08-29:

- [Requirements matrix](docs/REQUIREMENTS_MATRIX.md)
- [Product scope freeze](docs/SCOPE_FREEZE.md)
- [Data and verification methodology](docs/DATA_METHODOLOGY.md)
- [Live Agent verification registry](docs/LIVE_AGENT_REGISTRY.json)
- [Live Agent discovery report](docs/AGENT_DISCOVERY_REPORT.md)
- [Current delivery progress](docs/PROGRESS.md)
- [ERC-8183 paid canary plan](docs/ERC8183_CANARY_PLAN.md)

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
