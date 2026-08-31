/**
 * Altana session-key integration.
 *
 * The agent acts from its own Altana smart account through a session key whose
 * authority is bounded on-chain: a call allowlist covering exactly the ERC-8183
 * hire lifecycle, a per-day $U spend cap, and an expiry. The session is
 * registered in the public Altana KeyStore, so any third party can verify what
 * the key may do without trusting this application.
 *
 * Both keys are server-only. They are deliberately separate: the admin key
 * grants and revokes, the session key signs the agent's work. A leaked session
 * key can only replay the allowlisted lifecycle up to the capped amount, and
 * only until the expiry or the next revoke.
 */
import {
  BNB,
  BNB_TESTNET,
  createClient,
  erc8183Addresses,
  signerFromPrivateKey,
  type Client,
  type CallPermission,
  type NetworkConfig,
  type Session,
  type SessionPermissions,
  type Signer,
  type Wallet,
} from '@altananetwork/sdk';
import { createPublicClient, http, keccak256, padHex, type Address, type Hex } from 'viem';

export const ALTANA_NETWORKS: Record<number, NetworkConfig> = {
  [BNB_TESTNET.chainId]: BNB_TESTNET,
  [BNB.chainId]: BNB,
};

/** Testnet-first, matching the rest of the execution surface. */
export const DEFAULT_ALTANA_CHAIN_ID = BNB_TESTNET.chainId;

/** 0.10 $U in raw units. The same bounded amount the rest of Grabit escrows. */
export const SESSION_BUDGET_ATOMIC = BigInt('100000000000000000');
export const SESSION_SPEND_PERIOD = 'day' as const;
export const SESSION_TTL_SECONDS = 3_600;

export function altanaNetwork(chainId: number): NetworkConfig {
  const network = ALTANA_NETWORKS[chainId];
  if (!network) {
    throw new Error(
      `Altana is not configured for chain ${chainId}. Supported chains: ${Object.keys(ALTANA_NETWORKS).join(', ')}.`,
    );
  }
  return network;
}

export function isSupportedAltanaChain(chainId: number) {
  return Boolean(ALTANA_NETWORKS[chainId]);
}

type LifecycleContract = 'commerce' | 'router' | 'policy' | 'paymentToken';

type LifecycleCall = {
  contract: LifecycleContract;
  signature: string;
  purpose: string;
};

/**
 * The complete set of calls the agent is allowed to make — nothing else. Every
 * entry is one step of the ERC-8183 job lifecycle, so a session that leaks can
 * open, fund, settle, contest or refund a capped job and can do nothing else:
 * no transfers, no unbounded approvals, no other contract.
 */
const LIFECYCLE_CALLS: readonly LifecycleCall[] = [
  {
    contract: 'commerce',
    signature: 'createJob(address,address,uint256,string,address)',
    purpose: 'Open one escrowed Job against the selected Agent',
  },
  {
    contract: 'router',
    signature: 'registerJob(uint256,address)',
    purpose: 'Bind the optimistic settlement policy to that Job',
  },
  {
    contract: 'commerce',
    signature: 'setBudget(uint256,uint256,bytes)',
    purpose: 'Set the Job budget',
  },
  {
    contract: 'paymentToken',
    signature: 'approve(address,uint256)',
    purpose: 'Approve the escrow amount to the kernel',
  },
  {
    contract: 'commerce',
    signature: 'fund(uint256,uint256,bytes)',
    purpose: 'Move the approved amount into escrow',
  },
  {
    contract: 'router',
    signature: 'settle(uint256,bytes)',
    purpose: 'Release escrow after the dispute window closes',
  },
  {
    contract: 'policy',
    signature: 'dispute(uint256)',
    purpose: 'Contest a deliverable inside the dispute window',
  },
  {
    contract: 'commerce',
    signature: 'claimRefund(uint256)',
    purpose: 'Reclaim escrow when the Agent delivers nothing',
  },
];

