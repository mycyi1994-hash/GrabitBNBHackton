'use client';

/**
 * Active Agents.
 *
 * Two things can be live for a user here: an authority they have granted, and a
 * job they have funded. Authority is read from chain through the Altana session
 * route; jobs are not tracked yet, so that half states its blocker rather than
 * rendering an empty list that implies one could appear.
 */
import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';

type SessionSnapshot = {
  state: 'ACTIVE' | 'ACTIVE_UNREGISTERED' | 'NOT_GRANTED' | 'EXPIRED' | 'UNAVAILABLE';
  reason?: string;
  agent?: { walletAddress: string; walletUrl: string };
  session?: { secondsRemaining: number | null; registeredInKeyStore: boolean; keyStoreUrl: string };
  permissions?: { calls: unknown[]; spend: { limitDisplay: string; period: string } };
};

const AUTHORITY_LABEL: Record<SessionSnapshot['state'], string> = {
  ACTIVE: 'GRANTED',
  ACTIVE_UNREGISTERED: 'GRANTED · UNREGISTERED',
  NOT_GRANTED: 'NONE GRANTED',
  EXPIRED: 'EXPIRED',
  UNAVAILABLE: 'UNAVAILABLE',
};

function remaining(seconds: number | null | undefined) {
  if (seconds === null || seconds === undefined) return '—';
  if (seconds <= 0) return 'expired';
  const minutes = Math.floor(seconds / 60);
  return minutes < 60 ? `${minutes}m left` : `${Math.floor(minutes / 60)}h ${minutes % 60}m left`;
}

export function ActiveAgents({ hireHref }: { hireHref: string }) {
  const [snapshot, setSnapshot] = useState<SessionSnapshot | null>(null);

  const load = useCallback(async () => {
    try {
      const response = await fetch('/api/altana/session?chainId=97', { cache: 'no-store' });
      setSnapshot((await response.json()) as SessionSnapshot);
    } catch {
      setSnapshot({ state: 'UNAVAILABLE', reason: 'The session authority could not be read.' });
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(timer);
  }, [load]);

  const state = snapshot?.state ?? 'UNAVAILABLE';
  const granted = state === 'ACTIVE' || state === 'ACTIVE_UNREGISTERED';

  return (
    <section className="grabit-active" id="grabit-active" aria-labelledby="grabit-active-title">
      <header className="grabit-active-head">
        <div>
          <p className="grabit-section-kicker">MY ACTIVE AGENTS</p>
          <h2 id="grabit-active-title">What is running for you</h2>
        </div>
        <span className="grabit-board-pill">BSC TESTNET · CHAIN 97</span>
      </header>

      <div className="grabit-active-grid">
        <article className={`grabit-active-card ${granted ? 'is-live' : ''}`}>
          <p className="grabit-active-kind">AGENT AUTHORITY</p>
          <strong>{snapshot ? AUTHORITY_LABEL[state] : 'READING CHAIN…'}</strong>
          {granted && snapshot?.permissions ? (
            <p>
              {snapshot.permissions.calls.length} allowed calls ·{' '}
              {snapshot.permissions.spend.limitDisplay} per {snapshot.permissions.spend.period} ·{' '}
              {remaining(snapshot.session?.secondsRemaining)}
            </p>
          ) : (
            <p>
              {snapshot?.reason ??
                'No Altana session key currently holds authority on the agent wallet.'}
            </p>
          )}
          <footer>
            <Link href={hireHref}>
              {granted ? 'REVIEW OR REVOKE ↗' : 'OPEN SESSION CONTROLS ↗'}
            </Link>
            {snapshot?.session?.keyStoreUrl ? (
              <a href={snapshot.session.keyStoreUrl} target="_blank" rel="noreferrer">
                KEYSTORE ↗
              </a>
            ) : null}
          </footer>
        </article>

        <article className="grabit-active-card">
          <p className="grabit-active-kind">FUNDED JOBS</p>
          <strong>0</strong>
          <p>
            No ERC-8183 Job has been funded from this marketplace. The earlier testnet self-transfer
            was an activation proof, and the provider&apos;s own job <code>#56657</code> has the
            provider operator as its client. Neither counts as a Grabit hire.
          </p>
          <footer>
            <Link href={hireHref}>OPEN TESTNET TERMINAL ↗</Link>
          </footer>
        </article>

        <article className="grabit-active-card">
          <p className="grabit-active-kind">DELIVERED RESULTS</p>
          <strong>0</strong>
          <p>
            Results appear here once a funded Job reaches SUBMITTED and its deliverable is read back
            from chain. Read-only previews are not results and are never recorded here.
          </p>
          <footer>
            <Link href="/dashboard">VERIFICATION DASHBOARD ↗</Link>
          </footer>
        </article>
      </div>
    </section>
  );
}
