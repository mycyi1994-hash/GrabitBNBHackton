'use client';

/**
 * Agent authority — what this agent may do, and the control to take it away.
 *
 * Built to the design handoff: the cap, the expiry as time remaining, and the
 * public-verification link across the top; then every permission in plain
 * language with its technical form as secondary detail; then revoke, repeated
 * at the bottom because revoking is not a failure state.
 *
 * Every value is read back from chain through /api/altana/session. Where a
 * session has not been granted the page still states the scope a grant would
 * carry, so the reader can judge it before authorising anything.
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
  network?: { chainId: number; explorer: string; keyStore: string };
  agent?: { walletAddress: string; walletUrl: string };
  session?: {
    publicKey: string;
    keyId: string;
    authorizedOnAccount: boolean;
    expiresAt: string | null;
    secondsRemaining: number | null;
    expired: boolean;
    registeredInKeyStore: boolean;
    validInKeyStore?: boolean;
    keyStoreUrl: string;
  };
  permissions?: {
    calls: PermissionCall[];
    spend: { limitDisplay: string; period: string; token: string };
    gas?: { limitDisplay: string; period: string; token: string };
    ttlSeconds: number;
  };
};

/** The bounds the allowlist and the cap imply, stated as prohibitions. */
const NEVER = [
  'Raise its own cap, extend its own expiry, or grant itself another permission.',
  'Move funds to an address you did not name, or call a contract outside the list above.',
  'Keep acting after the expiry, or after you revoke — the account rejects it on chain.',
];

