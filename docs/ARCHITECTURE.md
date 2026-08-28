# Agent Market architecture

## User flow

~~~mermaid
flowchart LR
  Explore --> Detail
  Detail --> Compare
  Compare --> Hire
  Detail --> Hire
  Hire --> Permissions
  Permissions --> ERC8183[ERC-8183 job]
  ERC8183 --> Dashboard
  Dashboard --> Revoke
~~~

## Data and execution flow

~~~mermaid
flowchart TD
  Browser[Marketplace UI] --> API[Server API routes]
  API --> Scan[8004scan API]
  Scan --> Registry[ERC-8004 identities and feedback]
  Browser --> Wallet[User wallet]
  Wallet --> Altana[Altana scoped session]
  Altana --> Job[ERC-8183 job escrow]
  Job --> Agent[BNB Agent Studio agent]
  Agent --> Protocol[PancakeSwap / Venus / Lista]
  Agent --> Receipt[Deliverable and onchain receipt]
  Receipt --> Browser
~~~

## Trust boundaries

- 8004scan credentials stay in the server runtime.
- The marketplace never stores an unrestricted user private key.
- Session permissions must include a call allowlist, spend cap and expiry.
- Agent performance is stored with its source, observation window and update time.
- Testnet and mock records are visibly labelled.

## Next integration milestones

1. Map the live 8004scan response schema into the local Agent view model.
2. Add live-status verification for seller endpoints.
3. Connect a wallet provider on BSC testnet.
4. Create and track one real ERC-8183 testnet job.
5. Grant and revoke one Altana session onchain.
6. Add a PancakeSwap-backed reference agent and explorer receipts.
