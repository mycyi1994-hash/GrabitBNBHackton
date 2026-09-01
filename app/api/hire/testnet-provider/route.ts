import { operatorGuard } from '@/lib/operator-auth';
import { formatEther, hexToString, type Address } from 'viem';
import { ERC8183_TESTNET, sameAddress } from '@/lib/erc8183';
import {
  buildReferenceDeliverable,
  getTestnetProviderAccount,
  getTestnetPublicClient,
  getTestnetWalletClient,
  parseReferenceDescription,
  readTestnetJob,
  TESTNET_JOB_STATUS,
  testnetJobInitialisedEvent,
  testnetKernelAbi,
  testnetRouterAbi,
  type TestnetJob,
} from '@/lib/testnet-reference-provider';

const CONFIG = ERC8183_TESTNET;

function safeJobId(value: unknown) {
  const text = String(value || '');
  if (!/^\d{1,20}$/.test(text) || BigInt(text) < BigInt(1)) {
    throw new Error('A positive numeric Testnet jobId is required.');
  }
  return BigInt(text);
}

function serializeJob(job: TestnetJob) {
  return {
    id: job.id.toString(),
    client: job.client,
    provider: job.provider,
    evaluator: job.evaluator,
    description: job.description,
    budget: job.budget.toString(),
    budgetDisplay: `${Number(job.budget) / 1e18} test $U`,
    expiredAt: Number(job.expiredAt),
    status: TESTNET_JOB_STATUS[job.status] || `UNKNOWN_${job.status}`,
    statusCode: job.status,
    hook: job.hook,
    submittedAt: Number(job.submittedAt),
    deliverable: job.deliverable,
  };
}

async function readResult(jobId: bigint) {
  const publicClient = getTestnetPublicClient();
  const latest = await publicClient.getBlockNumber();
  const fromBlock = latest > BigInt(20_000) ? latest - BigInt(20_000) : BigInt(0);
  try {
    const logs = await publicClient.getContractEvents({
      address: CONFIG.policy as Address,
      abi: [testnetJobInitialisedEvent],
      eventName: 'JobInitialised',
      args: { jobId },
      fromBlock,
      toBlock: 'latest',
    });
    const last = logs.at(-1);
    const optParams = last?.args.optParams;
    if (!optParams || optParams === '0x') return null;
    return JSON.parse(hexToString(optParams)) as Record<string, unknown>;
  } catch {
    return null;
  }
}

async function providerSnapshot(jobId?: bigint) {
  const publicClient = getTestnetPublicClient();
  const account = getTestnetProviderAccount();
  const [balance, blockNumber] = await Promise.all([
    publicClient.getBalance({ address: account.address }),
    publicClient.getBlockNumber(),
  ]);
  const minimumGas = BigInt('2000000000000000');
  if (!jobId) {
    return {
      network: CONFIG.chainName,
      chainId: CONFIG.chainId,
      blockNumber: blockNumber.toString(),
      provider: account.address,
      gasBalanceWei: balance.toString(),
      gasBalanceDisplay: `${formatEther(balance)} tBNB`,
      ready: balance >= minimumGas,
      minimumGasWei: minimumGas.toString(),
    };
  }

  const [job, policy] = await Promise.all([
    readTestnetJob(jobId),
    publicClient.readContract({
      address: CONFIG.router as Address,
      abi: testnetRouterAbi,
      functionName: 'jobPolicy',
      args: [jobId],
    }),
  ]);
  const now = Math.floor(Date.now() / 1000);
  const settlesAt = Number(job.submittedAt) + CONFIG.disputeWindowSeconds;
  const description = parseReferenceDescription(job.description);
  return {
    network: CONFIG.chainName,
    chainId: CONFIG.chainId,
    blockNumber: blockNumber.toString(),
    provider: account.address,
    gasBalanceWei: balance.toString(),
    gasBalanceDisplay: `${formatEther(balance)} tBNB`,
    ready: balance >= minimumGas,
    minimumGasWei: minimumGas.toString(),
    job: serializeJob(job),
    policy,
    validReferenceJob: Boolean(
      description
      && sameAddress(job.provider, account.address)
      && sameAddress(job.evaluator, CONFIG.router)
      && sameAddress(job.hook, CONFIG.router)
      && sameAddress(policy, CONFIG.policy)
      && job.budget === BigInt(CONFIG.amountAtomic)
    ),
    canSubmit: job.status === 1 && now + CONFIG.disputeWindowSeconds + 60 < Number(job.expiredAt),
    canSettle: job.status === 2 && now >= settlesAt,
    settlesAt,
    secondsUntilSettle: job.status === 2 ? Math.max(0, settlesAt - now) : null,
    result: job.status >= 2 ? await readResult(jobId) : null,
  };
}

