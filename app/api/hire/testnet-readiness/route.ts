import { ERC8183_TESTNET, sameAddress, type IntegrityCheck } from '@/lib/erc8183';
import { getTestnetProviderAccount } from '@/lib/testnet-reference-provider';

const CONFIG = ERC8183_TESTNET;
const RPC_URL = CONFIG.rpcUrls[0];

async function rpc<T>(method: string, params: unknown[]) {
  const response = await fetch(RPC_URL, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ jsonrpc: '2.0', id: 97, method, params }),
    cache: 'no-store',
    signal: AbortSignal.timeout(12_000),
  });
  if (!response.ok) throw new Error(`BSC Testnet RPC ${method} returned ${response.status}`);
  const body = await response.json() as { result?: T; error?: { message?: string } };
  if (body.error || body.result === undefined) {
    throw new Error(body.error?.message || `BSC Testnet RPC ${method} failed`);
  }
  return body.result;
}

function decodedAddress(value: string) {
  return '0x' + value.replace(/^0x/, '').slice(-40);
}

function addressWord(address: string) {
  return address.replace(/^0x/, '').toLowerCase().padStart(64, '0');
}

export async function GET() {
  try {
    let providerAddress: string | null = null;
    let providerConfigurationError: string | null = null;
    try {
      providerAddress = getTestnetProviderAccount().address;
    } catch (error) {
      providerConfigurationError = error instanceof Error ? error.message : 'The Testnet reference provider is not configured.';
    }

    const contracts = [
      CONFIG.kernel,
      CONFIG.implementation,
      CONFIG.router,
      CONFIG.routerImplementation,
      CONFIG.policy,
      CONFIG.paymentToken,
    ];
    const whitelistData = CONFIG.selectors.policyWhitelist + addressWord(CONFIG.policy);
    const candidateWhitelistData = CONFIG.policyCandidates.map(
      (candidate) => CONFIG.selectors.policyWhitelist + addressWord(candidate),
    );
    const [
      chainHex,
      blockHex,
      codes,
      kernelImplementationHex,
      routerImplementationHex,
      paymentTokenHex,
      disputeWindowHex,
      policyAllowedHex,
      jobCounterHex,
      providerBalanceHex,
      candidateWhitelistHexes,
    ] = await Promise.all([
      rpc<string>('eth_chainId', []),
      rpc<string>('eth_blockNumber', []),
      Promise.all(contracts.map((address) => rpc<string>('eth_getCode', [address, 'latest']))),
      rpc<string>('eth_getStorageAt', [CONFIG.kernel, CONFIG.eip1967ImplementationSlot, 'latest']),
      rpc<string>('eth_getStorageAt', [CONFIG.router, CONFIG.eip1967ImplementationSlot, 'latest']),
      rpc<string>('eth_call', [{ to: CONFIG.kernel, data: CONFIG.selectors.paymentToken }, 'latest']),
      rpc<string>('eth_call', [{ to: CONFIG.policy, data: CONFIG.selectors.disputeWindow }, 'latest']),
      rpc<string>('eth_call', [{ to: CONFIG.router, data: whitelistData }, 'latest']),
      rpc<string>('eth_call', [{ to: CONFIG.kernel, data: CONFIG.selectors.jobCounter }, 'latest']),
      providerAddress ? rpc<string>('eth_getBalance', [providerAddress, 'latest']) : Promise.resolve('0x0'),
      Promise.all(
        candidateWhitelistData.map((data) =>
          rpc<string>('eth_call', [{ to: CONFIG.router, data }, 'latest']).catch(() => '0x0'),
        ),
      ),
    ]);

    const chainId = Number.parseInt(chainHex, 16);
    const blockNumber = Number(BigInt(blockHex));
    const disputeWindowSeconds = Number(BigInt(disputeWindowHex));
    const jobCounter = BigInt(jobCounterHex).toString();
    const policyAllowed = BigInt(policyAllowedHex) === BigInt(1);
    // Which of the two known chain-97 policy deployments the router actually
    // whitelists. The configured address may not be the one that works.
    const policyCandidates = CONFIG.policyCandidates.map((address, index) => ({
      address,
      whitelisted: BigInt(candidateWhitelistHexes[index] || '0x0') === BigInt(1),
      configured: sameAddress(address, CONFIG.policy),
    }));
    const resolvedPolicy = policyCandidates.find((candidate) => candidate.whitelisted) ?? null;
    const policyMismatch = Boolean(resolvedPolicy) && !resolvedPolicy!.configured;
    const providerBalance = BigInt(providerBalanceHex);
    const minimumProviderGas = BigInt('2000000000000000');
    const providerFunded = providerBalance >= minimumProviderGas;
    const checks: IntegrityCheck[] = [
      { label: 'BSC Testnet RPC', pass: chainId === CONFIG.chainId, observed: `chain ${chainId} · block ${blockNumber}` },
      { label: 'Six deployment contracts', pass: codes.every((code) => code.length > 2), observed: codes.map((code) => `${(code.length - 2) / 2}B`).join(' / ') },
      { label: 'Kernel implementation', pass: sameAddress(decodedAddress(kernelImplementationHex), CONFIG.implementation), observed: decodedAddress(kernelImplementationHex) },
      { label: 'Router implementation', pass: sameAddress(decodedAddress(routerImplementationHex), CONFIG.routerImplementation), observed: decodedAddress(routerImplementationHex) },
      { label: 'Kernel payment token', pass: sameAddress(decodedAddress(paymentTokenHex), CONFIG.paymentToken), observed: decodedAddress(paymentTokenHex) },
      {
        label: 'Policy allowlist',
        pass: policyAllowed,
        observed: policyAllowed
          ? 'whitelisted'
          : resolvedPolicy
            ? `not whitelisted — the router whitelists ${resolvedPolicy.address} instead`
            : 'not whitelisted — neither known policy address is whitelisted',
      },
      { label: 'Short dispute window', pass: disputeWindowSeconds === CONFIG.disputeWindowSeconds, observed: `${disputeWindowSeconds} seconds` },
    ];
    const passed = checks.every((check) => check.pass);
    const executionEnabled = passed && Boolean(providerAddress) && providerFunded;
    const blocker = policyMismatch
      ? `The configured policy is not whitelisted; the router whitelists ${resolvedPolicy!.address}.`
      : !passed
      ? 'One or more BSC Testnet deployment checks failed.'
      : providerConfigurationError
        ? providerConfigurationError
        : !providerFunded
          ? 'The Testnet provider needs at least 0.002 tBNB for result submission and settlement.'
          : null;

    return Response.json({
      observedAt: new Date().toISOString(),
      network: {
        chainId: CONFIG.chainId,
        name: CONFIG.chainName,
        blockNumber,
        explorerUrl: CONFIG.explorerUrl,
      },
      contracts: {
        kernel: CONFIG.kernel,
        router: CONFIG.router,
        policy: CONFIG.policy,
        paymentToken: CONFIG.paymentToken,
      },
      policyResolution: {
        configured: CONFIG.policy,
        routerWhitelists: resolvedPolicy?.address ?? null,
        mismatch: policyMismatch,
        candidates: policyCandidates,
        note: policyMismatch
          ? 'ERC8183_TESTNET.policy in lib/erc8183.ts does not match what the router whitelists. Update it to routerWhitelists before running the Testnet hire.'
          : resolvedPolicy
            ? 'The configured policy is the one the router whitelists.'
            : 'Neither known policy address is whitelisted by the router. Re-check the deployment.',
      },
      protocol: {
        jobCounter,
        disputeWindowSeconds,
      },
      integrity: { passed, checks },
      execution: {
        enabled: executionEnabled,
        blocker,
        provider: providerAddress,
        gasBalanceWei: providerBalance.toString(),
        minimumGasWei: minimumProviderGas.toString(),
      },
    }, { status: passed ? 200 : 503, headers: { 'cache-control': 'no-store' } });
  } catch (error) {
    return Response.json({
      error: error instanceof Error ? error.message : 'BSC Testnet readiness could not be verified.',
    }, { status: 503, headers: { 'cache-control': 'no-store' } });
  }
}
