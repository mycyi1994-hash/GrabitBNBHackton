'use client';

/**
 * Agent detail, study 2b — dense two-pane.
 *
 * The decision is on the left and the evidence permanently beside it, so the
 * whole screen fits without scrolling. There is exactly one primary action:
 * running the agent free. The steps after it are visible but plainly not yet
 * available, each carrying the reason rather than a greyed button.
 */
import Link from 'next/link';
import { useCallback, useState } from 'react';
import { LadderGate } from '@/components/verification-ladder';
import type { LadderState } from '@/lib/verification-ladder';

type PreviewResult = {
  verdict?: string;
  summary?: string;
  metrics?: Array<{ label?: string; value?: string; note?: string }>;
  evidence?: { sourceBlock?: string; observedAt?: string; gasPriceGwei?: string };
};

export type DetailAgent = {
  tokenId: string;
  crumb: string;
  name: string;
  headline: string;
  price: string;
  owner: string;
  observedAt: string;
  demoTask: string;
  siblings: Array<{ tokenId: string; name: string }>;
};

/** Three of the eight permissions, enough to judge the shape of the rest. */
const PEEK = [
  { mark: 'MAY', text: 'Open one escrowed job against this agent, and move the approved amount into escrow when it starts.' },
  { mark: 'MAY', text: 'Release the escrow after the dispute window closes, or contest the deliverable inside it.' },
  { mark: 'NEVER', text: 'Raise its own cap, extend its own expiry, or pay an address you did not name.' },
] as const;