function lifecycleTarget(chainId: number, contract: LifecycleContract): Address {
  const addresses = erc8183Addresses(chainId);
  return addresses[contract];
}

/** The on-chain-enforced permission set handed to grantSession. */
export function agentSessionPermissions(chainId: number): SessionPermissions {
  const calls: CallPermission[] = LIFECYCLE_CALLS.map((call) => ({
    signature: call.signature,
    to: lifecycleTarget(chainId, call.contract),
  }));

  return {
    calls,
    spend: [
      {
        limit: SESSION_BUDGET_ATOMIC,
        period: SESSION_SPEND_PERIOD,
        token: lifecycleTarget(chainId, 'paymentToken'),
      },
    ],
  };
}

/**
 * The same permission set, shaped for display. This is what the product shows
 * the user under "what this agent may do" — it is derived from the object that
 * is actually granted, so the screen cannot drift from the on-chain scope.
 */
export function describeSessionPermissions(chainId: number) {
  const addresses = erc8183Addresses(chainId);
  const network = altanaNetwork(chainId);
  return {
    calls: LIFECYCLE_CALLS.map((call) => ({
      signature: call.signature,
      target: lifecycleTarget(chainId, call.contract),
      contract: call.contract,
      purpose: call.purpose,
      explorerUrl: `${network.explorer}/address/${lifecycleTarget(chainId, call.contract)}`,
    })),
    spend: {
      token: addresses.paymentToken,
      tokenSymbol: chainId === BNB.chainId ? '$U' : 'test $U',
      limitAtomic: SESSION_BUDGET_ATOMIC.toString(),
      limitDisplay: `0.10 ${chainId === BNB.chainId ? '$U' : 'test $U'}`,
      period: SESSION_SPEND_PERIOD,
    },
    ttlSeconds: SESSION_TTL_SECONDS,
  };
}

function requiredPrivateKey(name: string): Hex {
  const value = process.env[name];
  if (!value) {
    throw new Error(
      `${name} is not configured. The Altana session stays UNAVAILABLE until a server-only key is set.`,
    );
  }
  if (!/^0x[0-9a-fA-F]{64}$/.test(value)) {
    throw new Error(`${name} must be a 0x-prefixed 32-byte hex private key.`);
  }
  return value as Hex;
}

/** Grants and revokes. Never handed to the agent. */
export function getAltanaAdminSigner(): Signer {
  return signerFromPrivateKey(requiredPrivateKey('GRABIT_ALTANA_ADMIN_PRIVATE_KEY'));
}

/**
 * The agent's signing key. Supplied rather than generated so the session
 * survives across stateless requests: its public key is stable, which is what
 * lets the product read the live authority back out of KeyStore and revoke it
 * later.
 */
export function getAltanaSessionSigner(): Signer {
  return signerFromPrivateKey(requiredPrivateKey('GRABIT_ALTANA_SESSION_PRIVATE_KEY'));
}

/**
 * The agent's smart-account address. Altana wallets are EIP-7702 accounts at
 * the admin signer's own address, so this is deterministic and needs no call.
 * Use it for reads; a write needs `ensureAltanaAgentWallet` first.
 */
export function getAltanaAgentWallet(): Wallet {
  return { address: getAltanaAdminSigner().address };
}

/**
 * Registers the agent's EOA with the relay as an Altana smart account, and
 * returns the wallet handle.
 *
 * The relay will not accept prepared calls for an address it has not seen
 * delegated: `prepareCalls` still returns a quote, but `sendPreparedCalls`
 * rejects the parameters. Registration signs the EIP-7702 authorization
 * digests — counterfactual, so no transaction and no gas — and is idempotent,
 * which is why every write path calls it rather than assuming an earlier run
 * did. Deriving the address alone, as the read paths do, skips this and is the
 * reason a grant could fail against a correctly funded wallet.
 */
