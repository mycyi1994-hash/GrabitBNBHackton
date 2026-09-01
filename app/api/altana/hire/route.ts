/**
 * Hire an ERC-8004 Agent with the scoped Altana session key.
 *
 * The whole ERC-8183 buyer lifecycle — createJob, registerJob, setBudget,
 * approve, fund — goes out as one atomic relay intent signed by the session
 * key, not by the admin key and not by a browser wallet. The session's on-chain
 * allowlist and per-day spend cap are what bound this call: the account rejects
 * anything outside them at validation time, so the worst case here is one
 * capped job against an allowlisted contract.
 *
 * The job escrows `jobBudgetAtomic` — what one Job costs — not the session's
 * daily ceiling. The two were briefly the same number, which hid the fact that
 * passing the ceiling here would sink a whole day's allowance into one job.
 */
import {
  DEFAULT_ALTANA_CHAIN_ID,
  altanaConfigurationError,
  altanaNetwork,
  altanaNetworkSummary,
  isSupportedAltanaChain,
  resolveAgentSession,
} from '@/lib/altana';
import { CANARY_TASKS, jobBudgetAtomic, jobBudgetDisplay } from '@/lib/erc8183';
import { hireWithVerifiedPolicy } from '@/lib/erc8183-hire';
import { marketplaceCandidates } from '@/lib/marketplace-candidates';
import { candidateEvidence, HIRE_OPENS_AT, ladderState } from '@/lib/verification-ladder';
import { buildReferenceJobDescription, getTestnetProviderAccount } from '@/lib/testnet-reference-provider';

const NO_STORE = { 'cache-control': 'no-store' };

/** Relay errors carry the whole prepared-call payload; keep only the reason. */
function relayMessage(error: unknown, fallback: string) {
  if (!(error instanceof Error)) return fallback;
  const firstBlock = error.message.split(/Request body:|URL:|Raw Call Arguments:/)[0].trim();
  const message = (firstBlock || error.message).split('\n').slice(0, 3).join(' ').trim();
  return message.length > 400 ? `${message.slice(0, 400)}…` : message || fallback;
}

/**
 * Two different things are called "hire", and only one of them is gated.
 *
 * `canary` hires Grabit's own testnet reference provider. It is how an agent's
 * category task gets run at all, which is what earns rung 4 — so gating it on
 * rung 4 would be circular. It is always available.
 *
 * `marketplace` pays the external agent named in the registry, and that is
 * blocked below rung 4, exactly as the detail screen says. The screen and this
 * route must agree; before this split the screen said blocked and the route
 * hired anyway.
 */
type HireMode = 'canary' | 'marketplace';

export async function POST(request: Request) {
  let body: {
    registry?: string;
    chainId?: number | string;
    dryRun?: boolean;
    mode?: HireMode;
  };
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

  const mode: HireMode = body.mode === 'marketplace' ? 'marketplace' : 'canary';
  const ladder = ladderState(candidateEvidence());

  if (mode === 'marketplace' && !ladder.hireAvailable) {
    return Response.json(
      {
        state: 'BLOCKED',
        reason: `This agent has not completed a task in its category under test. Marketplace hiring opens at rung ${HIRE_OPENS_AT}; it is on rung ${ladder.reached}.`,
        rung: ladder.reached,
        opensAt: HIRE_OPENS_AT,
        hint: 'Run the canary first: POST with mode "canary" hires the Grabit reference provider, which is what earns the rung.',
        observedAt: new Date().toISOString(),
      },
      { status: 409, headers: NO_STORE },
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

  // The canary pays Grabit's own chain-97 provider; a marketplace hire pays the
  // registry's provider. Naming the wrong one would send the escrow elsewhere.
  let provider: `0x${string}`;
  try {
    provider =
      mode === 'canary'
        ? (getTestnetProviderAccount().address as `0x${string}`)
        : (candidate.provider as `0x${string}`);
  } catch (error) {
    return Response.json(
      {
        state: 'UNAVAILABLE',
        reason:
          error instanceof Error
            ? error.message
            : 'The Testnet reference provider is not configured, so the canary has no counterparty.',
        observedAt: new Date().toISOString(),
      },
      { status: 503, headers: NO_STORE },
    );
  }

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
            mode,
            agent: candidate.name,
            registry: candidate.tokenId,
            provider,
            task,
            budgetAtomic: jobBudgetAtomic(chainId).toString(),
            budgetDisplay: jobBudgetDisplay(chainId),
            signedBy: 'session',
            sessionExpiry: session.expiry,
          },
        },
        { headers: NO_STORE },
      );
    }

    // Not hireErc8183Agent: it hardcodes an OptimisticPolicy address the
    // chain-97 router does not whitelist, so every hire through it reverts at
    // registerJob with PolicyNotWhitelisted(). See lib/erc8183-hire.ts.
    // A canary is delivered by Grabit's own provider, which only accepts a Job
    // whose description is its signed-quote envelope. Creating one with the
    // bare task string funds an escrow nothing can ever deliver against.
    const description =
      mode === 'canary' ? (await buildReferenceJobDescription(candidate, task)).description : task;

    const result = await hireWithVerifiedPolicy(
      session,
      {
        provider,
        task: description,
        budget: jobBudgetAtomic(chainId),
      },
      { network },
    );

    return Response.json(
      {
        state: 'FUNDED',
        mode,
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
          budgetDisplay: jobBudgetDisplay(chainId),
          expiredAt: Number(result.expiredAt),
        },
        policy: result.policy,
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
        error: relayMessage(error, 'The Altana session hire failed.'),
        observedAt: new Date().toISOString(),
        chainId,
      },
      { status: 502, headers: NO_STORE },
    );
  }
}
