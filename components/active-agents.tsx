'use client';

/**
 * Active agents — what is running, what it may spend, what it delivered.
 *
 * Three panels, each with its own empty state that names who has to act, and
 * an explicit stale state where a value could not be refreshed. Under them the
 * eight-stage job lifecycle, so a user can point at where their job is and
 * reach the receipt for every step that has happened.
 */
import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';

type SessionSnapshot = {
  state: 'ACTIVE' | 'ACTIVE_UNREGISTERED' | 'NOT_GRANTED' | 'EXPIRED' | 'UNAVAILABLE';
  reason?: string;
  observedAt?: string;
  agent?: { walletAddress: string; walletUrl: string };
  session?: { secondsRemaining: number | null; registeredInKeyStore: boolean; keyStoreUrl: string };
  permissions?: { calls: unknown[]; spend: { limitDisplay: string; period: string } };
};

/** The lifecycle a funded job walks, in order. */
const STAGES = [
  'create',
  'agree terms',
  'set budget',
  'fund escrow',
  'work',
  'deliver',
  'complete or dispute',
  'settle or refund',
];

function remaining(seconds: number | null | undefined) {
  if (seconds === null || seconds === undefined) return null;
  if (seconds <= 0) return 'expired';
  const minutes = Math.floor(seconds / 60);
  return minutes < 60 ? `${minutes} minutes left` : `${Math.floor(minutes / 60)}h ${minutes % 60}m left`;
}

export function ActiveAgents({ hireHref }: { hireHref: string }) {
  const [snapshot, setSnapshot] = useState<SessionSnapshot | null>(null);

  const load = useCallback(async () => {
    try {
      const response = await fetch('/api/altana/session?chainId=97', { cache: 'no-store' });
      setSnapshot((await response.json()) as SessionSnapshot);
    } catch {
      setSnapshot({ state: 'UNAVAILABLE', reason: 'The authority could not be read.' });
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(timer);
  }, [load]);

  const state = snapshot?.state ?? 'UNAVAILABLE';
  const live = state === 'ACTIVE' || state === 'ACTIVE_UNREGISTERED';
  const left = remaining(snapshot?.session?.secondsRemaining);

  return (
    <section className="store-surface" id="grabit-active" aria-labelledby="active-title">
      <div className="store-inner">
        <header className="store-tier-head">
          <h2 id="active-title">MY ACTIVE AGENTS</h2>
          <p>Authority you have granted, jobs you have funded, and results that have been delivered.</p>
        </header>

        <div className="active-panels">
          <article className="active-panel">
            <span>LIVE AUTHORITY</span>
            <strong>{live ? '1' : '0'}</strong>
            {live && snapshot?.permissions ? (
              <p>
                {snapshot.permissions.calls.length} allowed calls, capped at{' '}
                {snapshot.permissions.spend.limitDisplay} per {snapshot.permissions.spend.period}.{' '}
                {left}.
              </p>
            ) : (
              <>
                <p>No session key currently holds authority on the agent wallet.</p>
                <p className="active-waiting">
                  {state === 'UNAVAILABLE'
                    ? 'Waiting on Grabit operations: the server-side agent key is not configured. This is not something you can fix.'
                    : 'Waiting on you: grant a session on the agent detail screen. It costs nothing and expires on its own.'}
                </p>
              </>
            )}
            {snapshot?.observedAt ? (
              <p className="active-stale">read {snapshot.observedAt.slice(11, 19)} UTC</p>
            ) : null}
          </article>

          <article className="active-panel">
            <span>FUNDED JOBS</span>
            <strong>0</strong>
            <p>
              No ERC-8183 job has been funded from this marketplace. The earlier testnet
              self-transfer was an activation proof, and the provider&apos;s own job{' '}
              <code>#56657</code> has the provider operator as its client.
            </p>
            <p className="active-waiting">
              Waiting on the ladder: hiring opens once an agent completes a category task under test
              and reaches rung 4.
            </p>
          </article>

          <article className="active-panel">
            <span>DELIVERED RESULTS</span>
            <strong>0</strong>
            <p>
              Results appear here once a funded job reaches SUBMITTED and its deliverable is read
              back from chain. Read-only previews are never recorded here.
            </p>
            <p className="active-stale">nothing to show · no job has been funded</p>
          </article>
        </div>

        <header className="store-tier-head" style={{ marginTop: 40 }}>
          <h2>JOB LIFECYCLE</h2>
          <p>Every completed step reaches its transaction receipt. Nothing has started.</p>
        </header>

        <ol className="lifecycle-strip" aria-label="Job lifecycle">
          {STAGES.map((stage, index) => (
            <li className="lifecycle-stage" key={stage}>
              <span>{String(index + 1).padStart(2, '0')}</span>
              <b>{stage}</b>
            </li>
          ))}
        </ol>

        <p className="board-note">
          <Link href={hireHref}>Open the testnet terminal ↗</Link> to run an agent free, or grant it
          a scoped session.
        </p>
      </div>
    </section>
  );
}
