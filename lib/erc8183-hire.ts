/**
 * The ERC-8183 buyer lifecycle, built here rather than taken from the SDK.
 *
 * `hireErc8183Agent` is the obvious way to do this and it cannot be used on
 * chain 97. It hardcodes the OptimisticPolicy address from the SDK's own
 * deployment table, and on BNB Smart Chain Testnet the router does not
 * whitelist that address — it whitelists the one in `lib/erc8183.ts`. Every
 * hire through the SDK therefore reverts at `registerJob` with
 * `PolicyNotWhitelisted()` (selector `0xc94463e3`), before a single $U moves.
 *
 * `/api/hire/testnet-readiness` reports the disagreement under
 * `policyResolution`; this module acts on it. Only the policy differs. The
 * kernel, router and payment token agree between the SDK and our config, and
 * the readiness route verifies all three against the chain, so those come from
 * the SDK as before.
 *
 * The batch is identical to the SDK's in shape and order — createJob,
 * registerJob, setBudget, approve, fund, as one atomic intent — so the session
 * key's on-chain allowlist covers it unchanged. The policy address is an
 * argument to `registerJob`, never a call target, so naming a different one
 * needs no new permission and no re-grant.
 *
 * Once the SDK's chain-97 table is corrected this module can go, and the
 * router check it does will say so: `resolveWhitelistedPolicy` asks the router
 * rather than trusting either table, so it keeps working either way.
 */
import { erc8183Addresses, type ExecuteResult, type NetworkConfig, type Session } from '@altananetwork/sdk';
import { createPublicClient, encodeFunctionData, http, type Address, type Hex } from 'viem';
import { altanaClient } from '@/lib/altana';
import { ERC8183_TESTNET } from '@/lib/erc8183';

const COMMERCE_ABI = [
  {
    name: 'createJob',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'provider', type: 'address' },
      { name: 'evaluator', type: 'address' },
      { name: 'expiredAt', type: 'uint256' },
      { name: 'description', type: 'string' },
      { name: 'hook', type: 'address' },
    ],
    outputs: [{ type: 'uint256' }],
  },
  {
    name: 'setBudget',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'jobId', type: 'uint256' },
      { name: 'amount', type: 'uint256' },
      { name: 'optParams', type: 'bytes' },
    ],
    outputs: [],
  },
  {
    name: 'fund',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'jobId', type: 'uint256' },
      { name: 'expectedBudget', type: 'uint256' },
      { name: 'optParams', type: 'bytes' },
    ],
    outputs: [],
  },
  { name: 'jobCounter', type: 'function', stateMutability: 'view', inputs: [], outputs: [{ type: 'uint256' }] },
] as const;

const ROUTER_ABI = [
  {
    name: 'registerJob',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'jobId', type: 'uint256' },
      { name: 'policy', type: 'address' },
    ],
    outputs: [],
  },
  {
    name: 'policyWhitelist',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'policy', type: 'address' }],
    outputs: [{ type: 'bool' }],
  },
] as const;

const POLICY_ABI = [
  { name: 'disputeWindow', type: 'function', stateMutability: 'view', inputs: [], outputs: [{ type: 'uint64' }] },
] as const;

const ERC20_ABI = [
  {
    name: 'approve',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'spender', type: 'address' },
      { name: 'amount', type: 'uint256' },
    ],
    outputs: [{ type: 'bool' }],
  },
] as const;

/** Kernel's 4096-byte limit on a Job description. */
const MAX_DESCRIPTION_BYTES = 4096;

function publicClientFor(network: NetworkConfig) {
  return createPublicClient({ chain: network.chain, transport: http(network.publicRpcUrl, { timeout: 12_000, retryCount: 1 }) });
}

/**
 * The policy the router actually whitelists, asked of the router rather than
 * assumed. Falls back to the configured address when no candidate answers, so
 * an RPC failure surfaces as the original revert rather than as a silent
 * substitution.
 */
export async function resolveWhitelistedPolicy(network: NetworkConfig): Promise<Address> {
  const configured = erc8183Addresses(network.chainId).policy;
  const candidates: Address[] = [
    ...(network.chainId === ERC8183_TESTNET.chainId
      ? (ERC8183_TESTNET.policyCandidates as readonly string[]).map((a) => a as Address)
      : []),
    configured,
  ];
  const seen = new Set<string>();
  const client = publicClientFor(network);

  for (const candidate of candidates) {
    const key = candidate.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    const whitelisted = await client
      .readContract({
        address: erc8183Addresses(network.chainId).router,
        abi: ROUTER_ABI,
        functionName: 'policyWhitelist',
        args: [candidate],
      })
      .catch(() => false);
    if (whitelisted) return candidate;
  }
  return configured;
}

export type VerifiedHireResult = ExecuteResult & {
  jobId: bigint;
  provider: Address;
  budget: bigint;
  expiredAt: bigint;
  policy: Address;
};

/**
 * One atomic buyer lifecycle, signed by the session key.
 *
 * The jobId is predicted from `jobCounter() + 1`, exactly as the SDK does. If
 * another job is created in the same block the whole batch reverts rather than
 * funding someone else's job, which is the safe direction.
 */
export async function hireWithVerifiedPolicy(
  session: Session,
  params: { provider: Address; task: string; budget: bigint; deadlineSeconds?: number },
  opts: { network: NetworkConfig },
): Promise<VerifiedHireResult> {
  if (new TextEncoder().encode(params.task).length > MAX_DESCRIPTION_BYTES) {
    throw new Error(`The task description exceeds the kernel's ${MAX_DESCRIPTION_BYTES}-byte limit.`);
  }

  const { network } = opts;
  const addresses = erc8183Addresses(network.chainId);
  const client = publicClientFor(network);
  const policy = await resolveWhitelistedPolicy(network);

  const [disputeWindow, jobCounter] = await Promise.all([
    client.readContract({ address: policy, abi: POLICY_ABI, functionName: 'disputeWindow' }),
    client.readContract({ address: addresses.commerce, abi: COMMERCE_ABI, functionName: 'jobCounter' }),
  ]);

  const jobId = jobCounter + BigInt(1);
  const expiredAt =
    BigInt(Math.floor(Date.now() / 1000)) + BigInt(disputeWindow) + BigInt(params.deadlineSeconds ?? 1800);

  const calls: { to: Address; data: Hex }[] = [
    {
      to: addresses.commerce,
      data: encodeFunctionData({
        abi: COMMERCE_ABI,
        functionName: 'createJob',
        args: [params.provider, addresses.router, expiredAt, params.task, addresses.router],
      }),
    },
    {
      to: addresses.router,
      data: encodeFunctionData({ abi: ROUTER_ABI, functionName: 'registerJob', args: [jobId, policy] }),
    },
    {
      to: addresses.commerce,
      data: encodeFunctionData({ abi: COMMERCE_ABI, functionName: 'setBudget', args: [jobId, params.budget, '0x'] }),
    },
    {
      to: addresses.paymentToken,
      data: encodeFunctionData({ abi: ERC20_ABI, functionName: 'approve', args: [addresses.commerce, params.budget] }),
    },
    {
      to: addresses.commerce,
      data: encodeFunctionData({ abi: COMMERCE_ABI, functionName: 'fund', args: [jobId, params.budget, '0x'] }),
    },
  ];

  const result = await altanaClient(network.chainId).execute({ session, calls, chainId: network.chainId });
  return { ...result, jobId, provider: params.provider, budget: params.budget, expiredAt, policy };
}
