# Grabit delivery progress

Last updated: **2026-08-31 13:05 UTC**

## Overall: 3 / 6 complete

| Step | Scope | Status | Evidence |
| --- | --- | --- | --- |
| 1 | Requirements, scope and data rules | COMPLETE | Requirements matrix, scope freeze, data methodology |
| 2 | Four-category live Agent discovery and preflight | COMPLETE | Four chain-56 identities, reachable A2A, four accepted negotiations |
| 3 | Replace mock UI with evidence-backed data | COMPLETE | Shared source model, evidence board, verification dashboard, locked execution gate |
| 4 | Real ERC-8183 Hire and result | IN PROGRESS · 2 / 5 | Mainnet contracts and live quote verified; guarded five-signature console built; no funded Grabit Job |
| 5 | One-screen Store, Leaderboard and Active Agents | 3 / 4 | Leaderboard and Active Agents restored into the store workspace with AGENTS / LEADERBOARD / ACTIVE anchors. Readiness still sits behind the landing hero |
| 6 | QA, public deployment and submission | PENDING | Anonymous access and release tests not recorded |

Completion means the planned step produced its internal deliverable. It does not mean the submission is ready.

## Submission gate snapshot

| Gate | Result |
| --- | --- |
| Four required categories have a chain-56 identity | 4 / 4 |
| Four categories have a reachable service and accepted quote | 4 / 4 |
| Four category-specific reference strategy engines | 4 / 4 |
| Wallet-free strategy preview route and UI | 1 / 1 |
| Four categories have a delivered canary task | 0 / 4 |
| Completed ERC-8183 Job | 0 / 1 minimum |
| Mainnet execution contracts verified | 5 / 5 |
| Testnet deployment checks | 7 / 7 |
| Testnet wallet/network preflight | BUILT · USER CHECK PENDING |
| Testnet Agent provider | CODE + SECRET COMPLETE · GAS PENDING |
| Testnet Hire transactions | 0 / 5 |
| Live quote and call allowlist checks | 21 / 21 |
| Sequential wallet execution console | 1 / 1 |
| Evidence-backed production performance values | 0 / required set |
| Silent mock fallback removed | 1 / 1 |
| Altana session scope built (allowlist, cap, expiry) | 1 / 1 |
| Altana session registered in public KeyStore | CODE COMPLETE · UNEXECUTED |
| Altana session-signed onchain transaction | 0 / 1 minimum |
| In-product permission view and revoke control | 1 / 1 |
| Single-screen primary flow implemented | 3 / 4 — see Stage 5 |
| Anonymous production access recorded | 0 / 1 |
| Repeated release demo passed | 0 / 10 |

## Stage 3 completion: 5 / 5

1. Production evidence and verification model: COMPLETE.
2. Four selected identities mapped into one source-backed model: COMPLETE.
3. Unsupported APR, ROI, jobs and permission claims removed from the primary product: COMPLETE.
4. Explicit live, stale and unavailable states: COMPLETE.
5. Fake Hire removed; real Hire remains gated by live verification, wallet preflight and explicit signatures: COMPLETE.

## Stage 4 progress: 2 / 5

1. Verify the Mainnet kernel, implementation, router, policy, token and quote path: COMPLETE.
2. Build a sequential user-signed console with exact approval, simulation, resume and Job tracking: COMPLETE.
3. Fund one bounded 0.10 $U Grabit canary: PENDING — requires the user's wallet confirmations.
4. Receive and inspect the canary deliverable: PENDING.
5. Record completion, dispute or refund outcome: PENDING.

The known provider self-test Job `#56657` is `SUBMITTED`, but its client is the provider operator. It validates the external service path, not Grabit demand or completion.

## BSC Testnet path: 3 / 4

1. Verify chain 97, both proxy implementations, router policy allowlist, payment token and 15-minute dispute window: COMPLETE — 7 / 7 live checks.
2. Add explicit Testnet/Mainnet selection, wallet chain switching, tBNB/test-$U balances and faucet links: COMPLETE.
3. Connect a chain-97 reference Agent provider with a signed quote and delivery path: CODE + PRODUCTION SECRET COMPLETE — provider tBNB funding remains.
4. Execute and record Create → Policy → Budget → Approval → Fund → Submit → Settle on Testnet: PENDING — requires the user's wallet confirmations after the provider is funded.

The Testnet screen now builds its own signed chain-97 plan. It never rewrites the external Agent's chain-56 quote. Every client call is separately confirmed; provider submission and settlement are separate user-triggered actions.

## Stage 5 status: 3 / 4 — reopened and largely restored 2026-08-31

The observatory redesign (commits `95ade5b`..`8096b11`) had replaced the single
workspace this stage delivered. Restored on 2026-08-31 without reverting the
redesign, and verified in Chromium against a production build:

1. Dashboard readiness and next action visible in the first workspace: PARTIAL — Active Agents carries readiness and a next action, but it sits in the store view behind the landing hero rather than on first paint.
2. Four-category Agent Store embedded in the same screen: COMPLETE.
3. Evidence-only Leaderboard and Active Agents embedded below it: COMPLETE — both render inline; the gate summary, four-category table and provider-concentration warning moved in from /compare.
4. Primary navigation reduced to three anchor tabs: COMPLETE — AGENTS / LEADERBOARD / ACTIVE scroll within the workspace and no longer leave the page.

`/dashboard` and `/compare` still resolve for direct links.

The remaining item is a product decision rather than a bug: making the store the
first paint would satisfy it and would cost the hero the redesign introduced.

## Altana session gate: 4 / 5

The published prize gate requires live on-chain transactions through an Altana
session key. See `docs/ALTANA_SESSION.md`.

1. Agent holds its own Altana wallet: COMPLETE — smart account at the admin signer's address.
2. Session carries a call allowlist, spend cap and expiry: COMPLETE — eight ERC-8183 signatures, 0.10 $U per day, one-hour expiry.
3. Session registered in the public KeyStore: CODE COMPLETE — `register: true` on every grant; no grant has run.
4. User-facing permission view and revoke: COMPLETE — reads the enforced expiry from the account and verifiability from KeyStore.
5. A real transaction signed by the session key: PENDING — requires a tBNB-funded chain-97 agent wallet.

## Immediate next work

0. Fund the Altana agent wallet with tBNB, grant the session, and record the
   grant, session-signed hire and revoke transaction hashes. This is the only
   outstanding item on the prize gate.
1. Open Testnet mode and connect the intended client wallet.
2. Obtain tBNB and at least 0.10 test $U, then pass all five wallet checks.
3. Send faucet tBNB to the registered provider public address.
4. Verify its signed quote, exact selectors and delivery endpoint before enabling signatures.
5. Run the five Testnet Hire transactions one at a time, submit the result and settle after 15 minutes.
