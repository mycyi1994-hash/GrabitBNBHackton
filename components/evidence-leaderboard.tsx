/**
 * Evidence leaderboard, rendered inside the main workspace.
 *
 * Rank stays blank on purpose. Identity, a reachable endpoint and an accepted
 * quote are the only gates any candidate has passed, and none of them is a
 * performance claim, so there is nothing to order these four by yet.
 */
type LeaderboardAgent = {
  tokenId: string;
  name: string;
  category: string;
  price: string;
  endpointVerified: boolean | null;
};

type DiscoveredRow = {
  category: string;
  tokenId: string;
  name: string;
  level: string;
  blocker: string;
};

type VerificationGate = {
  identityRegistered: boolean;
  endpointReachable: boolean;
  quoteAccepted: boolean;
  taskDelivered: boolean;
  jobSettled: boolean;
};

function gateCount(agents: LeaderboardAgent[], passed: boolean) {
  return `${passed ? agents.length : 0} / ${agents.length}`;
}

export function EvidenceLeaderboard({
  agents,
  gate,
  ownerConcentration,
  discovered,
}: {
  agents: LeaderboardAgent[];
  gate: VerificationGate;
  ownerConcentration: number;
  discovered: DiscoveredRow[];
}) {
  const gates = [
    ['IDENTITY', gateCount(agents, gate.identityRegistered), 'ERC-8004 records on chain 56'],
    ['ENDPOINT', gateCount(agents, gate.endpointReachable), 'A2A endpoint reached during preflight'],
    ['QUOTE', gateCount(agents, gate.quoteAccepted), '0.10 $U quote accepted'],
    ['DELIVERED', gateCount(agents, gate.taskDelivered), 'No paid task result recorded yet'],
  ] as const;

  return (
    <section className="grabit-board" id="grabit-leaderboard" aria-labelledby="grabit-board-title">
      <header className="grabit-board-head">
        <div>
          <p className="grabit-section-kicker">EVIDENCE LEADERBOARD</p>
          <h2 id="grabit-board-title">Rank proof, not promises.</h2>
          <p className="grabit-board-lede">
            Performance ranks stay blank until the same paid canary task has delivered for every
            category.
          </p>
        </div>
        <span className="grabit-board-pill">BSC · CHAIN 56</span>
      </header>

      <div className="grabit-board-gates">
        {gates.map(([label, value, note], index) => (
          <article className={index < 3 ? 'is-passed' : 'is-pending'} key={label}>
            <span>
              {String(index + 1).padStart(2, '0')} / {String(gates.length).padStart(2, '0')}
            </span>
            <strong>{value}</strong>
            <h3>{label}</h3>
            <p>{note}</p>
          </article>
        ))}
      </div>

      <div className="grabit-board-table" role="table" aria-label="Agent verification leaderboard">
        <div className="grabit-board-row is-head" role="row">
          <span role="columnheader">RANK</span>
          <span role="columnheader">AGENT / CATEGORY</span>
          <span role="columnheader">REGISTRY</span>
          <span role="columnheader">A2A</span>
          <span role="columnheader">QUOTE</span>
          <span role="columnheader">RESULT</span>
          <span role="columnheader">EVIDENCE</span>
        </div>
        {agents.map((agent) => (
          <div className="grabit-board-row" role="row" key={agent.tokenId}>
            <strong className="is-unranked" role="cell">
              —
            </strong>
            <div role="cell">
              <strong>{agent.name}</strong>
              <small>
                {agent.category} · #{agent.tokenId}
              </small>
            </div>
            <span className="is-pass" role="cell">
              PASS
            </span>
            <span className={agent.endpointVerified === false ? 'is-pending' : 'is-pass'} role="cell">
              {agent.endpointVerified === false ? 'UNVERIFIED' : 'REACHABLE'}
            </span>
            <span role="cell">{agent.price}</span>
            <span className="is-pending" role="cell">
              NOT TESTED
            </span>
            <a role="cell" href={`/registry/${agent.tokenId}`}>
              OPEN ↗
            </a>
          </div>
        ))}
      </div>

      {ownerConcentration > 1 ? (
        <p className="grabit-board-warning" role="note">
          <span aria-hidden="true">!</span>
          <b>No performance winner yet.</b> These {ownerConcentration} identities share one provider
          wallet. Identity, reachability and a quote do not prove return, drawdown, uptime or result
          quality.
        </p>
      ) : null}

      {discovered.length ? (
        <details className="grabit-board-discovered">
          <summary>
            <b>DISCOVERED · NOT ELIGIBLE</b>
            <small>
              {discovered.length} further BSC identities, and the exact check that stopped each
            </small>
          </summary>
          <p>
            Registration is cheap: 8004scan listed 288,128 BSC registrations when these were
            observed. What separates the four above is the endpoint and negotiation checks, not the
            registration. These carry no price and cannot be hired. Several would qualify if their
            owner fixed the endpoint.
          </p>
          <ul>
            {discovered.map((row) => (
              <li key={row.tokenId}>
                <div>
                  <strong>{row.name}</strong>
                  <small>
                    {row.category} · #{row.tokenId}
                  </small>
                </div>
                <span className="grabit-board-level">{row.level}</span>
                <p>{row.blocker}</p>
                <a
                  href={`https://8004scan.io/agents/bsc/${row.tokenId}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  8004SCAN ↗
                </a>
              </li>
            ))}
          </ul>
        </details>
      ) : null}
    </section>
  );
}