export async function ensureAltanaAgentWallet(chainId: number): Promise<Wallet> {
  const signer = getAltanaAdminSigner();
  const address = signer.address;

  // registerAccount authorizes the admin key, and KeyStore rejects a key it
  // already holds ("KeyStore: key already registered"), so this cannot simply
  // be re-run. An account that has been through it carries EIP-7702 delegated
  // code on the EOA, which is the cheapest way to ask whether the work is
  // already done.
  const code = await altanaPublicClient(chainId)
    .getCode({ address })
    .catch(() => undefined);
  if (code && code !== '0x') return { address };

  const wallet = await altanaClient(chainId).createWallet({ signer });
  return { address: wallet.address };
}

/** Returns the reason the Altana surface is unavailable, or null when ready. */
export function altanaConfigurationError(): string | null {
  try {
    getAltanaAdminSigner();
    getAltanaSessionSigner();
    return null;
  } catch (error) {
    return error instanceof Error ? error.message : 'Altana is not configured.';
  }
}

const KEYSTORE_ABI = [
  {
    name: 'getKeys',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'user', type: 'address' }],
    outputs: [{ type: 'bytes32[]' }],
  },
  {
    name: 'isValidKey',
    type: 'function',
    stateMutability: 'view',
    inputs: [
      { name: 'user', type: 'address' },
      { name: 'keyId', type: 'bytes32' },
    ],
    outputs: [{ type: 'bool' }],
  },
] as const;

/** KeyStore v0 convention: the key id is the hash of the SEC1 public key. */
export function deriveKeyId(publicKey: Hex): Hex {
  return keccak256(publicKey);
}

/**
 * A wallet client scoped to one chain. grantSession and revokeSession are only
 * reachable through a client, so every write path builds one from the same
 * network config the reads use.
 */
export function altanaClient(chainId: number): Client {
  return createClient({ chains: [altanaNetwork(chainId)], defaultChainId: chainId });
}

export function altanaPublicClient(chainId: number) {
  const network = altanaNetwork(chainId);
  return createPublicClient({
    chain: network.chain,
    transport: http(network.publicRpcUrl, { timeout: 12_000, retryCount: 1 }),
  });
}

export type SessionAuthority = {
  chainId: number;
  walletAddress: Address;
  sessionPublicKey: Hex;
  keyId: Hex;
  /** True when KeyStore holds this key as registered, unexpired and unrevoked. */
  active: boolean;
  /** Key ids KeyStore currently lists for the wallet, session key included. */
  registeredKeyIds: readonly Hex[];
  keyStore: Address;
  keyStoreUrl: string;
  walletUrl: string;
};

/**
 * Reads the session's live authority straight from the public KeyStore — the
 * same `isValidKey` check a third-party verifier runs. Nothing here trusts
 * application state: if the grant never landed, or the key was revoked or has
 * expired, this returns active: false.
 */
export async function readSessionAuthority(chainId: number): Promise<SessionAuthority> {
  const network = altanaNetwork(chainId);
  const wallet = getAltanaAgentWallet();
  const sessionPublicKey = getAltanaSessionSigner().publicKey;
  const keyId = deriveKeyId(sessionPublicKey);
  const client = altanaPublicClient(chainId);

  const [registeredKeyIds, active] = await Promise.all([
    client.readContract({
      address: network.keyStore,
      abi: KEYSTORE_ABI,
      functionName: 'getKeys',
      args: [wallet.address],
    }),
    client.readContract({
      address: network.keyStore,
      abi: KEYSTORE_ABI,
      functionName: 'isValidKey',
      args: [wallet.address, keyId],
    }),
  ]);

  return {
    chainId,
    walletAddress: wallet.address,
    sessionPublicKey,
    keyId,
    active,
    registeredKeyIds,
    keyStore: network.keyStore,
    keyStoreUrl: `${network.explorer}/address/${network.keyStore}`,
    walletUrl: `${network.explorer}/address/${wallet.address}`,
  };
}

/**
 * The Altana smart account's own key registry. Porto stores a secp256k1 key's
 * public key as its address left-padded to 32 bytes, so the session entry is
 * matched on that and its expiry is read straight off the account.
 */
