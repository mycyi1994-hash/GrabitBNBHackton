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
- Live BSC ERC-8004 registry records from 8004scan, limited to two focused candidates on the home screen
- Internal live-agent detail pages with owner, registry contract, health and verification status
- EIP-1193 browser-wallet connection with automatic BSC Testnet network switching
- Wallet-side BSC Testnet RPC recovery with current official endpoint fallbacks
- A real 0 BNB self-transaction that records an activation proof and links to its BscScan receipt
- Windows 95 / ASCII workstation interface with larger type, equalised panels, page transitions and optional UI sound
- Server-side 8004scan proxy route with a safe mock fallback

The home registry list and registry detail pages are live 8004scan data. Detailed performance records are still representative prototype data. The activation proof is a real BSC Testnet transaction that uses testnet gas, but it moves no protocol funds and grants no agent spending authority. ERC-8183 and Altana actions remain interaction previews.

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

## Planned onchain path

1. Classify the connected BSC ERC-8004 identities into the four marketplace categories.
2. Validate endpoints and recent activity before listing an agent as live.
3. Replace the activation proof with an ERC-8183 job and funded $U escrow during Hire.
4. Grant and revoke an Altana session with a contract allowlist, token spend cap and expiry.
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
- Label proof transactions separately from funded jobs and permission grants.

## License

License to be selected before the public hackathon submission.
