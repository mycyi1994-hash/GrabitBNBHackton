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

## 2. Session-signed hires

Pending.

## 3. Session revoke

Pending.