const ACCOUNT_ABI = [
  {
    name: 'getKeys',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [
      {
        name: 'keys',
        type: 'tuple[]',
        components: [
          { name: 'expiry', type: 'uint40' },
          { name: 'keyType', type: 'uint8' },
          { name: 'isSuperAdmin', type: 'bool' },
          { name: 'publicKey', type: 'bytes' },
        ],
      },
      { name: 'keyHashes', type: 'bytes32[]' },
    ],
  },
] as const;

/** Porto KeyType enum: P256=0, WebAuthnP256=1, Secp256k1=2, External=3. */
const KEY_TYPE_SECP256K1 = 2;

export type AccountSessionKey = {
  authorized: boolean;
  /** Unix seconds. 0 means the account stored the key without an expiry. */
  expiry: number;
  expiresAt: string | null;
  expired: boolean;
  secondsRemaining: number | null;
};

/**
 * Reads the session key's authorization from the agent's own account contract.
 * This is the expiry the account will actually enforce, so it is read rather
 * than remembered — a grant made by another deployment of this app still
 * reports correctly here.
 */
export async function readAccountSessionKey(chainId: number): Promise<AccountSessionKey> {
  const wallet = getAltanaAgentWallet();
  const sessionAddress = getAltanaSessionSigner().address;
  const expectedPublicKey = padHex(sessionAddress, { size: 32 }).toLowerCase();
  const client = altanaPublicClient(chainId);

  let keys: readonly { expiry: number; keyType: number; publicKey: Hex }[];
  try {
    const [entries] = await client.readContract({
      address: wallet.address,
      abi: ACCOUNT_ABI,
      functionName: 'getKeys',
    });
    keys = entries;
  } catch {
    // The account is not delegated yet, so no session can exist on it.
    return { authorized: false, expiry: 0, expiresAt: null, expired: false, secondsRemaining: null };
  }

  const match = keys.find(
    (key) =>
      key.keyType === KEY_TYPE_SECP256K1 && key.publicKey.toLowerCase() === expectedPublicKey,
  );
  if (!match) {
    return { authorized: false, expiry: 0, expiresAt: null, expired: false, secondsRemaining: null };
  }

  const expiry = Number(match.expiry);
  const now = Math.floor(Date.now() / 1000);
  const expired = expiry !== 0 && expiry <= now;
  return {
    authorized: !expired,
    expiry,
    expiresAt: expiry === 0 ? null : new Date(expiry * 1000).toISOString(),
    expired,
    secondsRemaining: expiry === 0 ? null : Math.max(0, expiry - now),
  };
}

/**
 * Rebuilds the agent's Session from the server-only key plus the account's
 * on-chain expiry. Throws unless the account currently authorizes the key, so
 * a hire can never be attempted with a revoked or expired session.
 */
export async function resolveAgentSession(chainId: number): Promise<Session> {
  const key = await readAccountSessionKey(chainId);
  if (!key.authorized) {
    throw new Error(
      key.expired
        ? 'The Altana session has expired. Grant a new session before hiring.'
        : 'No Altana session is authorized on the agent account. Grant a session first.',
    );
  }
  // The hire goes through the relay, so the account must be registered there.
  const wallet = await ensureAltanaAgentWallet(chainId);
  return {
    walletAddress: wallet.address,
    signer: getAltanaSessionSigner(),
    publicKey: getAltanaSessionSigner().publicKey,
    permissions: agentSessionPermissions(chainId),
    expiry: key.expiry,
  };
}

export function altanaNetworkSummary(chainId: number) {
  const network = altanaNetwork(chainId);
  return {
    chainId: network.chainId,
    name: network.chain.name,
    explorer: network.explorer,
    keyStore: network.keyStore,
    keyStoreController: network.keyStoreController,
    relayUrl: network.relayUrl ?? null,
    erc8183: erc8183Addresses(chainId),
  };
}
