import {
  createPublicClient,
  createWalletClient,
  encodeFunctionData,
  formatGwei,
  http,
  keccak256,
  stringToHex,
  toBytes,
  type Address,
  type Hex,
} from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { bscTestnet } from 'viem/chains';
import type { CandidateSnapshot } from '@/lib/marketplace-candidates';
import { ERC8183_TESTNET } from '@/lib/erc8183';

const CONFIG = ERC8183_TESTNET;

export const testnetKernelAbi = [
  {
    type: 'function',
    name: 'createJob',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'provider', type: 'address' },
      { name: 'evaluator', type: 'address' },
      { name: 'expiredAt', type: 'uint256' },
      { name: 'description', type: 'string' },
      { name: 'hook', type: 'address' },
    ],
    outputs: [{ name: 'jobId', type: 'uint256' }],
  },
  {
    type: 'function',
    name: 'submit',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'jobId', type: 'uint256' },
      { name: 'deliverable', type: 'bytes32' },
      { name: 'optParams', type: 'bytes' },
    ],
    outputs: [],
  },
  {
    type: 'function',
    name: 'getJob',
    stateMutability: 'view',
    inputs: [{ name: 'jobId', type: 'uint256' }],
    outputs: [{
      name: '',
      type: 'tuple',
      components: [
        { name: 'id', type: 'uint256' },
        { name: 'client', type: 'address' },
        { name: 'provider', type: 'address' },
        { name: 'evaluator', type: 'address' },
        { name: 'description', type: 'string' },
        { name: 'budget', type: 'uint256' },
        { name: 'expiredAt', type: 'uint256' },
        { name: 'status', type: 'uint8' },
        { name: 'hook', type: 'address' },
        { name: 'submittedAt', type: 'uint256' },
        { name: 'deliverable', type: 'bytes32' },
      ],
    }],
  },
  {
    type: 'function',
    name: 'paymentToken',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'address' }],
  },
  {
    type: 'function',
    name: 'jobCounter',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'uint256' }],
  },
] as const;

export const testnetRouterAbi = [
  {
    type: 'function',
    name: 'policyWhitelist',
    stateMutability: 'view',
    inputs: [{ name: 'policy', type: 'address' }],
    outputs: [{ name: '', type: 'bool' }],
  },
  {
    type: 'function',
    name: 'jobPolicy',
    stateMutability: 'view',
    inputs: [{ name: 'jobId', type: 'uint256' }],
    outputs: [{ name: '', type: 'address' }],
  },
  {
    type: 'function',
    name: 'settle',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'jobId', type: 'uint256' },
      { name: 'evidence', type: 'bytes' },
    ],
    outputs: [],
  },
] as const;

export const testnetJobInitialisedEvent = {
  type: 'event',
  name: 'JobInitialised',
  inputs: [
    { name: 'jobId', type: 'uint256', indexed: true },
    { name: 'deliverable', type: 'bytes32', indexed: false },
    { name: 'submittedAt', type: 'uint64', indexed: false },
    { name: 'optParams', type: 'bytes', indexed: false },
  ],
} as const;

export type TestnetJob = {
  id: bigint;
  client: Address;
  provider: Address;
  evaluator: Address;
  description: string;
  budget: bigint;
  expiredAt: bigint;
  status: number;
  hook: Address;
  submittedAt: bigint;
  deliverable: Hex;
};

export const TESTNET_JOB_STATUS = ['OPEN', 'FUNDED', 'SUBMITTED', 'COMPLETED', 'REJECTED', 'EXPIRED'] as const;

export function getTestnetPublicClient() {
  return createPublicClient({
    chain: bscTestnet,
    transport: http(CONFIG.rpcUrls[0], { timeout: 12_000, retryCount: 1 }),
  });
}

function providerPrivateKey() {
  const value = process.env.GRABIT_TESTNET_PROVIDER_PRIVATE_KEY;
  if (!value || !/^0x[0-9a-fA-F]{64}$/.test(value)) {
    throw new Error('The Testnet reference provider key is not configured.');
  }
  return value as Hex;
}

export function getTestnetProviderAccount() {
  return privateKeyToAccount(providerPrivateKey());
}

export function getTestnetWalletClient() {
  const account = getTestnetProviderAccount();
  return createWalletClient({
    account,
    chain: bscTestnet,
    transport: http(CONFIG.rpcUrls[0], { timeout: 12_000, retryCount: 1 }),
  });
}

export async function readTestnetJob(jobId: bigint) {
  return getTestnetPublicClient().readContract({
    address: CONFIG.kernel as Address,
    abi: testnetKernelAbi,
    functionName: 'getJob',
    args: [jobId],
  }) as Promise<TestnetJob>;
}

function addressWord(address: string) {
  return address.replace(/^0x/, '').toLowerCase().padStart(64, '0');
}

function uintWord(value: string | number | bigint) {
  return BigInt(value).toString(16).padStart(64, '0');
}

