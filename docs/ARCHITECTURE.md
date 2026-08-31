# Agent Market architecture

## User flow

~~~mermaid
flowchart LR
  Explore --> Detail
  Detail --> Compare
  Compare --> Hire
  Detail --> Hire
  Hire --> Quote[Live quote + allowlist]
  Quote --> Preflight[Wallet preflight]
  Preflight --> ERC8183[Five user-signed ERC-8183 calls]
  ERC8183 --> Dashboard
  Dashboard --> Outcome[Complete / dispute / refund]
~~~

## Data and execution flow

~~~mermaid
flowchart TD
  Browser[Marketplace UI] --> API[Server quote and Job proxy]
  API --> Scan[8004scan API]
  Scan --> Registry[ERC-8004 identities and feedback]
  API --> Seller[Provider A2A and quote endpoint]
  API --> RPC[BNB Mainnet read checks]
  Browser --> Wallet[User wallet]
  Wallet --> Job[ERC-8183 escrow]
  Job --> Agent[BNB Agent Studio agent]
  Agent --> Protocol[PancakeSwap / Venus / Lista]
  Agent --> Receipt[Deliverable and onchain receipt]
  Receipt --> Browser
~~~

## Trust boundaries

- 8004scan credentials stay in the server runtime.
- The marketplace never stores an unrestricted user private key.
- The server returns no execution plan unless provider, service, chain, addresses, amount, selectors and live contract checks all pass.
- The external Mainnet provider quote is unsigned; the UI exposes this instead of implying cryptographic authentication.
- The Grabit Testnet reference provider signs its chain-97 quote. Its server-only key can submit only Jobs that match the configured provider, router, policy, budget and Grabit reference description.
- Each transaction is simulated immediately before `eth_sendTransaction` and requires a separate user action.
- Approval is exactly 0.10 $U, never unlimited. Only the Fund call moves $U; all five calls can spend BNB gas.
- Local resume data contains Job IDs and transaction hashes only, never wallet secrets.
- Session permissions must include a call allowlist, spend cap and expiry. The
  Altana session grants exactly eight ERC-8183 signatures, caps spending at
  1.00 $U per day and expires after one hour. The cap is ten times the 0.10 $U
  a single job escrows, so a retry inside the Advantage Report run cannot
  strand the session until the spend period rolls over.
- The Altana admin key only grants and revokes; it never signs a job. The session
  key signs jobs and holds no authority beyond the allowlist and cap.
- Session state is read from chain, never remembered: the enforced expiry comes
  from the agent account's own key list and public verifiability from the Altana
  KeyStore.
- Agent performance is stored with its source, observation window and update time.
- Testnet and mock records are visibly labelled.

## Next integration milestones

1. Fund and deliver one read-only Yield canary through the guarded Mainnet console.
2. Preserve the five transaction receipts, recovered Job ID, deliverable digest and full result.
3. Add completion, dispute and refund controls only after the first lifecycle is observed.
4. Grant, exercise and revoke the Altana session onchain and preserve its three receipts.
5. Add a PancakeSwap-backed reference agent and explorer receipts.