export async function GET(request: Request) {
  try {
    const rawJobId = new URL(request.url).searchParams.get('jobId');
    const snapshot = await providerSnapshot(rawJobId ? safeJobId(rawJobId) : undefined);
    return Response.json(snapshot, { headers: { 'cache-control': 'no-store' } });
  } catch (error) {
    return Response.json({
      error: error instanceof Error ? error.message : 'Testnet provider status unavailable.',
    }, { status: 503, headers: { 'cache-control': 'no-store' } });
  }
}

export async function POST(request: Request) {
  const refusal = operatorGuard(request);
  if (refusal) return refusal;

  try {
    const input = await request.json() as { action?: unknown; jobId?: unknown };
    const action = String(input.action || '');
    if (action !== 'submit' && action !== 'settle') {
      return Response.json({ error: 'Action must be submit or settle.' }, { status: 400 });
    }
    const jobId = safeJobId(input.jobId);
    const publicClient = getTestnetPublicClient();
    const walletClient = getTestnetWalletClient();
    const account = getTestnetProviderAccount();
    const job = await readTestnetJob(jobId);
    const policy = await publicClient.readContract({
      address: CONFIG.router as Address,
      abi: testnetRouterAbi,
      functionName: 'jobPolicy',
      args: [jobId],
    });
    const validJob = Boolean(
      parseReferenceDescription(job.description)
      && sameAddress(job.provider, account.address)
      && sameAddress(job.evaluator, CONFIG.router)
      && sameAddress(job.hook, CONFIG.router)
      && sameAddress(policy, CONFIG.policy)
      && job.budget === BigInt(CONFIG.amountAtomic)
    );
    if (!validJob) {
      return Response.json({ error: 'The on-chain Job failed the Testnet provider allowlist.' }, { status: 409 });
    }

    if (action === 'submit') {
      const now = Math.floor(Date.now() / 1000);
      if (job.status !== 1) return Response.json({ error: 'Only a FUNDED Job can be submitted.' }, { status: 409 });
      if (now + CONFIG.disputeWindowSeconds + 60 >= Number(job.expiredAt)) {
        return Response.json({ error: 'Not enough time remains for the optimistic dispute window.' }, { status: 409 });
      }
      const deliverable = await buildReferenceDeliverable(jobId, job);
      const simulation = await publicClient.simulateContract({
        account,
        address: CONFIG.kernel as Address,
        abi: testnetKernelAbi,
        functionName: 'submit',
        args: [jobId, deliverable.deliverable, deliverable.optParams],
      });
      const txHash = await walletClient.writeContract(simulation.request);
      return Response.json({
        action,
        jobId: jobId.toString(),
        txHash,
        deliverable: deliverable.deliverable,
        result: deliverable.result,
      }, { headers: { 'cache-control': 'no-store' } });
    }

    const now = Math.floor(Date.now() / 1000);
    const settlesAt = Number(job.submittedAt) + CONFIG.disputeWindowSeconds;
    if (job.status !== 2) return Response.json({ error: 'Only a SUBMITTED Job can be settled.' }, { status: 409 });
    if (now < settlesAt) {
      return Response.json({ error: `The 15-minute dispute window has ${settlesAt - now} seconds remaining.` }, { status: 409 });
    }
    const simulation = await publicClient.simulateContract({
      account,
      address: CONFIG.router as Address,
      abi: testnetRouterAbi,
      functionName: 'settle',
      args: [jobId, '0x'],
    });
    const txHash = await walletClient.writeContract(simulation.request);
    return Response.json({ action, jobId: jobId.toString(), txHash }, {
      headers: { 'cache-control': 'no-store' },
    });
  } catch (error) {
    return Response.json({
      error: error instanceof Error ? error.message : 'The Testnet provider action failed.',
    }, { status: 503, headers: { 'cache-control': 'no-store' } });
  }
}
