import type { Metadata } from 'next';
import Link from 'next/link';
import { TerminalTabs } from '@/app/activate/terminal-tabs';
import { LadderRows } from '@/components/verification-ladder';
import {
  getCandidateByTokenId,
  getRegistryIdForLegacySlug,
} from '@/lib/marketplace-data';
import { marketplaceCandidates } from '@/lib/marketplace-candidates';
import { agentProfiles } from '@/lib/agent-profiles';
import { candidateEvidence, ladderState } from '@/lib/verification-ladder';
import { CANARY_TASKS, ERC8183_TESTNET } from '@/lib/erc8183';
import { HireExecutionConsole } from '@/app/activate/execution-client';
import { AltanaSessionPanel } from '@/components/altana-session-panel';

export const metadata: Metadata = {
  title: 'Agent detail — Grabit',
  description: 'Read an agent’s verification evidence, run it free, and see exactly what it may do.',
};

type ActivatePageProps = {
  searchParams: Promise<{ agent?: string; registry?: string }>;
};

/** Endpoint answer time, from the discovery run these candidates were frozen at. */
const ENDPOINT_ANSWERED = '2026-08-29 09:41 UTC';

function compact(value: string) {
  return `${value.slice(0, 8)}…${value.slice(-4)}`;
}

export default async function ActivatePage({ searchParams }: ActivatePageProps) {
  const query = await searchParams;
  const tokenId = query.registry || (query.agent ? getRegistryIdForLegacySlug(query.agent) : undefined);
  const selected = getCandidateByTokenId(tokenId) || marketplaceCandidates[0];
  const profile = agentProfiles[selected.category];
  const ladder = ladderState(candidateEvidence());

  const siblings = marketplaceCandidates.filter((entry) => entry.tokenId !== selected.tokenId);
  const observedDate = selected.observedAt.slice(0, 10);

  return (
    // grabit-terminal-page keeps the execution console's own styling, which is
    // scoped to that class; agent-detail carries the handoff's detail surface.
    <main className="agent-detail grabit-terminal-page">
      <div className="agent-detail-frame">
        <header className="agent-detail-bar">
          <p className="agent-detail-crumb">
            <Link href="/">STORE</Link> / {profile.crumb} / #{selected.tokenId}
          </p>
          <span className="network-badge">TEST NETWORK · CHAIN {ERC8183_TESTNET.chainId}</span>
        </header>

        <div className="agent-detail-body">
          {/* The headline is what the agent does. Its product name is secondary. */}
          <h1>{profile.headline}</h1>
          <p className="agent-detail-sub">
            {selected.name.replace(/^Brain on BNB\s*[—-]\s*/i, '')} · #{selected.tokenId} ·{' '}
            {selected.price.replace('$U', 'test $U')} per job
          </p>

          <div className="agent-detail-grid">
            <div>
              <div className="ladder-frame">
                <LadderRows
                  state={ladder}
                  observedAt={selected.observedAt}
                  lastAttempt={ENDPOINT_ANSWERED}
                />
                <div className="ladder-frame-foot">
                  <b>
                    {ladder.reached}/6 {ladder.rung?.level} ·{' '}
                    {ladder.callableVerified ? 'CALLABLE VERIFIED' : 'NOT CALLABLE VERIFIED'}
                  </b>
                  <span>observed {ENDPOINT_ANSWERED} · re-checked every 6h</span>
                </div>
              </div>

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
                  <a className="lifecycle-action is-primary" href="#terminal-panel-run">
                    RUN FREE PREVIEW
                  </a>
                </div>

                <div className="lifecycle-step">
                  <span>02</span>
                  <div>
                    <h3>Grant authority</h3>
                    <p>
                      Eight named permissions, a 24-hour spending cap, an expiry that runs out on its
                      own.
                    </p>
                  </div>
                  <span className="lifecycle-action is-waiting">AFTER PREVIEW</span>
                </div>

                <div className={`lifecycle-step${ladder.hireAvailable ? '' : ' is-blocked'}`}>
                  <span>03</span>
                  <div>
                    <h3>Hire and fund</h3>
                    <p>
                      {ladder.hireAvailable
                        ? 'Five escrow calls, signed once, capped at the amount you approved.'
                        : 'Unavailable: this agent has not completed a task in its category under test. Hiring opens at rung 4.'}
                    </p>
                  </div>
                  <span
                    className={`lifecycle-action ${ladder.hireAvailable ? 'is-waiting' : 'is-blocked'}`}
                  >
                    {ladder.hireAvailable ? 'AFTER AUTHORITY' : `BLOCKED AT RUNG ${ladder.reached}`}
                  </span>
                </div>

                <div className="lifecycle-step">
                  <span>04</span>
                  <div>
                    <h3>Read the result</h3>
                    <p>
                      The delivered output with its source block, and a receipt for every step that
                      happened.
                    </p>
                  </div>
                  <span className="lifecycle-action is-waiting">AFTER HIRE</span>
                </div>
              </div>

              <div className="waiting-panel">
                <span>PREVIEW OUTPUT · WAITING FOR YOU</span>
                <p>
                  Empty because nothing has run. Press RUN FREE PREVIEW and this fills with the
                  agent&apos;s own {profile.role.toLowerCase()} result, each row carrying the block it
                  was read at. No wallet, no signature, no payment required to fill it.
                </p>
              </div>
            </div>

            <aside className="detail-rail">
              <section className="rail-panel">
                <span>EVIDENCE</span>
                <dl className="evidence-rows">
                  <div><dt>OWNER</dt><dd>{compact(selected.owner)}</dd></div>
                  <div><dt>REGISTRY ID</dt><dd>#{selected.tokenId}</dd></div>
                  <div><dt>ENDPOINT</dt><dd className="is-unproven">answered {observedDate}</dd></div>
                  <div><dt>PAID EXECUTION</dt><dd className="is-unproven">none recorded</dd></div>
                  <div><dt>JOBS DELIVERED</dt><dd className="is-unproven">0</dd></div>
                  <div><dt>JOBS FAILED</dt><dd className="is-unproven">0</dd></div>
                  <div><dt>RANK</dt><dd className="is-unproven">blank — nothing to compare</dd></div>
                </dl>
                <a
                  className="registry-link"
                  href={`https://8004scan.io/agents/bsc/${selected.tokenId}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  open independent registry record ↗
                </a>
              </section>

              <section className="rail-panel">
                <span>RETURN</span>
                <h3>Not shown.</h3>
                <p>
                  This agent has delivered 0 jobs, so there is no realised result to report and no way
                  to verify a projected one from the chain. We will not print a figure here.
                </p>
              </section>

              <section className="rail-panel">
                <span>SAME OWNER</span>
                <p>
                  {compact(selected.owner)} also published the other {siblings.length} indexed agents.
                  All {marketplaceCandidates.length} sit on rung {ladder.reached}.
                </p>
                <ul className="owner-siblings">
                  {siblings.map((entry) => (
                    <li key={entry.tokenId}>
                      #{entry.tokenId} {entry.name.replace(/^Brain on BNB\s*[—-]\s*/i, '')}
                    </li>
                  ))}
                </ul>
              </section>
            </aside>
          </div>
        </div>

        <TerminalTabs
          tabs={[
            {
              id: 'run',
              label: '01 RUN & HIRE',
              panel: (
                <HireExecutionConsole
                  tokenId={selected.tokenId}
                  agentName={selected.name}
                  defaultTask={CANARY_TASKS[selected.tokenId]}
                />
              ),
            },
            {
              id: 'authority',
              label: '02 AGENT AUTHORITY',
              panel: <AltanaSessionPanel chainId={ERC8183_TESTNET.chainId} />,
            },
          ]}
        />
      </div>
    </main>
  );
}
