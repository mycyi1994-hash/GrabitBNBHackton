# Altana session gate

Written on **2026-08-31**. This document records what was built, what is still
unverified, and the two address facts an operator must confirm on-chain before
trusting this path.

## Why this exists

The hackathon's prize gate is not satisfied by a working marketplace alone. A
submission is only eligible once it shows live on-chain transactions through an
Altana session key, on testnet or mainnet:

1. The agent holds its own Altana wallet.
2. Its session carries real limits — a call allowlist, a spend cap and an expiry.
3. The session is registered in the public KeyStore, so the delegation is read
   from chain rather than taken from a pitch.
4. Real transactions go out through that session key.
5. The user can see what the agent may do, and revoke it, inside the product.

Grabit previously had none of this. It now has 1, 2, 3 and 5 implemented, and 4
implemented but unexecuted — no session has been granted yet, because that needs
a funded chain-97 key.

## Shape

| Piece | Where |
| --- | --- |
| Network, permissions, KeyStore and account reads | `lib/altana.ts` |
| Grant, revoke and live status | `app/api/altana/session/route.ts` |
| Session-signed ERC-8183 hire | `app/api/altana/hire/route.ts` |
| "What this Agent may do" panel with revoke | `components/altana-session-panel.tsx` |

The agent wallet is an Altana smart account at the admin signer's own address.
Two server-only keys are used, and they are deliberately different:

- `GRABIT_ALTANA_ADMIN_PRIVATE_KEY` grants and revokes. It never signs a job.
- `GRABIT_ALTANA_SESSION_PRIVATE_KEY` is the agent's signing key. Its authority
  is bounded on-chain.

The session key is supplied rather than generated so that the session survives
across stateless requests. That is what lets the product read the live
authority back out of the chain and revoke it later.

## Granted scope

Calls — nothing outside this list can be signed by the session:

| Signature | Contract | Why the agent needs it |
| --- | --- | --- |
| `createJob(address,address,uint256,string,address)` | commerce | Open one escrowed Job |
| `registerJob(uint256,address)` | router | Bind the optimistic settlement policy |
| `setBudget(uint256,uint256,bytes)` | commerce | Set the Job budget |
| `approve(address,uint256)` | $U token | Approve the escrow amount |
| `fund(uint256,uint256,bytes)` | commerce | Move the amount into escrow |
| `settle(uint256,bytes)` | router | Release escrow after the dispute window |
| `dispute(uint256)` | policy | Contest a deliverable inside the window |
| `claimRefund(uint256)` | commerce | Reclaim escrow when nothing is delivered |

Spend: **1.00 $U per day**, on the chain's $U token only. One job escrows
0.10 $U, so the ceiling is ten jobs a day, sized to leave retry headroom for
the four-task Agent Advantage Report.
Expiry: **3600 seconds** per grant.

A leaked session key can therefore replay the capped job lifecycle against
allowlisted contracts and can do nothing else. No transfers, no unbounded
approvals, no other contract.

## Reads are chain-truth

The panel never reports application state:

- The **enforced expiry** comes from `getKeys()` on the agent's own account.
- **Public verifiability** comes from `isValidKey(user, keyId)` on the Altana
  KeyStore — the same check a third-party verifier runs.

`state` distinguishes these. `ACTIVE` means both hold. `ACTIVE_UNREGISTERED`
means the account enforces the session but KeyStore has no entry, so an outside
verifier cannot see it. `EXPIRED` and `NOT_GRANTED` mean there is nothing to
revoke.

When the keys are unset, every route answers `503 UNAVAILABLE` with the reason.
Nothing here fabricates a session, consistent with `DATA_METHODOLOGY.md`.

## Two facts to verify on-chain before trusting this

Both were found while wiring the SDK and could not be checked from the build
environment, whose egress proxy blocks BSC RPC.

**1. The chain-97 policy address disagrees.**

| Source | OptimisticPolicy on chain 97 |
| --- | --- |
| `lib/erc8183.ts` (`ERC8183_TESTNET.policy`) | `0xd6a4217588f6b1f5657a92a3e94e6422ad771cea` |
| `@altananetwork/sdk` `ERC8183_ADDRESSES[97]` | `0x4F4678D4439feC812Ac7674Bb3Efb4C8f5Fb78A6` |

Commerce, router and payment token agree; only the policy differs. Chain 56
agrees on all five. The existing `GET /api/hire/testnet-readiness` check already
resolves this empirically — its `Policy allowlist` row calls
`policyWhitelist(policy)` on the router — so run it against a reachable RPC and
keep whichever address the router whitelists. The Altana hire path uses the
SDK's address; the hand-rolled five-transaction console uses the repository's.
They must be reconciled before both paths are demonstrated together.

