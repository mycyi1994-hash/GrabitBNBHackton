/**
 * Altana session grant / revoke / status.
 *
 * GET reads the session's authority from the public KeyStore, so the screen
 * reports what the chain says rather than what this server remembers. POST
 * grants or revokes, and both are real on-chain transactions.
 *
 * Following the repository data rules: when the server-only keys are absent the
 * route answers UNAVAILABLE with the reason. It never invents a session.
 */
import {
  DEFAULT_ALTANA_CHAIN_ID,
  SESSION_TTL_SECONDS,
  agentSessionPermissions,
  altanaClient,
  altanaConfigurationError,
  altanaNetwork,
  altanaNetworkSummary,
  describeSessionPermissions,
  getAltanaAdminSigner,
  getAltanaAgentWallet,
  getAltanaSessionSigner,
  isSupportedAltanaChain,
  readAccountSessionKey,
  readSessionAuthority,
} from '@/lib/altana';

const NO_STORE = { 'cache-control': 'no-store' };

function resolveChainId(value: unknown) {
  if (value === undefined || value === null || value === '') return DEFAULT_ALTANA_CHAIN_ID;
  const chainId = Number(value);
  if (!Number.isInteger(chainId) || !isSupportedAltanaChain(chainId)) {
    throw new Error(`Unsupported Altana chain: ${String(value)}.`);
  }
  return chainId;
}

function unavailable(reason: string, chainId: number) {
  return Response.json(
    {
      state: 'UNAVAILABLE',
      reason,
      observedAt: new Date().toISOString(),
      network: isSupportedAltanaChain(chainId) ? altanaNetworkSummary(chainId) : null,
    },
    { status: 503, headers: NO_STORE },
  );
}

export async function GET(request: Request) {
  let chainId = DEFAULT_ALTANA_CHAIN_ID;
  try {
    chainId = resolveChainId(new URL(request.url).searchParams.get('chainId'));
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : 'Invalid chain.' },
      { status: 400, headers: NO_STORE },
    );
  }

  const configurationError = altanaConfigurationError();
  if (configurationError) return unavailable(configurationError, chainId);

  try {
    const [authority, accountKey] = await Promise.all([
      readSessionAuthority(chainId),
      readAccountSessionKey(chainId),
    ]);
    // The account enforces the session; KeyStore is what a third party reads.
    // Both must hold for the session to be live and publicly verifiable.
    const state = accountKey.authorized
      ? authority.active
        ? 'ACTIVE'
        : 'ACTIVE_UNREGISTERED'
      : accountKey.expired
        ? 'EXPIRED'
        : 'NOT_GRANTED';
    return Response.json(
      {
        state,
        observedAt: new Date().toISOString(),
        network: altanaNetworkSummary(chainId),
        agent: {
          walletAddress: authority.walletAddress,
          walletUrl: authority.walletUrl,
        },
        session: {
          publicKey: authority.sessionPublicKey,
          keyId: authority.keyId,
          /** Enforced by the agent's account contract. */
          authorizedOnAccount: accountKey.authorized,
          expiry: accountKey.expiry || null,
          expiresAt: accountKey.expiresAt,
          secondsRemaining: accountKey.secondsRemaining,
          expired: accountKey.expired,
          /** Publicly verifiable through the Altana KeyStore registry. */
          registeredInKeyStore: authority.active,
          registeredKeyCount: authority.registeredKeyIds.length,
          keyStore: authority.keyStore,
          keyStoreUrl: authority.keyStoreUrl,
        },
        permissions: describeSessionPermissions(chainId),
      },
      { headers: NO_STORE },
    );
  } catch (error) {
    return unavailable(
      error instanceof Error ? error.message : 'The Altana KeyStore could not be read.',
      chainId,
    );
  }
}

export async function POST(request: Request) {
  let body: { action?: string; chainId?: number | string };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return Response.json({ error: 'A JSON body is required.' }, { status: 400, headers: NO_STORE });
  }

  const action = body.action;
  if (action !== 'grant' && action !== 'revoke') {
    return Response.json(
      { error: 'action must be "grant" or "revoke".' },
      { status: 400, headers: NO_STORE },
    );
  }

  let chainId = DEFAULT_ALTANA_CHAIN_ID;
  try {
    chainId = resolveChainId(body.chainId);
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : 'Invalid chain.' },
      { status: 400, headers: NO_STORE },
    );
  }

  const configurationError = altanaConfigurationError();
  if (configurationError) return unavailable(configurationError, chainId);

  const network = altanaNetwork(chainId);
  const client = altanaClient(chainId);
  const wallet = getAltanaAgentWallet();
  const adminSigner = getAltanaAdminSigner();

  try {
    if (action === 'revoke') {
      const sessionPublicKey = getAltanaSessionSigner().publicKey;
      const result = await client.revokeSession({
        wallet,
        signer: adminSigner,
        session: sessionPublicKey,
        chainId,
      });
      return Response.json(
        {
          action: 'revoke',
          state: 'REVOKED',
          observedAt: new Date().toISOString(),
          chainId,
          callsId: result.callsId,
          status: result.status,
          transactionHash: result.transactionHash ?? null,
          transactionUrl: result.transactionHash
            ? `${network.explorer}/tx/${result.transactionHash}`
            : null,
        },
        { headers: NO_STORE },
      );
    }

    const expiry = Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS;
    const session = await client.grantSession({
      wallet,
      signer: adminSigner,
      chainId,
      permissions: agentSessionPermissions(chainId),
      expiry,
      sessionSigner: getAltanaSessionSigner(),
      // Registered in KeyStore so a third party can verify this key on-chain.
      register: true,
    });

    return Response.json(
      {
        action: 'grant',
        state: 'GRANTED',
        observedAt: new Date().toISOString(),
        chainId,
        expiry,
        expiresAt: new Date(expiry * 1000).toISOString(),
        session: {
          publicKey: session.publicKey,
          walletAddress: session.walletAddress,
        },
        transactionHash: session.transactionHash ?? null,
        transactionUrl: session.transactionHash
          ? `${network.explorer}/tx/${session.transactionHash}`
          : null,
        permissions: describeSessionPermissions(chainId),
      },
      { headers: NO_STORE },
    );
  } catch (error) {
    return Response.json(
      {
        action,
        state: 'FAILED',
        error: error instanceof Error ? error.message : `The Altana ${action} failed.`,
        observedAt: new Date().toISOString(),
        chainId,
      },
      { status: 502, headers: NO_STORE },
    );
  }
}