function remaining(seconds: number | null | undefined) {
  if (seconds === null || seconds === undefined) return null;
  if (seconds <= 0) return 'expired';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} minute${minutes === 1 ? '' : 's'} left`;
  return `${Math.floor(minutes / 60)}h ${minutes % 60}m left`;
}

export function AltanaSessionPanel({ chainId = 97 }: { chainId?: number }) {
  const [status, setStatus] = useState<SessionStatus | null>(null);
  const [busy, setBusy] = useState<'grant' | 'revoke' | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const response = await fetch(`/api/altana/session?chainId=${chainId}`, { cache: 'no-store' });
      setStatus((await response.json()) as SessionStatus);
    } catch (error) {
      setStatus({
        state: 'UNAVAILABLE',
        reason: error instanceof Error ? error.message : 'The session could not be read.',
      });
    }
  }, [chainId]);

  useEffect(() => {
    const timer = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(timer);
  }, [load]);

  // Expiry is shown as time remaining, so it has to keep counting down.
  useEffect(() => {
    if (!status?.session?.secondsRemaining) return;
    const timer = window.setInterval(() => void load(), 60_000);
    return () => window.clearInterval(timer);
  }, [load, status?.session?.secondsRemaining]);

  const act = useCallback(
    async (action: 'grant' | 'revoke') => {
      setBusy(action);
      setNotice(
        action === 'grant'
          ? 'Granting on chain. This confirms on chain and can take up to a minute.'
          : 'Revoking on chain.',
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
            ? `${action === 'grant' ? 'Granted' : 'Revoked'} — ${payload.transactionUrl}`
            : `${action === 'grant' ? 'Granted' : 'Revoked'}.`,
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
  const permissions = status?.permissions;
  const ttlMinutes = permissions ? Math.round(permissions.ttlSeconds / 60) : 60;
  const left = remaining(status?.session?.secondsRemaining);
  const elapsedShare =
    live && status?.session?.secondsRemaining && permissions
      ? Math.max(0, Math.min(1, status.session.secondsRemaining / permissions.ttlSeconds))
      : 0;

  return (
    <section className="authority-surface" aria-labelledby="authority-title">
      <h2 id="authority-title" className="authority-title">
        What this agent may do
      </h2>
      <p className="authority-lede">
        {live
          ? 'A session key is active on the agent wallet. These are its exact limits, read back from chain.'
          : 'No session is active. These are the exact limits a grant would carry — read them before authorising anything.'}
      </p>

      <div className="authority-cards">
        <article className="authority-card">
          <span>SPENDING CAP</span>
          <p className="authority-figure">{permissions?.spend.limitDisplay ?? '—'}</p>
          <p>
            In any 24 hours, on the payment token only. It resets at 00:00 UTC and does not roll
            over. Nothing the agent does can raise it.
          </p>
          {permissions?.gas ? (
            <p>
              Separately, up to {permissions.gas.limitDisplay} a day for its own transaction fees.
              A key that pays for its own execution needs a gas allowance, and that allowance is
              bounded for the same reason the budget is.
            </p>
          ) : null}
          <p className="authority-source">
            source · allowance in the session permission ·{' '}
            {status?.observedAt ? `read ${status.observedAt.slice(11, 16)} UTC` : 'not read'}
          </p>
        </article>

        <article className="authority-card">
          <span>EXPIRY</span>
          <p className="authority-figure">{live ? (left ?? '—') : `${ttlMinutes} minutes`}</p>
          <div className="expiry-bar" role="img" aria-label={left ?? 'not granted'}>
            <i style={{ width: `${Math.round(elapsedShare * 100)}%` }} />
          </div>
          <p>
            {live
              ? 'The account stops accepting this key when the time runs out. No action needed to end it.'
              : `A grant lasts ${ttlMinutes} minutes and then expires on its own, whether or not anyone revokes it.`}
          </p>
        </article>

        <article className="authority-card">
          <span>PUBLIC VERIFICATION</span>
          <p className="authority-figure">
            {status?.session?.validInKeyStore
              ? 'Verifiable'
              : status?.session?.registeredInKeyStore
                ? 'Published, not current'
                : 'Not registered'}
          </p>
          <p>
            Permissions are published to the Altana KeyStore, a registry anyone can read. You do not
            have to take our word for what this agent may do.
          </p>
          {status?.session?.registeredInKeyStore && !status?.session?.validInKeyStore ? (
            <p>
              The registry carries this key from an earlier grant. Registration is permanent; what
              lapsed is the grant behind it. A new grant makes it current again without publishing
              it twice.
            </p>
          ) : null}
          {status?.session?.keyStoreUrl ? (
            <a className="registry-link" href={status.session.keyStoreUrl} target="_blank" rel="noreferrer">
              open the public registry ↗
            </a>
          ) : null}
        </article>
      </div>

      {status?.reason ? (
        <p className="authority-unavailable">
          <b>UNAVAILABLE</b> {status.reason}
        </p>
      ) : null}

      {permissions ? (
        <>
          <h3 className="authority-subhead">
            {live ? 'It may' : 'It would be allowed to'}
          </h3>
          <div className="permission-grid">
            {permissions.calls.map((call) => (
              <div className="permission-row" key={`${call.contract}:${call.signature}`}>
                <span className="permission-mark is-may">MAY</span>
                <div>
                  <p>{call.purpose}.</p>
                  <code>
                    {call.signature} · {call.contract}
                  </code>
                </div>
              </div>
            ))}
          </div>

          <h3 className="authority-subhead">It never can</h3>
          <div className="permission-grid">
            {NEVER.map((line) => (
              <div className="permission-row" key={line}>
                <span className="permission-mark is-never">NEVER</span>
                <div>
                  <p>{line}</p>
                </div>
              </div>
            ))}
          </div>
        </>
      ) : null}

      <div className="authority-actions">
        <button
          type="button"
          className="authority-button is-primary"
          onClick={() => void act('grant')}
          disabled={busy !== null || state === 'UNAVAILABLE'}
        >
          {busy === 'grant' ? 'GRANTING…' : live ? 'RE-GRANT SESSION' : 'GRANT SESSION'}
        </button>
        <button
          type="button"
          className="authority-button is-revoke"
          onClick={() => void act('revoke')}
          disabled={busy !== null || !live}
        >
          {busy === 'revoke' ? 'REVOKING…' : 'REVOKE SESSION'}
        </button>
        <button type="button" className="authority-button" onClick={() => void load()} disabled={busy !== null}>
          RE-READ CHAIN
        </button>
      </div>

      {notice ? <p className="authority-notice">{notice}</p> : null}

      <div className="revoke-panel">
        <h3>Revoking is not a failure state.</h3>
        <p>
          Ending a session is an ordinary thing to do — when you are finished, when you want to
          change the limits, or for no reason at all. It takes effect on the next block, and you can
          grant a new session immediately afterwards.
        </p>
        <div className="authority-actions">
          <button
            type="button"
            className="authority-button is-revoke"
            onClick={() => void act('revoke')}
            disabled={busy !== null || !live}
          >
            {busy === 'revoke' ? 'REVOKING…' : 'REVOKE SESSION'}
          </button>
        </div>
      </div>
    </section>
  );
}
