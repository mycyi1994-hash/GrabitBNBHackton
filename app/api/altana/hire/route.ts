/**
 * Hire an ERC-8004 Agent with the scoped Altana session key.
 *
 * The whole ERC-8183 buyer lifecycle — createJob, registerJob, setBudget,
 * approve, fund — goes out as one atomic relay intent signed by the session
 * key, not by the admin key and not by a browser wallet. The session's on-chain
 * allowlist and per-day spend cap are what bound this call: the account rejects
 * anything outside them at validation time, so the worst case here is one
 * capped job against an allowlisted contract.
 */
import { hireErc8183Agent } from '@altananetwork/sdk';
import {
  DEFAULT_ALTANA_CHAIN_ID,
  SESSION_BUDGET_ATOMIC,
  altanaConfigurationError,
  altanaNetwork,
  altanaNetworkSummary,
  isSupportedAltanaChain,
  resolveAgentSession,
} from '@/lib/altana';
import { CANARY_TASKS } from '@/lib/erc8183';
import { marketplaceCandidates } from '@/lib/marketplace-candidates';

const NO_STORE = { 'cache-control': 'no-store' };

export async function POST(request: Request) {
  let body: { registry?: string; chainId?: number | string; dryRun?: boolean };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return Response.json({ error: 'A JSON body is required.' }, { status: 400, headers: NO_STORE });
  }

  const candidate = marketplaceCandidates.find((entry) => entry.tokenId === String(body.registry));
  if (!candidate) {
    return Response.json(
      { error: 'registry must name one of the four verified Grabit candidates.' },
      { status: 400, headers: NO_STORE },
    );
  }

  const task = CANARY_TASKS[candidate.tokenId];
  if (!task) {
    return Response.json(
      { error: `No canary task is defined for registry ${candidate.tokenId}.` },
      { status: 400, headers: NO_STORE },
    );
  }

  const chainId =
    body.chainId === undefined || body.chainId === null || body.chainId === ''
      ? DEFAULT_ALTANA_CHAIN_ID
      : Number(body.chainId);
  if (!Number.isInteger(chainId) || !isSupportedAltanaChain(chainId)) {
    return Response.json(
      { error: `Unsupported Altana chain: ${String(body.chainId)}.` },
      { status: 400, headers: NO_STORE },
    );
  }

  const configurationError = altanaConfigurationError();
  if (configurationError) {
    return Response.json(
      { state: 'UNAVAILABLE', reason: configurationError, observedAt: new Date().toISOString() },
      { status: 503, headers: NO_STORE },
    );
  }

  const network = altanaNetwork(chainId);

  try {
    const session = await resolveAgentSession(chainId);

    // A dry run proves the session is live and the plan is bounded without
    // spending anything. Nothing below this point runs.
    if (body.dryRun) {
      return Response.json(
        {
          state: 'READY',
          observedAt: new Date().toISOString(),
          network: altanaNetworkSummary(chainId),
          plan: {
            agent: candidate.name,
            registry: candidate.tokenId,
            provider: candidate.provider,
            task,
            budgetAtomic: SESSION_BUDGET_ATOMIC.toString(),
            budgetDisplay: chainId === 56 ? '0.10 $U' : '0.10 test $U',
            signedBy: 'session',
            sessionExpiry: session.expiry,
          },
        },
        { headers: NO_STORE },
      );
    }

    const result = await hireErc8183Agent(
      session,
      {
        provider: candidate.provider as `0x${string}`,
        task,
        budget: SESSION_BUDGET_ATOMIC,
      },
      { network },
    );

    return Response.json(
      {
        state: 'FUNDED',
        observedAt: new Date().toISOString(),
        chainId,
        agent: {
          name: candidate.name,
          registry: candidate.tokenId,
          category: candidate.category,
        },
        job: {
          id: result.jobId.toString(),
          provider: result.provider,
          budgetAtomic: result.budget.toString(),
          budgetDisplay: chainId === 56 ? '0.10 $U' : '0.10 test $U',
          expiredAt: Number(result.expiredAt),
        },
        transaction: {
          callsId: result.callsId,
          status: result.status,
          hash: result.transactionHash ?? null,
          url: result.transactionHash ? `${network.explorer}/tx/${result.transactionHash}` : null,
          signedBy: 'session',
        },
      },
      { headers: NO_STORE },
    );
  } catch (error) {
    return Response.json(
      {
        state: 'FAILED',
        error: error instanceof Error ? error.message : 'The Altana session hire failed.',
        observedAt: new Date().toISOString(),
        chainId,
      },
      { status: 502, headers: NO_STORE },
    );
  }
}
