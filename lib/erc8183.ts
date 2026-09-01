import advantageTasks from '@/docs/advantage/tasks.json';
import type { CandidateSnapshot } from '@/lib/marketplace-candidates';

export const ERC8183 = {
  chainId: 56,
  chainHex: '0x38',
  chainName: 'BNB Smart Chain Mainnet',
  rpcUrls: [
    'https://bsc-dataseed.bnbchain.org',
    'https://bsc-dataseed-public.bnbchain.org',
  ],
  explorerUrl: 'https://bscscan.com',
  kernel: '0xEa4DAa3100A767e86FDed867729ae7446476EBA6',
  implementation: '0xd5f9b570c96b5d67702d508c0bfb8b3b09209787',
  router: '0x51895229E12F9876011789B04f8698af06cCD6DA',
  policy: '0x9C01845705b3078Aa2e8cfF7520a6376FD766dE5',
  paymentToken: '0xcE24439F2D9C6a2289F741120FE202248B666666',
  paymentTokenSymbol: '$U',
  provider: '0x73809F69916FcF7Ddc5BB1315fBdf96A569a5963',
  amountAtomic: '100000000000000000',
  amountDisplay: '0.10 $U',
  disputeWindowSeconds: 604_800,
  selectors: {
    createJob: '0x41528812',
    registerJob: '0x51d5456d',
    setBudget: '0xdd4ae9d4',
    approve: '0x095ea7b3',
    fund: '0xd2e13f50',
    jobCounter: '0x50355d76',
    paymentToken: '0x3013ce29',
    disputeWindow: '0x117f5f92',
    balanceOf: '0x70a08231',
  },
  eip1967ImplementationSlot: '0x360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc',
} as const;

// BSC Testnet APEX deployment. Execution stays locked until a chain-97
// provider endpoint is connected; this config powers live readiness checks.
export const ERC8183_TESTNET = {
  chainId: 97,
  chainHex: '0x61',
  chainName: 'BNB Smart Chain Testnet',
  nativeCurrencySymbol: 'tBNB',
  rpcUrls: [
    'https://bsc-testnet-dataseed.bnbchain.org',
    'https://data-seed-prebsc-1-s1.bnbchain.org:8545',
  ],
  explorerUrl: 'https://testnet.bscscan.com',
  kernel: '0xa206c0517B6371C6638CD9e4a42Cc9f02A33B0DE',
  implementation: '0x153783ddbdf5233c591965f04644b1df2d1a7815',
  router: '0xd7d36d66d2f1b608a0f943f722d27e3744f66f25',
  routerImplementation: '0x40c0254610D92F1Eb9c2D7D5d2114bC4c99d935e',
  policy: '0xd6a4217588f6b1f5657a92a3e94e6422ad771cea',
  /**
   * The Altana SDK ships a different OptimisticPolicy for chain 97 than the one
   * above, while agreeing on the kernel, router and payment token (and on all
   * five for chain 56). Only the router knows which is real, so both are
   * checked at runtime and the readiness route reports whichever it
   * whitelists. Reconcile `policy` to that answer before the hand-rolled and
   * Altana hire paths are demonstrated together. See docs/ALTANA_SESSION.md.
   */
  policyCandidates: [
    '0xd6a4217588f6b1f5657a92a3e94e6422ad771cea',
    '0x4F4678D4439feC812Ac7674Bb3Efb4C8f5Fb78A6',
  ],
  paymentToken: '0xc70B8741B8B07A6d61E54fd4B20f22Fa648E5565',
  paymentTokenSymbol: '$U test token',
  amountAtomic: '100000000000000000',
  amountDisplay: '0.10 test $U',
  disputeWindowSeconds: 900,
  selectors: {
    paymentToken: '0x3013ce29',
    disputeWindow: '0x117f5f92',
    jobCounter: '0x50355d76',
    balanceOf: '0x70a08231',
    policyWhitelist: '0x70be56b9',
  },
  eip1967ImplementationSlot: '0x360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc',
  faucets: {
    gas: 'https://testnet.bnbchain.org/faucet-smart',
    token: 'https://united-coin-u.github.io/u-faucet/',
  },
} as const;

/**
 * What one Job escrows, per chain. This is the amount the buyer moves into the
 * kernel — deliberately distinct from the session key's daily ceiling, which is
 * a limit on how many such jobs a leaked key could open before the account
 * stops honouring it. Passing the ceiling where this belongs would escrow the
 * whole day's allowance into a single job.
 */
export function jobBudgetAtomic(chainId: number): bigint {
  return BigInt(chainId === ERC8183.chainId ? ERC8183.amountAtomic : ERC8183_TESTNET.amountAtomic);
}

