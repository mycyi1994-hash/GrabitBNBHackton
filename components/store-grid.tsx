/**
 * The store, in the two tiers the handoff specifies.
 *
 * Callable-verified agents come first. That tier is empty today — no candidate
 * has completed a task in its own category under test — so it states what it is
 * waiting for rather than rendering nothing. The tier below carries everything
 * stopped short of rung 4, each naming the exact check that stopped it, because
 * showing them is what proves the ladder is real.
 */
import Link from 'next/link';
import { LadderBar } from '@/components/verification-ladder';
import { DISCOVERED_RUNG, ladderState, type LadderState } from '@/lib/verification-ladder';

export type StoreAgent = {
  tokenId: string;
  crumb: string;
  name: string;
  job: string;
  price: string;
  observedAt: string;
};

export type StoreDiscovered = {
  tokenId: string;
  category: string;
  name: string;
  level: string;
  blocker: string;
  observedAt: string;
};

function AgentCard({
  agent,
  ladder,
  onPreview,
  running,
}: {
  agent: StoreAgent;
  ladder: LadderState;
  onPreview: (tokenId: string) => void;
  running: boolean;
}) {
  return (
    <article className="agent-card">
      <p className="agent-card-top">
        <span>{agent.crumb}</span>
        <span>#{agent.tokenId}</span>
      </p>
      <h3>
        <Link href={`/activate?registry=${agent.tokenId}`}>{agent.name}</Link>
      </h3>
      <p className="agent-card-job">{agent.job}</p>
      <LadderBar state={ladder} observedAt={agent.observedAt} scale="card" />
      <div className="agent-card-foot">
        <span className="agent-card-price">{agent.price}</span>
        {/* Preview is reachable from the first screen, with no wallet. */}
        <button
          className="agent-card-cta"
          type="button"
          disabled={running}
          onClick={() => onPreview(agent.tokenId)}
        >
          {running ? 'RUNNING…' : 'PREVIEW FREE'}
        </button>
      </div>
      <p className="agent-card-note">0 jobs delivered · nothing to rank</p>
    </article>
  );
}

export function StoreGrid({
  agents,
  discovered,
  onPreview,
  runningTokenId,
}: {
  agents: StoreAgent[];
  discovered: StoreDiscovered[];
  onPreview: (tokenId: string) => void;
  runningTokenId: string | null;
}) {
  const ladder = ladderState({
    identityRegistered: true,
    metadataValid: true,
    endpointReachable: true,
    taskDelivered: false,
    jobSettled: false,
    trackRecorded: false,
  });

  return (
    <div className="store-inner">
      <section className="store-tier">
        <header className="store-tier-head">
          <h2>CALLABLE VERIFIED · RUNG 4 AND ABOVE</h2>
          <p>Agents that have completed a real task in their own category under test.</p>
        </header>
        <div className="store-empty-tier">
          <span>EMPTY · WAITING ON A DELIVERED TASK</span>
          <p>
            No indexed agent has reached rung 4 yet. The four below are online and priced, and each
            can be run free right now — but none has completed a category task under test, so none
            can be hired. This tier fills the moment one does.
          </p>
        </div>
      </section>

      <section className="store-tier">
        <header className="store-tier-head">
          <h2>INDEXED · RUNG 3, REACHABLE</h2>
          <p>Identity, metadata and endpoint confirmed. Capability is not yet shown.</p>
        </header>
        <div className="store-grid">
          {agents.map((agent) => (
            <AgentCard
              key={agent.tokenId}
              agent={agent}
              ladder={ladder}
              onPreview={onPreview}
              running={runningTokenId === agent.tokenId}
            />
          ))}
        </div>
      </section>

      {discovered.length ? (
        <section className="store-tier">
          <header className="store-tier-head">
            <h2>STOPPED BELOW RUNG 4 · {discovered.length} FOUND</h2>
            <p>
              Registration is cheap. These are shown, not hidden, so the check that stopped each one
              is on the record. They carry no price and cannot be run.
            </p>
          </header>
          <div className="store-grid">
            {discovered.map((entry) => {
              const rung = DISCOVERED_RUNG[entry.level] ?? 1;
              const state = ladderState({
                identityRegistered: rung >= 1,
                metadataValid: rung >= 2,
                endpointReachable: rung >= 3,
                taskDelivered: false,
                jobSettled: false,
                trackRecorded: false,
              });
              return (
                <article className="agent-card stopped-card" key={entry.tokenId}>
                  <p className="agent-card-top">
                    <span>{entry.category.toUpperCase()}</span>
                    <span>#{entry.tokenId}</span>
                  </p>
                  <h3>{entry.name}</h3>
                  <LadderBar state={state} observedAt={entry.observedAt} scale="card" />
                  <div className="stopped-check">
                    <b>STOPPED AT RUNG {state.stoppedAt?.step ?? rung + 1}</b>
                    <p>{entry.blocker}</p>
                  </div>
                  <p className="agent-card-note">
                    <a
                      href={`https://8004scan.io/agents/bsc/${entry.tokenId}`}
                      target="_blank"
                      rel="noreferrer"
                    >
                      registry record ↗
                    </a>
                  </p>
                </article>
              );
            })}
          </div>
        </section>
      ) : null}
    </div>
  );
}