export function AgentDetail({
  agent,
  ladder,
  chainId,
  explorerUrl,
}: {
  agent: DetailAgent;
  ladder: LadderState;
  chainId: number;
  explorerUrl: string;
}) {
  const [preview, setPreview] = useState<PreviewResult | null>(null);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const runPreview = useCallback(async () => {
    setRunning(true);
    setError(null);
    try {
      const response = await fetch(
        `/api/hire/strategy-preview?registry=${encodeURIComponent(agent.tokenId)}&task=${encodeURIComponent(agent.demoTask)}`,
        { cache: 'no-store' },
      );
      const payload = (await response.json()) as { result?: PreviewResult; error?: string };
      if (!response.ok || !payload.result) {
        throw new Error(payload.error || 'The agent did not return a result.');
      }
      setPreview(payload.result);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'The preview failed.');
    } finally {
      setRunning(false);
    }
  }, [agent.demoTask, agent.tokenId]);

  return (
    <div className="detail-2b">
      <div className="detail-2b-left">
        <h1>{agent.headline}</h1>
        <p className="detail-2b-price">
          {agent.price} per job · fixed · charged in test $U on chain {chainId}
        </p>

        <LadderGate
          state={ladder}
          observedAt={agent.observedAt}
          summary={`${ladder.rung?.shown ?? ''} No completed task in its category under test, no paid execution, no track record.`}
        />

        <div className="lifecycle">
          <div className="lifecycle-step is-now">
            <span>01</span>
            <div>
              <h3>See what it returns, free</h3>
              <p>
                Run it against live test-network data and read its actual output. No wallet, no
                signature, no payment.
              </p>
            </div>
            <button
              type="button"
              className="lifecycle-action is-primary"
              onClick={() => void runPreview()}
              disabled={running}
            >
              {running ? 'RUNNING…' : preview ? 'RUN AGAIN' : 'RUN FREE PREVIEW'}
            </button>
          </div>

          <div className="lifecycle-step">
            <span>02</span>
            <div>
              <h3>Grant authority</h3>
              <p>Eight named permissions, a 24-hour spending cap, an expiry that runs out on its own.</p>
            </div>
            <Link className="lifecycle-action is-waiting" href="/authority">
              REVIEW FIRST
            </Link>
          </div>

          <div className={`lifecycle-step${ladder.hireAvailable ? '' : ' is-blocked'}`}>
            <span>03</span>
            <div>
              <h3>Hire and fund</h3>
              <p>
                {ladder.hireAvailable
                  ? 'Five escrow calls, signed once by the session key, capped at the amount you approved.'
                  : 'Unavailable: this agent has not completed a task in its category under test. Hiring opens at rung 4.'}
              </p>
            </div>
            <span className={`lifecycle-action ${ladder.hireAvailable ? 'is-waiting' : 'is-blocked'}`}>
              {ladder.hireAvailable ? 'AFTER AUTHORITY' : `BLOCKED AT RUNG ${ladder.reached}`}
            </span>
          </div>

          <div className="lifecycle-step">
            <span>04</span>
            <div>
              <h3>Read the result</h3>
              <p>The delivered output with its source block, and a receipt for every step that happened.</p>
            </div>
            <span className="lifecycle-action is-waiting">AFTER HIRE</span>
          </div>
        </div>

        {preview ? (
          <div className="preview-result">
            <span>PREVIEW OUTPUT · READ FROM CHAIN</span>
            <h3>{preview.verdict ?? 'Result'}</h3>
            <p>{preview.summary}</p>
            {preview.metrics?.length ? (
              <dl className="preview-metrics">
                {preview.metrics.slice(0, 4).map((metric) => (
                  <div key={metric.label}>
                    <dt>{metric.label}</dt>
                    <dd>{metric.value}</dd>
                  </div>
                ))}
              </dl>
            ) : null}
            <p className="preview-source">
              source block {preview.evidence?.sourceBlock ?? 'unknown'} · read{' '}
              {preview.evidence?.observedAt?.slice(11, 19) ?? '—'} UTC · no wallet, no signature, no
              payment
            </p>
          </div>
        ) : (
          <div className="detail-2b-panels">
            <div className="waiting-panel">
              <span>PREVIEW OUTPUT · WAITING FOR YOU</span>
              <p>
                {error ?? 'Empty because nothing has run. No wallet, no signature, no payment required to fill it.'}
              </p>
            </div>
            <div className="waiting-panel is-return">
              <span>RETURN · NOT SHOWN</span>
              <p>0 delivered jobs. No realised result exists and a projected one cannot be verified from the chain.</p>
            </div>
          </div>
        )}
      </div>

      <aside className="detail-2b-right">
        <section className="rail-panel">
          <span>EVIDENCE</span>
          <dl className="evidence-rows">
            <div><dt>OWNER</dt><dd>{agent.owner}</dd></div>
            <div><dt>REGISTRY ID</dt><dd>#{agent.tokenId}</dd></div>
            <div><dt>ENDPOINT</dt><dd className="is-unproven">answered {agent.observedAt.slice(0, 10)}</dd></div>
            <div><dt>PAID EXECUTION</dt><dd className="is-unproven">none recorded</dd></div>
            <div><dt>JOBS DELIVERED</dt><dd className="is-unproven">0</dd></div>
            <div><dt>JOBS FAILED</dt><dd className="is-unproven">0</dd></div>
            <div><dt>RANK</dt><dd className="is-unproven">blank — nothing to compare</dd></div>
          </dl>
          <a
            className="registry-link"
            href={`https://8004scan.io/agents/bsc/${agent.tokenId}`}
            target="_blank"
            rel="noreferrer"
          >
            registry record ↗
          </a>
        </section>

        <section className="rail-panel">
          <span>WHAT IT WILL BE ABLE TO DO</span>
          <p className="peek-intro">
            Eight permissions, a 24-hour cap and an expiry — all published to the public registry.
            You see them in full before anything is signed.
          </p>
          <div className="peek-list">
            {PEEK.map((entry) => (
              <div className="peek-row" key={entry.text}>
                <span className={entry.mark === 'MAY' ? 'is-may' : 'is-never'}>{entry.mark}</span>
                <p>{entry.text}</p>
              </div>
            ))}
          </div>
          <Link className="authority-cta" href="/authority">
            <b>
              SEE ALL 11 PERMISSIONS
              <small>8 it may use · 3 it never can · and revoke</small>
            </b>
            <span aria-hidden="true">→</span>
          </Link>
        </section>

        <section className="rail-panel">
          <span>SAME OWNER</span>
          <p className="peek-intro">
            {agent.owner} also published the other {agent.siblings.length} indexed agents. All{' '}
            {agent.siblings.length + 1} sit on rung {ladder.reached}.
          </p>
          <ul className="owner-siblings">
            {agent.siblings.map((entry) => (
              <li key={entry.tokenId}>
                #{entry.tokenId} {entry.name}
              </li>
            ))}
          </ul>
          <a className="peek-more" href={explorerUrl} target="_blank" rel="noreferrer">
            open the test explorer ↗
          </a>
        </section>
      </aside>
    </div>
  );
}
