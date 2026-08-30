import { getCandidateByTokenId } from '@/lib/marketplace-data';
import {
  CANARY_TASKS,
  ERC8183,
  type IntegrityCheck,
  type ProviderHireResponse,
  type SafeHirePlan,
  sameAddress,
  validateProviderPlan,
} from '@/lib/erc8183';

const PROVIDER_BASE = 'https://agent.brainonbnb.com';
const RPC_URL = ERC8183.rpcUrls[0];

async function rpc<T>(method: string, params: unknown[]) {
  const response = await fetch(RPC_URL, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ jsonrpc: '2.0', id: 1, method, params }),
    cache: 'no-store',
  });
  if (!response.ok) throw new Error(`BNB RPC ${method} returned ${response.status}`);
  const body = await response.json() as { result?: T; error?: { message?: string } };
  if (body.error || body.result === undefined) throw new Error(body.error?.message || `BNB RPC ${method} failed`);
  return body.result;
}

function decodedAddress(value: string) {
  return '0x' + value.replace(/^0x/, '').slice(-40);
}

async function verifyOnchain(): Promise<IntegrityCheck[]> {
  const addresses = [ERC8183.kernel, ERC8183.implementation, ERC8183.router, ERC8183.policy, ERC8183.paymentToken];
  const [chainHex, codes, implementationHex, paymentTokenHex, disputeWindowHex] = await Promise.all([
    rpc<string>('eth_chainId', []),
    Promise.all(addresses.map((address) => rpc<string>('eth_getCode', [address, 'latest']))),
    rpc<string>('eth_getStorageAt', [ERC8183.kernel, ERC8183.eip1967ImplementationSlot, 'latest']),
    rpc<string>('eth_call', [{ to: ERC8183.kernel, data: ERC8183.selectors.paymentToken }, 'latest']),
    rpc<string>('eth_call', [{ to: ERC8183.policy, data: ERC8183.selectors.disputeWindow }, 'latest']),
  ]);
  const disputeWindow = Number(BigInt(disputeWindowHex));
  return [
    { label: 'RPC reports BSC mainnet', pass: Number.parseInt(chainHex, 16) === ERC8183.chainId, observed: String(Number.parseInt(chainHex, 16)) },
    { label: 'All five contracts have code', pass: codes.every((code) => code.length > 2), observed: codes.map((code) => String((code.length - 2) / 2)).join(', ') + ' bytes' },
    { label: 'Kernel proxy implementation', pass: sameAddress(decodedAddress(implementationHex), ERC8183.implementation), observed: decodedAddress(implementationHex) },
    { label: 'Kernel paymentToken()', pass: sameAddress(decodedAddress(paymentTokenHex), ERC8183.paymentToken), observed: decodedAddress(paymentTokenHex) },
    { label: 'Policy disputeWindow()', pass: disputeWindow === ERC8183.disputeWindowSeconds, observed: String(disputeWindow) + ' seconds' },
  ];
}

function safeTask(input: string | null, tokenId: string) {
  const fallback = CANARY_TASKS[tokenId];
  if (!input) return fallback;
  const cleaned = input.replace(/[\u0000-\u001f\u007f]/g, ' ').replace(/\s+/g, ' ').trim();
  if (cleaned.length < 12 || cleaned.length > 320) return fallback;
  return cleaned;
}

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const tokenId = requestUrl.searchParams.get('registry') || '304493';
  const candidate = getCandidateByTokenId(tokenId);
  if (!candidate) return Response.json({ error: 'Unsupported registry identity.' }, { status: 400 });
  const task = safeTask(requestUrl.searchParams.get('task'), tokenId);

  try {
    const [providerResponse, onchainChecks] = await Promise.all([
      fetch(`${PROVIDER_BASE}/hire?agent=${encodeURIComponent(tokenId)}&task=${encodeURIComponent(task)}`, {
        cache: 'no-store',
        signal: AbortSignal.timeout(15_000),
      }),
      verifyOnchain(),
    ]);
    if (!providerResponse.ok) throw new Error(`Provider quote returned ${providerResponse.status}`);
    const raw = await providerResponse.json() as ProviderHireResponse;
    const providerIntegrity = validateProviderPlan(raw, candidate, Math.floor(Date.now() / 1000), task);
    const checks = [...providerIntegrity.checks, ...onchainChecks];
    const passed = checks.every((check) => check.pass);
    if (!passed || !raw.quote || !raw.escrow || !raw.calls || !raw.provider) {
      return Response.json({ error: 'Live quote failed the execution allowlist.', integrity: { passed, checks } }, { status: 502 });
    }

    const plan: SafeHirePlan = {
      observedAt: new Date().toISOString(),
      candidate: {
        tokenId: candidate.tokenId,
        name: candidate.name,
        category: candidate.category,
        serviceId: candidate.serviceId,
        provider: candidate.provider,
      },
      task,
      provider: raw.provider,
      endpoint: raw.endpoint || candidate.endpoint,
      quote: {
        display: raw.quote.price || ERC8183.amountDisplay,
        amountAtomic: raw.quote.price_atomic || ERC8183.amountAtomic,
        estimatedCompletionSeconds: raw.quote.estimated_completion_seconds || null,
        signed: providerIntegrity.signed,
        expiresAt: Number(raw.escrow.expires_at),
      },
      escrow: {
        chainId: ERC8183.chainId,
        kernel: ERC8183.kernel,
        router: ERC8183.router,
        policy: ERC8183.policy,
        paymentToken: ERC8183.paymentToken,
        disputeWindowSeconds: ERC8183.disputeWindowSeconds,
        refundable: raw.escrow.refundable || 'If no deliverable arrives before expiry, claimRefund(jobId) returns the escrow budget.',
      },
      calls: raw.calls,
      integrity: {
        passed,
        checks,
        warning: providerIntegrity.signed
          ? 'The provider quote includes a signature and negotiation hash.'
          : 'The provider returned an unsigned quote. Grabit validated its TLS response, exact addresses, selectors, amount and live contracts, but cannot prove the provider signed these terms.',
      },
    };

    return Response.json(plan, { headers: { 'cache-control': 'no-store' } });
  } catch (error) {
    return Response.json({
      error: error instanceof Error ? error.message : 'The live execution plan could not be verified.',
    }, { status: 503, headers: { 'cache-control': 'no-store' } });
  }
}
