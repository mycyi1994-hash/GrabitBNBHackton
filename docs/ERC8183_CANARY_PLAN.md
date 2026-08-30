# ERC-8183 paid canary plan

Observed on BNB Smart Chain Mainnet on **2026-08-30 02:01 UTC**. This document records the pre-spend gate; it is not evidence that Grabit funded or completed a Job.

## Selected canary

| Field | Value |
| --- | --- |
| Category | Yield Optimisation |
| ERC-8004 identity | `304493` |
| Service | `yield_plan` |
| Provider | `0x73809F69916FcF7Ddc5BB1315fBdf96A569a5963` |
| Task | Rank current Venus supply yields for USDT, including net APY, gas break-even and source block; do not move funds |
| Quote | `0.10 $U` / `100000000000000000` atomic units |
| Estimated provider time | 120 seconds |
| Quote authentication | No provider signature or negotiation hash returned |

## Verified deployment

| Component | Address | Read-only observation |
| --- | --- | --- |
| AgenticCommerce kernel proxy | `0xEa4DAa3100A767e86FDed867729ae7446476EBA6` | code present; `paymentToken()` matches $U |
| Kernel implementation | `0xd5f9b570c96b5d67702d508c0bfb8b3b09209787` | code present |
| Evaluator router | `0x51895229E12F9876011789B04f8698af06cCD6DA` | code present |
| Optimistic policy | `0x9C01845705b3078Aa2e8cfF7520a6376FD766dE5` | code present; `disputeWindow()` = 604,800 seconds |
| United Stables token | `0xcE24439F2D9C6a2289F741120FE202248B666666` | code present; symbol `$U`; 18 decimals |

The implementation validates the live plan against these exact values on every quote request. A mismatched address, price, service, selector, chain or contract read returns an error and exposes no wallet execution plan.

## Five transactions

| Step | Contract | Selector | Effect |
| --- | --- | --- | --- |
| 1 | Kernel | `0x41528812` | Create Job; BNB gas only |
| 2 | Router | `0x51d5456d` | Bind the verified optimistic policy; BNB gas only |
| 3 | Kernel | `0xdd4ae9d4` | Set the 0.10 $U budget; BNB gas only |
| 4 | $U token | `0x095ea7b3` | Approve exactly 0.10 $U; BNB gas only |
| 5 | Kernel | `0xd2e13f50` | Move exactly 0.10 $U into escrow; BNB gas plus 0.10 $U |

There is no batch call. The UI simulates and submits only the currently active step after a user click, waits for confirmation, then reveals the next step. After Create, it scans recent Job IDs and verifies both the connected client and expected provider before using an ID.

## Stop conditions

- Wrong chain, missing contract code or kernel token mismatch.
- Live quote does not match the selected identity and service.
- Amount is not exactly 0.10 $U or approval is not exact.
- Wallet has less than 0.10 $U or the conservative BNB gas guard.
- Any `eth_estimateGas` call fails.
- Create is confirmed but its Job ID cannot be verified.
- The user cancels any wallet request.

No later step runs automatically after a stop.

## Delivery and outcome evidence

After funding, Grabit sends the provider an A2A `notify_funded` message and tracks `/job?id=<jobId>`. `SUBMITTED` means a deliverable was written but the escrow has not released; `COMPLETED` is required for a completed lifecycle. If nothing is delivered before expiry, the expected path is `claimRefund(jobId)`.

The provider's known Job `#56657` was observed as `SUBMITTED` with a 0.10 $U budget. Its client belongs to the provider's own test operator, so it is not counted as a Grabit canary or completed marketplace evidence.

References: [EIP-8183](https://eips.ethereum.org/EIPS/eip-8183), [BNB Chain JSON-RPC endpoints](https://docs.bnbchain.org/bnb-smart-chain/developers/json_rpc/json-rpc-endpoint/), [BNB Agent SDK](https://github.com/bnb-chain/bnb-agent-sdk), [Brain on BNB agent card](https://agent.brainonbnb.com/.well-known/agent-card.json).