/** The same amount, for display. */
export function jobBudgetDisplay(chainId: number): string {
  return chainId === ERC8183.chainId ? ERC8183.amountDisplay : ERC8183_TESTNET.amountDisplay;
}

/**
 * The category task each Agent is asked to perform.
 *
 * Derived from `docs/advantage/tasks.json` rather than written here, because
 * the Agent Advantage Report times a human against the same wording. Keeping
 * one string means the comparison cannot quietly drift into two different
 * questions, which is the failure mode that would make the report worthless.
 */
export const CANARY_TASKS: Record<string, string> = Object.fromEntries(
  advantageTasks.tasks.map((task) => [task.id, task.prompt]),
);

export type ProviderCall = {
  step: number;
  what: string;
  to: string;
  data: string | null;
  data_template?: string;
  value?: string;
  note?: string;
  ready?: boolean;
};

export type ProviderHireResponse = {
  negotiated?: boolean;
  hireable?: boolean;
  endpoint?: string;
  provider?: string;
  provider_source?: string;
  quote?: {
    price_atomic?: string;
    price?: string;
    asset?: string;
    service?: string;
    estimated_completion_seconds?: number;
    quoted_at?: string | null;
    quote_expires_at?: string | null;
    negotiation_hash?: string | null;
    provider_sig?: string | null;
    evaluator_type?: string | null;
    dialect?: string;
  };
  escrow?: {
    standard?: string;
    chain_id?: number;
    kernel?: string;
    payment_token?: string;
    payment_token_symbol?: string;
    expires_at?: number;
    refundable?: string;
  };
  calls?: ProviderCall[];
  we_do_not_sign?: string;
  after_funding?: string;
  track?: string;
};

export type IntegrityCheck = {
  label: string;
  pass: boolean;
  observed: string;
};

export type SafeHirePlan = {
  observedAt: string;
  candidate: Pick<CandidateSnapshot, 'tokenId' | 'name' | 'category' | 'serviceId' | 'provider'>;
  task: string;
  provider: string;
  endpoint: string;
  quote: {
    display: string;
    amountAtomic: string;
    estimatedCompletionSeconds: number | null;
    signed: boolean;
    expiresAt: number;
  };
  escrow: {
    chainId: number;
    kernel: string;
    router: string;
    policy: string;
    paymentToken: string;
    disputeWindowSeconds: number;
    refundable: string;
  };
  calls: ProviderCall[];
  integrity: {
    passed: boolean;
    checks: IntegrityCheck[];
    warning: string;
  };
};

export function sameAddress(left: unknown, right: string) {
  return typeof left === 'string' && left.toLowerCase() === right.toLowerCase();
}

function selectorOf(call: ProviderCall | undefined) {
  return (call?.data || call?.data_template || '').slice(0, 10).toLowerCase();
}

function addressWord(address: string) {
  return address.slice(2).toLowerCase().padStart(64, '0');
}

function uintWord(value: string) {
  return BigInt(value).toString(16).padStart(64, '0');
}

function callWord(data: string | null | undefined, index: number) {
  const payload = String(data || '').toLowerCase();
  const start = 10 + index * 64;
  return payload.slice(start, start + 64);
}

function decodeCreateDescription(data: string | null | undefined) {
  try {
    const args = String(data || '').replace(/^0x[0-9a-fA-F]{8}/, '');
    const offset = Number(BigInt('0x' + args.slice(3 * 64, 4 * 64)));
    const lengthAt = offset * 2;
    const length = Number(BigInt('0x' + args.slice(lengthAt, lengthAt + 64)));
    if (!Number.isSafeInteger(length) || length < 1 || length > 2_048) return null;
    const hex = args.slice(lengthAt + 64, lengthAt + 64 + length * 2);
    const bytes = new Uint8Array(hex.match(/.{1,2}/g)?.map((pair) => Number.parseInt(pair, 16)) || []);
    return JSON.parse(new TextDecoder().decode(bytes)) as { task?: unknown; service?: unknown; via?: unknown };
  } catch {
    return null;
  }
}

