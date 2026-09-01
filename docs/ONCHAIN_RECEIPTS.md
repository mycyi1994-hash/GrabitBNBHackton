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

## 3. Session revoke

Pending.
