import { verifyMessage, type Address } from 'viem';
import { getCandidateByTokenId } from '@/lib/marketplace-data';
import { CANARY_TASKS, ERC8183_TESTNET, sameAddress, type IntegrityCheck } from '@/lib/erc8183';
import {
  buildTestnetProviderPlan,
  getTestnetPublicClient,
  testnetKernelAbi,
  testnetRouterAbi,
} from '@/lib/testnet-reference-provider';

const CONFIG = ERC8183_TESTNET;

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
    const plan = await buildTestnetProviderPlan(candidate, task);
    const publicClient = getTestnetPublicClient();
    const addresses = [CONFIG.kernel, CONFIG.router, CONFIG.policy, CONFIG.paymentToken] as Address[];
    const [chainId, codes, kernelToken, policyAllowed, providerBalance, signatureValid] = await Promise.all([
      publicClient.getChainId(),
      Promise.all(addresses.map((address) => publicClient.getBytecode({ address }))),
      publicClient.readContract({
        address: CONFIG.kernel as Address,
        abi: testnetKernelAbi,
        functionName: 'paymentToken',
      }),
      publicClient.readContract({
        address: CONFIG.router as Address,
        abi: testnetRouterAbi,
        functionName: 'policyWhitelist',
        args: [CONFIG.policy as Address],
      }),
      publicClient.getBalance({ address: plan.provider }),
      verifyMessage({
        address: plan.provider,
        message: { raw: plan.quote.negotiationHash },
        signature: plan.quote.providerSignature,
      }),
    ]);

    const checks: IntegrityCheck[] = [
      { label: 'BSC Testnet', pass: chainId === CONFIG.chainId, observed: `chain ${chainId}` },
      { label: 'Execution contracts', pass: codes.every((code) => Boolean(code && code.length > 2)), observed: 'kernel / router / policy / token' },
      { label: 'Kernel payment token', pass: sameAddress(kernelToken, CONFIG.paymentToken), observed: String(kernelToken) },
      { label: 'Router policy allowlist', pass: policyAllowed === true, observed: String(policyAllowed) },
      { label: 'Signed provider quote', pass: signatureValid, observed: signatureValid ? 'valid signature' : 'invalid signature' },
      { label: 'Five explicit calls', pass: plan.calls.length === 5, observed: String(plan.calls.length) },
      { label: 'Exact test amount', pass: plan.quote.amountAtomic === CONFIG.amountAtomic, observed: plan.quote.amountAtomic },
      { label: 'Two-hour expiry', pass: plan.quote.expiresAt >= Math.floor(Date.now() / 1000) + CONFIG.disputeWindowSeconds + 600, observed: new Date(plan.quote.expiresAt * 1000).toISOString() },
    ];
    const passed = checks.every((check) => check.pass);
    const minimumProviderGas = BigInt('2000000000000000');

    return Response.json({
      ...plan,
      providerRuntime: {
        address: plan.provider,
        gasBalanceWei: providerBalance.toString(),
        gasBalanceDisplay: `${Number(providerBalance) / 1e18} tBNB`,
        minimumGasWei: minimumProviderGas.toString(),
        ready: providerBalance >= minimumProviderGas,
      },
      integrity: {
        passed,
        checks,
        warning: 'This quote is signed by a Testnet-only Grabit reference provider. It cannot authorize Mainnet transactions.',
      },
    }, { status: passed ? 200 : 503, headers: { 'cache-control': 'no-store' } });
  } catch (error) {
    return Response.json({
      error: error instanceof Error ? error.message : 'The Testnet provider quote could not be created.',
    }, { status: 503, headers: { 'cache-control': 'no-store' } });
  }
}
