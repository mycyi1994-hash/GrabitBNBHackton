'use client';

/**
 * What this Agent may do, and the control to take it away.
 *
 * Every value on this panel is read back from chain through /api/altana/session
 * — the account's own key list for the enforced expiry, and the Altana KeyStore
 * for public verifiability. When the session is not configured or not granted,
 * the panel says so instead of showing a permission the Agent does not hold.
 */
import { useCallback, useEffect, useState } from 'react';

type PermissionCall = {
  signature: string;
  target: string;
  contract: string;
  purpose: string;
  explorerUrl: string;
};

type SessionStatus = {
  state: 'ACTIVE' | 'ACTIVE_UNREGISTERED' | 'NOT_GRANTED' | 'EXPIRED' | 'UNAVAILABLE';
  reason?: string;
  observedAt?: string;
  network?: {
    chainId: number;
    name: string;
    explorer: string;
    keyStore: string;
  };
  agent?: { walletAddress: string; walletUrl: string };
  session?: {
    publicKey: string;
    keyId: string;
    authorizedOnAccount: boolean;
    expiresAt: string | null;
    secondsRemaining: number | null;
    expired: boolean;
    registeredInKeyStore: boolean;
    keyStoreUrl: string;
  };
  permissions?: {
    calls: PermissionCall[];
    spend: { limitDisplay: string; period: string; token: string };
    ttlSeconds: number;
  };
};

const STATE_LABEL: Record<SessionStatus['state'], string> = {
  ACTIVE: 'SESSION ACTIVE',
  ACTIVE_UNREGISTERED: 'ACTIVE · NOT IN KEYSTORE',
  NOT_GRANTED: 'NO SESSION GRANTED',
  EXPIRED: 'SESSION EXPIRED',
  UNAVAILABLE: 'UNAVAILABLE',
};

function compact(value: string) {
  return value.length > 14 ? `${value.slice(0, 8)}…${value.slice(-4)}` : value;
}

function countdown(seconds: number | null) {
  if (seconds === null) return 'no expiry';
  if (seconds <= 0) return 'expired';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ${seconds % 60}s left`;
  return `${Math.floor(minutes / 60)}h ${minutes % 60}m left`;
}

export function AltanaSessionPanel({ chainId = 97 }: { chainId?: number }) {
  const [status, setStatus] = useState<SessionStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<'grant' | 'revoke' | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const response = await fetch(`/api/altana/session?chainId=${chainId}`, { cache: 'no-store' });
      setStatus((await response.json()) as SessionStatus);
    } catch (error) {
      setStatus({
        state: 'UNAVAILABLE',
        reason: error instanceof Error ? error.message : 'The Altana session could not be read.',
      });
    } finally {
      setLoading(false);
    }
  }, [chainId]);

  // Deferred to a timeout, as elsewhere in this codebase, so the first read
  // does not set state synchronously inside the effect.
  useEffect(() => {
    const timer = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(timer);
  }, [load]);

  const reread = useCallback(() => {
    setLoading(true);
    void load();
  }, [load]);

  const act = useCallback(
    async (action: 'grant' | 'revoke') => {
      setBusy(action);
      setNotice(
        action === 'grant'
          ? 'Granting a session on chain. This confirms on-chain and can take up to a minute.'
          : 'Revoking the session on chain.',
      );
      try {
        const response = await fetch('/api/altana/session', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ action, chainId }),
        });
        const payload = (await response.json()) as {
          error?: string;
          reason?: string;
          transactionUrl?: string | null;
        };
        if (!response.ok) throw new Error(payload.error || payload.reason || `The ${action} failed.`);
        setNotice(
          payload.transactionUrl
            ? `${action === 'grant' ? 'Session granted' : 'Session revoked'} — ${payload.transactionUrl}`
            : `${action === 'grant' ? 'Session granted' : 'Session revoked'}.`,
        );
        await load();
      } catch (error) {
        setNotice(error instanceof Error ? error.message : `The ${action} failed.`);
      } finally {
        setBusy(null);
      }
    },
    [chainId, load],
  );

  const state = status?.state ?? 'UNAVAILABLE';
  const live = state === 'ACTIVE' || state === 'ACTIVE_UNREGISTERED';

  return (
    <section className="grabit-altana" aria-labelledby="grabit-altana-title">
      <header className="grabit-altana-head">
        <div>
          <p className="grabit-altana-kicker">AGENT AUTHORITY / ALTANA SESSION KEY</p>
          <h2 id="grabit-altana-title">What this Agent may do</h2>
        </div>
        <span className={`grabit-altana-state is-${live ? 'live' : 'off'}`}>
          <i aria-hidden="true" />
          {loading ? 'READING CHAIN…' : STATE_LABEL[state]}
        </span>
      </header>

      {status?.reason ? (
        <p className="grabit-altana-reason">
          <b>UNAVAILABLE</b> {status.reason}
        </p>
      ) : null}

      {status?.agent && status.session ? (
        <dl className="grabit-altana-facts">
          <div>
            <dt>AGENT WALLET</dt>
            <dd>
              <a href={status.agent.walletUrl} target="_blank" rel="noreferrer">
                {compact(status.agent.walletAddress)} ↗
              </a>
            </dd>
          </div>
          <div>
            <dt>SESSION KEY</dt>
            <dd>{compact(status.session.keyId)}</dd>
          </div>
          <div>
            <dt>EXPIRY</dt>
            <dd>{countdown(status.session.secondsRemaining)}</dd>
          </div>
          <div>
            <dt>PUBLIC KEYSTORE</dt>
            <dd>
              <a href={status.session.keyStoreUrl} target="_blank" rel="noreferrer">
                {status.session.registeredInKeyStore ? 'VERIFIABLE ↗' : 'NOT REGISTERED ↗'}
              </a>
            </dd>
          </div>
        </dl>
      ) : null}

      {status?.permissions ? (
        <>
          <p className="grabit-altana-cap">
            <b>SPEND CAP</b> {status.permissions.spend.limitDisplay} per{' '}
            {status.permissions.spend.period} · everything outside this list reverts on-chain
          </p>
          <ul className="grabit-altana-calls">
            {status.permissions.calls.map((call) => (
              <li key={`${call.contract}:${call.signature}`}>
                <code>{call.signature}</code>
                <span>{call.purpose}</span>
                <a href={call.explorerUrl} target="_blank" rel="noreferrer">
                  {call.contract} · {compact(call.target)} ↗
                </a>
              </li>
            ))}
          </ul>
        </>
      ) : null}

      <footer className="grabit-altana-actions">
        <button
          type="button"
          onClick={() => void act('grant')}
          disabled={busy !== null || state === 'UNAVAILABLE'}
        >
          {busy === 'grant' ? 'GRANTING…' : live ? 'RE-GRANT SESSION' : 'GRANT SESSION'}
        </button>
        <button
          type="button"
          className="is-revoke"
          onClick={() => void act('revoke')}
          disabled={busy !== null || !live}
        >
          {busy === 'revoke' ? 'REVOKING…' : 'REVOKE SESSION'}
        </button>
        <button type="button" className="is-ghost" onClick={reread} disabled={busy !== null}>
          RE-READ CHAIN
        </button>
      </footer>

      {notice ? <p className="grabit-altana-notice">{notice}</p> : null}
    </section>
  );
}