export async function buildTestnetProviderPlan(candidate: CandidateSnapshot, task: string) {
  const account = getTestnetProviderAccount();
  const now = Math.floor(Date.now() / 1000);
  const expiresAt = now + 2 * 60 * 60;
  const quoteTerms = {
    version: 1,
    chainId: CONFIG.chainId,
    provider: account.address,
    registry: candidate.tokenId,
    service: candidate.serviceId,
    task,
    amountAtomic: CONFIG.amountAtomic,
    expiresAt,
  };
  const negotiationHash = keccak256(toBytes(JSON.stringify(quoteTerms)));
  const providerSignature = await account.signMessage({ message: { raw: negotiationHash } });
  const description = JSON.stringify({
    task,
    service: candidate.serviceId,
    registry: candidate.tokenId,
    via: 'grabit-testnet-reference-provider',
    quote: negotiationHash,
  });
  const createData = encodeFunctionData({
    abi: testnetKernelAbi,
    functionName: 'createJob',
    args: [
      account.address,
      CONFIG.router as Address,
      BigInt(expiresAt),
      description,
      CONFIG.router as Address,
    ],
  });
  const approvalData = '0x095ea7b3' + addressWord(CONFIG.kernel) + uintWord(CONFIG.amountAtomic);
  const registerTemplate = '0x51d5456d<JOBID>' + addressWord(CONFIG.policy);
  const budgetTemplate = '0xdd4ae9d4<JOBID>' + uintWord(CONFIG.amountAtomic) + uintWord(96) + uintWord(0);
  const fundTemplate = '0xd2e13f50<JOBID>' + uintWord(CONFIG.amountAtomic) + uintWord(96) + uintWord(0);

  return {
    observedAt: new Date().toISOString(),
    candidate: {
      tokenId: candidate.tokenId,
      name: candidate.name,
      category: candidate.category,
      serviceId: candidate.serviceId,
      provider: account.address,
    },
    task,
    provider: account.address,
    endpoint: '/api/hire/testnet-provider',
    quote: {
      display: CONFIG.amountDisplay,
      amountAtomic: CONFIG.amountAtomic,
      estimatedCompletionSeconds: 45,
      signed: true,
      negotiationHash,
      providerSignature,
      expiresAt,
    },
    escrow: {
      chainId: CONFIG.chainId,
      kernel: CONFIG.kernel,
      router: CONFIG.router,
      policy: CONFIG.policy,
      paymentToken: CONFIG.paymentToken,
      disputeWindowSeconds: CONFIG.disputeWindowSeconds,
      refundable: 'If the provider does not submit before expiry, claimRefund(jobId) returns the test escrow.',
    },
    calls: [
      { step: 1, what: 'Create the Testnet job', to: CONFIG.kernel, data: createData, value: '0x0', note: 'Creates one chain-97 Job for the signed reference-provider quote.' },
      { step: 2, what: 'Bind the Testnet policy', to: CONFIG.router, data: null, data_template: registerTemplate, value: '0x0', note: 'Binds the router-whitelisted 15-minute optimistic policy.' },
      { step: 3, what: 'Set the test budget', to: CONFIG.kernel, data: null, data_template: budgetTemplate, value: '0x0', note: 'Sets exactly 0.10 test $U.' },
      { step: 4, what: 'Approve exact test $U', to: CONFIG.paymentToken, data: approvalData, value: '0x0', note: 'Approves only the exact test amount to the Testnet kernel.' },
      { step: 5, what: 'Fund the test escrow', to: CONFIG.kernel, data: null, data_template: fundTemplate, value: '0x0', note: 'Moves exactly 0.10 test $U into the Testnet escrow.' },
    ],
  };
}

export function parseReferenceDescription(description: string) {
  try {
    const parsed = JSON.parse(description) as Record<string, unknown>;
    if (
      parsed.via !== 'grabit-testnet-reference-provider'
      || typeof parsed.task !== 'string'
      || typeof parsed.service !== 'string'
      || typeof parsed.registry !== 'string'
      || typeof parsed.quote !== 'string'
    ) return null;
    return {
      task: parsed.task,
      service: parsed.service,
      registry: parsed.registry,
      quote: parsed.quote,
    };
  } catch {
    return null;
  }
}

export async function buildReferenceDeliverable(jobId: bigint, job: TestnetJob) {
  const publicClient = getTestnetPublicClient();
  const [blockNumber, gasPrice] = await Promise.all([
    publicClient.getBlockNumber(),
    publicClient.getGasPrice(),
  ]);
  const description = parseReferenceDescription(job.description);
  if (!description) throw new Error('Job description is not a Grabit Testnet reference task.');
  const result = {
    version: 1,
    kind: 'grabit-testnet-canary-result',
    jobId: jobId.toString(),
    registry: description.registry,
    service: description.service,
    task: description.task,
    network: 'BSC Testnet',
    chainId: CONFIG.chainId,
    sourceBlock: blockNumber.toString(),
    gasPriceGwei: formatGwei(gasPrice),
    capitalMovedByAgent: false,
    finding: 'The reference Agent verified the live chain, measured gas and returned a read-only execution canary. No DeFi position was moved.',
    observedAt: new Date().toISOString(),
  };
  const resultJson = JSON.stringify(result);
  return {
    result,
    resultJson,
    deliverable: keccak256(toBytes(resultJson)),
    optParams: stringToHex(resultJson),
  };
}