export function validateProviderPlan(
  raw: ProviderHireResponse,
  candidate: CandidateSnapshot,
  nowSeconds = Math.floor(Date.now() / 1000),
  expectedTask?: string,
) {
  const quote = raw.quote || {};
  const escrow = raw.escrow || {};
  const calls = Array.isArray(raw.calls) ? raw.calls : [];
  const approvalData = ERC8183.selectors.approve
    + addressWord(ERC8183.kernel)
    + uintWord(ERC8183.amountAtomic);
  const registerTemplate = ERC8183.selectors.registerJob + '<JOBID>' + addressWord(ERC8183.policy);
  const budgetTemplate = ERC8183.selectors.setBudget + '<JOBID>' + uintWord(ERC8183.amountAtomic) + uintWord('96') + uintWord('0');
  const fundTemplate = ERC8183.selectors.fund + '<JOBID>' + uintWord(ERC8183.amountAtomic) + uintWord('96') + uintWord('0');
  const expiry = Number(escrow.expires_at || 0);
  const createDescription = decodeCreateDescription(calls[0]?.data);
  const createFieldsMatch = callWord(calls[0]?.data, 0) === addressWord(ERC8183.provider)
    && callWord(calls[0]?.data, 1) === addressWord(ERC8183.router)
    && callWord(calls[0]?.data, 2) === uintWord(String(expiry))
    && callWord(calls[0]?.data, 3) === uintWord('160')
    && callWord(calls[0]?.data, 4) === addressWord(ERC8183.router)
    && createDescription?.service === candidate.serviceId
    && (!expectedTask || createDescription?.task === expectedTask);

  const checks: IntegrityCheck[] = [
    { label: 'Negotiation accepted', pass: raw.negotiated === true && raw.hireable === true, observed: String(raw.negotiated === true && raw.hireable === true) },
    { label: 'Provider allowlist', pass: sameAddress(raw.provider, candidate.provider) && sameAddress(raw.provider, ERC8183.provider), observed: String(raw.provider || 'missing') },
    { label: 'Provider endpoint allowlist', pass: raw.endpoint === candidate.endpoint, observed: String(raw.endpoint || 'missing') },
    { label: 'Agent service match', pass: quote.service === candidate.serviceId, observed: String(quote.service || 'missing') },
    { label: 'Exact price', pass: quote.price_atomic === ERC8183.amountAtomic, observed: String(quote.price_atomic || 'missing') },
    { label: 'Payment asset', pass: sameAddress(quote.asset, ERC8183.paymentToken) && sameAddress(escrow.payment_token, ERC8183.paymentToken), observed: String(quote.asset || 'missing') },
    { label: 'Chain 56', pass: escrow.chain_id === ERC8183.chainId, observed: String(escrow.chain_id ?? 'missing') },
    { label: 'ERC-8183 kernel', pass: sameAddress(escrow.kernel, ERC8183.kernel), observed: String(escrow.kernel || 'missing') },
    { label: 'Five explicit calls', pass: calls.length === 5 && calls.every((call, index) => call.step === index + 1), observed: String(calls.length) },
    { label: 'Create call fields', pass: sameAddress(calls[0]?.to, ERC8183.kernel) && selectorOf(calls[0]) === ERC8183.selectors.createJob && createFieldsMatch, observed: selectorOf(calls[0]) || 'missing' },
    { label: 'Policy binding', pass: sameAddress(calls[1]?.to, ERC8183.router) && String(calls[1]?.data_template || '').toLowerCase() === registerTemplate.toLowerCase(), observed: selectorOf(calls[1]) || 'missing' },
    { label: 'Exact budget template', pass: sameAddress(calls[2]?.to, ERC8183.kernel) && String(calls[2]?.data_template || '').toLowerCase() === budgetTemplate.toLowerCase(), observed: selectorOf(calls[2]) || 'missing' },
    { label: 'Exact approval only', pass: sameAddress(calls[3]?.to, ERC8183.paymentToken) && String(calls[3]?.data || '').toLowerCase() === approvalData.toLowerCase(), observed: selectorOf(calls[3]) || 'missing' },
    { label: 'Exact fund template', pass: sameAddress(calls[4]?.to, ERC8183.kernel) && String(calls[4]?.data_template || '').toLowerCase() === fundTemplate.toLowerCase(), observed: selectorOf(calls[4]) || 'missing' },
    { label: 'Refund-safe expiry', pass: expiry >= nowSeconds + ERC8183.disputeWindowSeconds && expiry <= nowSeconds + 30 * 86_400, observed: expiry ? new Date(expiry * 1000).toISOString() : 'missing' },
    { label: 'Zero native value', pass: calls.every((call) => !call.value || call.value === '0x0'), observed: calls.map((call) => call.value || '0x0').join(', ') },
  ];

  return {
    checks,
    passed: checks.every((check) => check.pass),
    signed: Boolean(quote.negotiation_hash && quote.provider_sig),
  };
}

export function padJobId(jobId: string | number | bigint) {
  return BigInt(jobId).toString(16).padStart(64, '0');
}

export function bindJobId(template: string, jobId: string) {
  return template.replace('<JOBID>', padJobId(jobId));
}
