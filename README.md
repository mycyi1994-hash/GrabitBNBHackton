# Agent Market

Agent Market is a prototype marketplace for discovering, comparing, hiring and managing autonomous DeFi agents on BNB Smart Chain.

It is being built for the **BNB Chain Smart Money Era: Build the Era** hackathon. The product goal is to make onchain agent identity, performance, risk, price and permissions legible enough for a user to decide whether an agent is worth hiring.

## Current product slice

- Explore all four required categories:
  - Rebalancing
  - Grid Trading
  - Yield Optimisation
  - Health Factor Monitoring
- Agent detail with performance, downside, reputation, recent jobs and permissions
- Side-by-side comparison
- Three-step Hire / Activate prototype
- Agent management dashboard with pause and revoke interactions
- Server-side 8004scan proxy route with a safe mock fallback

All displayed performance records are representative prototype data. No real funds are moved and the current wallet, ERC-8183 and Altana actions are interaction previews.

## Run locally

~~~bash
npm install
copy .env.example .env.local
npm run dev
~~~

Open http://localhost:3000.

## 8004scan integration

Create an API key in the 8004scan Builder Hub and set:

~~~bash
SCAN_8004_API_KEY=your_server_only_key
~~~

The browser calls /api/agents; the server route calls 8004scan with the X-API-Key header. The API key is never exposed through a NEXT_PUBLIC variable.

Supported prototype queries:

- GET /api/agents
- GET /api/agents?q=liquidity
- GET /api/agents?owner_address=0x...
- GET /api/agents?category=Grid%20Trading in mock mode

## Planned onchain path

1. Pull and classify live BSC ERC-8004 identities through 8004scan.
2. Validate endpoints and recent activity before listing an agent as live.
3. Create an ERC-8183 job and fund its $U escrow during Hire.
4. Grant an Altana session with a contract allowlist, token spend cap and expiry.
5. Track job status and deliverables in Dashboard.
6. Settle, dispute, refund or revoke from the user-facing controls.

See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) for the system flow.

## Data integrity rules

- Show the observation period beside every return metric.
- Show drawdown, risk and number of settled jobs beside returns.
- Preserve source timestamps and expose stale-data states.
- Keep API credentials server-side.
- Mark mock, testnet and mainnet records clearly.
- Never present a simulated action as an onchain transaction.

## License

License to be selected before the public hackathon submission.

