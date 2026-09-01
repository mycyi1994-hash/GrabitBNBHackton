# On-chain receipts

Every transaction Grabit has actually executed, with the explorer link. Nothing
is listed here that has not confirmed.

Network: **BNB Smart Chain Testnet (chain 97)**.
Agent wallet: [`0x28F8C3E66F6a18D97d4a0d02ceB655380eb76cc8`](https://testnet.bscscan.com/address/0x28F8C3E66F6a18D97d4a0d02ceB655380eb76cc8)
Session key: `0x488775cf516186a6E1DcFAFF2703d3E24Bd20900`
KeyStore: [`0x6b8361C29d05D498b1a12B54A37310f94171E94A`](https://testnet.bscscan.com/address/0x6b8361C29d05D498b1a12B54A37310f94171E94A)

## 1. Session grant

| | |
| --- | --- |
| Transaction | [`0xca69cde230b23463af6737ec453924df04e07bd6d5e73f0a1688f612e069b7a3`](https://testnet.bscscan.com/tx/0xca69cde230b23463af6737ec453924df04e07bd6d5e73f0a1688f612e069b7a3) |
| Status | Success |
| Block | 128,413,964 |
| Timestamp | 2026-09-01 03:19:46 UTC |
| Expiry | 2026-09-01 04:19:46 UTC (60 minutes, enforced by the account) |
| Gas paid by the agent wallet | 0.0000399743 BNB |
| Logs | 12 |

This is the grant that gives the session key its bounded authority: the eight
ERC-8183 lifecycle signatures against their own contracts, a 1.00 $U per-day
spend ceiling on the payment token only, and an expiry the account enforces
whether or not anyone revokes.

The key was already carried by KeyStore from an earlier grant, so this one
re-authorised it rather than publishing it a second time — registration in
KeyStore is permanent, validity is not. See `docs/ALTANA_SESSION.md`.

## 2. Session revoke

| | |
| --- | --- |
| Transaction | [`0xa4869432164f8b7dbb6f23321b5b161f9011d12e18759beff0b8d884d7454c25`](https://testnet.bscscan.com/tx/0xa4869432164f8b7dbb6f23321b5b161f9011d12e18759beff0b8d884d7454c25) |
| Status | Success |
| Block | 128,415,050 |
| Timestamp | 2026-09-01 03:27:55 UTC |
| Fee | 0.0000096811 BNB |
| Logs | 2 |

Revoking is an ordinary action, not a failure state, and it takes effect on the
next block. This one ended the session granted above so it could be re-granted
with a permission it was missing.

## 3. Session re-grant, with the fee allowance

| | |
| --- | --- |
| Transaction | [`0xdd7a189e00aa0d8260fa5dcd9e2cd0a75b18756951af8c5e8e8473a3cd358efa`](https://testnet.bscscan.com/tx/0xdd7a189e00aa0d8260fa5dcd9e2cd0a75b18756951af8c5e8e8473a3cd358efa) |
| Status | Success |
| Block | 128,415,080 |
| Timestamp | 2026-09-01 03:28:08 UTC |
| Expiry | 2026-09-01 04:28:08 UTC |
| Paid by the agent wallet | 0.0001813312 BNB |
| Fee | 0.0000805189 BNB |
| Logs | **13** |

Thirteen logs against the first grant's twelve. The extra one is the native-token
spend allowance the session was missing, which is why the first hire attempt was
rejected with `NoSpendPermissions` before it reached any ERC-8183 call. The
count is the on-chain evidence that the permission was actually written rather
than merely passed to the SDK.

## 4. Session-signed hires

The ERC-8183 buyer lifecycle — createJob, registerJob, setBudget, approve, fund
— as one atomic intent signed by the scoped session key. Not by the admin key,
and not by a browser wallet.

| Job | Agent | Transaction | Escrowed | Wall clock |
| --- | --- | --- | --- | --- |
| 846 | Grid Trading (#302258) | [`0x54a7b52e…4b9385`](https://testnet.bscscan.com/tx/0x54a7b52eb4fdbc3dda806fbfeeb59db4506d634689865e5cc185ce12864b9385) | 0.10 test $U | **11 s** |
| 847 | Rebalancing (#304494) | [`0x764cf03d…92b2b5`](https://testnet.bscscan.com/tx/0x764cf03ddba497ba0fa6baf7931666767e72bb07890cebdeead46f098892b2b5) | 0.10 test $U | **5 s** |
| 848 | Yield Optimisation (#304493) | [`0x8e3194ba…4f21a3`](https://testnet.bscscan.com/tx/0x8e3194ba324edb7e73f27b069072d09ebb58c250e4696809338a2ac61b4f21a3) | 0.10 test $U | **5 s** |

Three categories, 0.30 test $U escrowed in total, well inside the session's
1.00 $U daily ceiling. The first took eleven seconds and the next two five
each — the difference is the SDK's client warming up, not the chain.

Bound to policy `0xd6a4217588f6b1f5657a92a3e94e6422ad771cea`, which is the one
the router whitelists — the SDK's hire helper binds a different address and
reverts. See `lib/erc8183-hire.ts`.

### Delivered

Re-hired with the signed-quote envelope, then delivered. Two transactions each:
the session key funds the Job, the provider submits the result with its own gas.

| Job | Agent | Hire | Delivery | Hire + deliver |
| --- | --- | --- | --- | --- |
| 850 | Grid Trading (#302258) | [`0x67aa71c4…8e2ea8`](https://testnet.bscscan.com/tx/0x67aa71c48b2e7ca00c8b74917cb1f958ce1574a1a56c3a720dd40fd8f68e2ea8) | [`0xe80708fe…8731e0`](https://testnet.bscscan.com/tx/0xe80708fea14bfb5db41428d0a262107695f560563767ec0b6d3e0d65858731e0) | **8 s** |
| 851 | Rebalancing (#304494) | [`0x74bf586e…bcd2e9`](https://testnet.bscscan.com/tx/0x74bf586e63280f88d3be548020bd78a273683e773e2916a0823ca581e9bcd2e9) | [`0xb2e5c921…2db08d`](https://testnet.bscscan.com/tx/0xb2e5c92139aafd8911a330aabf9ef736ec016b0015966113e8a3b37ff02db08d) | **6 s** |
| 852 | Yield Optimisation (#304493) | [`0x81afca36…3cf5de`](https://testnet.bscscan.com/tx/0x81afca369c4c5cf66373c91b80b0823639b667fb2e23bf756ee0bb6e013cf5de) | [`0xca19d2fc…5b685b`](https://testnet.bscscan.com/tx/0xca19d2fcfabf39538d3092eb897223e201ab1f5b8399d822651caec49f5b685b) | **6 s** |

Job 849 was an earlier run of the grid task, superseded by 850.

The full ERC-8183 lifecycle is exercised here: a Job created, a policy bound, a
budget set, an exact approval, an escrow funded, and a result submitted against
it. Nothing was simulated and no step was skipped.

### Undeliverable

**Jobs 846, 847 and 848 cannot be delivered against.** Their descriptions carry the bare
task string, and the reference provider only accepts a Job whose description is
its signed-quote envelope, so its allowlist rejects all three with 409. The
escrow is not lost — `claimRefund(jobId)` returns it after `expiredAt` — but
0.30 test $U sits until then. They are kept here rather than removed: the
session-signed hire itself worked, and it is the funding path these transactions
prove. The fix is in the commit that follows them, and the delivered jobs are
below.

## 3. Session revoke

Pending.