**2. The one-screen claim is stale.**

`README.md` and `PROGRESS.md` describe Dashboard, Store, Leaderboard and Active
Agents in a single scrollable workspace, and mark that stage complete. The
current landing (`app/slash-home.tsx`) is a two-view landing/store surface that
links out to `/dashboard` for the leaderboard, and has no Active Agents surface.
The observatory redesign appears to have replaced that stage's output. The
requirement is not met as written today.

## Operator runbook

Nothing below has been executed. Each step needs a funded chain-97 key.

`scripts/altana-setup.mjs` covers steps 1 and 2 and answers "am I ready yet?"
without guessing:

~~~bash
node scripts/altana-setup.mjs keys    # generate the two keys, print the address to fund
node scripts/altana-setup.mjs check   # tBNB, test $U and KeyStore state, and what is still missing
~~~

`keys` prints the keys once and writes nothing to disk; paste them into
`.env.local` yourself. `check` reads them back, tries each public RPC in turn
and names the one that answered.

1. Generate two fresh Testnet-only keys and set `GRABIT_ALTANA_ADMIN_PRIVATE_KEY`
   and `GRABIT_ALTANA_SESSION_PRIVATE_KEY`.
2. Fund the agent wallet address with tBNB from
   <https://testnet.bnbchain.org/faucet-smart>. The grant pays a KeyStore
   registration fee, so it needs gas. The address is the admin key's own
   address; `check` and `GET /api/altana/session` both print it.
3. Press `GRANT SESSION`. It confirms on-chain and can take up to a minute; the
   SDK waits for the key to become visible before returning.
4. Confirm the panel reads `ACTIVE` and that the KeyStore link resolves. Record
   the grant transaction hash — this is the first Altana-explorer evidence.
5. Fund the agent wallet with test $U — at least 0.10 for a single canary,
   and about 2.00 to run the four Advantage Report tasks with retries. Then
   `POST /api/altana/hire {"registry":"304493","mode":"canary","dryRun":true}`
   to confirm the plan without spending, and drop `dryRun` to fund the job
   through the session key. Record the transaction hash and Job ID.

   Two things are called hire, and only one is available today:

   - `mode: "canary"` pays Grabit's own chain-97 reference provider. It is how
     a category task gets run at all, which is what earns rung 4, so gating it
     on rung 4 would be circular. Always available.
   - `mode: "marketplace"` pays the external agent named in the registry. It is
     blocked below rung 4 and answers `409` naming the rung — exactly what the
     detail screen says. Before these were split the screen said blocked while
     the route hired anyway.

   The canary is the transaction the prize gate asks for: it is signed by the
   session key, not by the admin key.
6. Press `REVOKE SESSION` and confirm the panel flips to `NOT_GRANTED` and that
   KeyStore stops reporting the key. Record that transaction hash too.

Steps 4, 5 and 6 produce the three receipts the submission needs: a scoped grant,
a session-signed job, and a user-triggered revoke.

## A failure worth recording

The first real run reverted on revoke with `KeyStore: key already registered`.

The cause is a stale-read race, not application state. The SDK decides whether
to prepend the admin key's KeyStore registration by reading `getKeys` and
checking it is empty, and BSC's public endpoints serve stale reads for roughly
twelve seconds after a transaction confirms — the SDK documents this itself in
`grantSession`. A revoke issued straight after a grant therefore sees an empty
list, prepends the registration a second time, and the whole atomic bundle
reverts.

`waitForKeyStoreVisibility` now lets the public read catch up before the SDK
makes that decision, and only when the account is already delegated, so a
genuine first action is not delayed.

A separate bug was found and fixed alongside it: `ensureAltanaAgentWallet` was
calling `createWallet` on every write, and `registerAccount` authorizes the
admin key each time. It now checks for EIP-7702 delegated code first. That was
real, but it was not the cause of the revert above.

## Not done

- No session has been granted; no transaction hash exists yet.
- The mainnet (chain 56) path is configured but deliberately unexercised.
- The Altana hire route does not yet feed the Active Agents surface.
- Revocation is monotonic in KeyStore v1.0.0: a revoked key cannot be
  re-activated, so a re-grant after revoke needs a new session key.

References: [Altana docs](https://docs.altana.network),
[@altananetwork/sdk](https://www.npmjs.com/package/@altananetwork/sdk),
[EIP-8183](https://eips.ethereum.org/EIPS/eip-8183).
