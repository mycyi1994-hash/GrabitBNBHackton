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
  ensureAltanaAgentWallet,
  getAltanaAdminSigner,
  getAltanaSessionSigner,
  isSupportedAltanaChain,
  readAccountSessionKey,
  readSessionAuthority,
  waitForKeyStoreVisibility,
} from '@/lib/altana';

const NO_STORE = { 'cache-control': 'no-store' };

/**
 * KeyStore's own revert string, reached either as a plain message or as the
 * ABI-encoded Error(string) the relay hands back inside a hex blob.
 */
function isAlreadyRegistered(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error);
  if (/key already registered/i.test(message)) return true;
  // "KeyStore: key already registered" as ASCII inside the encoded revert.
  return message.toLowerCase().includes('4b657953746f72653a206b657920616c7265616479');
}

/**
 * Relay failures arrive with the entire prepared-call payload appended — a
 * multi-kilobyte hex dump that buries the one line describing what went wrong.
 * Keep the message and drop the transcript.
 */
function relayMessage(error: unknown, fallback: string) {
  if (!(error instanceof Error)) return fallback;
  const firstBlock = error.message.split(/Request body:|URL:|Raw Call Arguments:/)[0].trim();
  const message = (firstBlock || error.message).split('\n').slice(0, 3).join(' ').trim();
  return message.length > 400 ? `${message.slice(0, 400)}…` : message || fallback;
}

function resolveChainId(value: unknown) {
  if (value === undefined || value === null || value === '') return DEFAULT_ALTANA_CHAIN_ID;
  const chainId = Number(value);
  if (!Number.isInteger(chainId) || !isSupportedAltanaChain(chainId)) {
    throw new Error(`Unsupported Altana chain: ${String(value)}.`);
  }
  return chainId;
}

function unavailable(reason: string, chainId: number) {
  const supported = isSupportedAltanaChain(chainId);
  return Response.json(
    {
      state: 'UNAVAILABLE',
      reason,
      observedAt: new Date().toISOString(),
      network: supported ? altanaNetworkSummary(chainId) : null,
      // The scope a grant would carry is derived from the chain's ERC-8183
      // deployment, not from any key, so it is reported even when no session
      // can be read. It lets the product state what the Agent would be allowed
      // to do before anyone grants it anything.
      permissions: supported ? describeSessionPermissions(chainId) : null,
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
          /**
           * Two separate facts, previously collapsed into one.
           * `registeredInKeyStore` is whether the public registry carries this
           * key at all — permanent once done. `validInKeyStore` is whether a
           * verifier would accept it right now, which lapses at the expiry.
           */
          registeredInKeyStore: authority.registered,
          validInKeyStore: authority.active,
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
  const adminSigner = getAltanaAdminSigner();

  try {
    // The relay only accepts prepared calls for an address it has seen
    // delegated. Counterfactual and idempotent, so it runs before every write.
    const wallet = await ensureAltanaAgentWallet(chainId);

    // An account that has acted before already holds its admin key in KeyStore.
    // Let the public read catch up before the SDK decides whether to register
    // it again, or a write issued moments after a grant reverts with
    // "KeyStore: key already registered". A first action skips this entirely.
    if (wallet.alreadyDelegated) await waitForKeyStoreVisibility(chainId);

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
    const grant = {
      wallet,
      signer: adminSigner,
      chainId,
      permissions: agentSessionPermissions(chainId),
      expiry,
      sessionSigner: getAltanaSessionSigner(),
    };

    /*
     * KeyStore registration is permanent and happens once. It is not
     * idempotent: registering a key the registry already holds reverts with
     * "KeyStore: key already registered" rather than accepting a no-op.
     *
     * Expiry is a separate fact. A key granted an hour ago is still registered
     * and no longer valid, so every grant after the first must publish nothing
     * and only re-authorise. Asking the registry first is what decides that;
     * `npm run altana keyids` shows the same answer from the command line.
     *
     * The catch stays as a backstop for the race where registration lands
     * between the read and the write. It only ever downgrades to
     * `register: false`, which is the state the revert is reporting anyway, so
     * it cannot mask a real failure — and nothing about the session's scope
     * depends on it.
     */
    const before = await readSessionAuthority(chainId).catch(() => null);
    let registeredNow = !before?.registered;
    let session;
    try {
      session = await client.grantSession({ ...grant, register: registeredNow });
    } catch (error) {
      if (!registeredNow || !isAlreadyRegistered(error)) throw error;
      registeredNow = false;
      session = await client.grantSession({ ...grant, register: false });
    }

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
          keyStore: registeredNow ? 'REGISTERED_NOW' : 'ALREADY_REGISTERED',
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
        error: relayMessage(error, `The Altana ${action} failed.`),
        observedAt: new Date().toISOString(),
        chainId,
      },
      { status: 502, headers: NO_STORE },
    );
  }
}
