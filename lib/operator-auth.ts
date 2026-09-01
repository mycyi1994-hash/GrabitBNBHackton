/**
 * Write routes are operator-only.
 *
 * Grant, revoke, hire and provider submission all spend the wallet's gas and
 * the session's budget. On a public deployment an unauthenticated POST to any
 * of them lets a stranger drain the agent wallet, burn the day's $U ceiling, or
 * empty the provider's gas — none of it worth money on testnet, and all of it
 * enough to leave a judge looking at a dead demo.
 *
 * It would also contradict the product. A marketplace arguing that authority
 * should be bounded and legible cannot ship an unbounded public write surface.
 *
 * Reads stay open: discovery, agent status, readiness, the free strategy
 * preview. Those are the demonstration. Nothing behind this guard is needed to
 * evaluate what Grabit does — the on-chain receipts of it having been done are
 * in docs/ONCHAIN_RECEIPTS.md.
 */
const HEADER = 'x-grabit-operator';

/** Length-independent comparison, so a wrong token leaks nothing by timing. */
function constantTimeEqual(a: string, b: string): boolean {
  const length = Math.max(a.length, b.length);
  let differing = a.length ^ b.length;
  for (let i = 0; i < length; i += 1) {
    differing |= (a.charCodeAt(i) || 0) ^ (b.charCodeAt(i) || 0);
  }
  return differing === 0;
}

/**
 * Returns a refusal to send back, or null when the caller may proceed.
 *
 * An unset token refuses rather than opening up. Failing closed is the only
 * safe default for something that is about to be deployed publicly: a
 * misconfigured deploy should be inert, not generous.
 */
export function operatorGuard(request: Request): Response | null {
  const expected = process.env.GRABIT_OPERATOR_TOKEN;
  const headers = { 'cache-control': 'no-store' };

  if (!expected) {
    return Response.json(
      {
        state: 'LOCKED',
        reason:
          'GRABIT_OPERATOR_TOKEN is not configured, so every write route is closed. Reads are unaffected.',
        hint: 'Set it in .env.local, or as a Worker secret, and send it as the x-grabit-operator header.',
        observedAt: new Date().toISOString(),
      },
      { status: 503, headers },
    );
  }

  const supplied = request.headers.get(HEADER);
  if (!supplied || !constantTimeEqual(supplied, expected)) {
    return Response.json(
      {
        state: 'FORBIDDEN',
        reason: `This route spends the agent wallet, so it requires the ${HEADER} header.`,
        observedAt: new Date().toISOString(),
      },
      { status: 403, headers },
    );
  }
  return null;
}
