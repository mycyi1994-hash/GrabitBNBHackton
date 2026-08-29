import type { Metadata } from 'next';
import { PrototypeNote } from '@/components/prototype-note';
import { SiteHeader } from '@/components/site-header';
import { loadMarketplaceRecords } from '@/lib/marketplace-data';

export const metadata: Metadata = {
  title: 'Agent evidence board — Agent Market',
  description: 'Compare BSC DeFi agents by registry, endpoint, quote and delivered-task evidence.',
};

const gateSummary = [
  ['Identity', '4 / 4', 'ERC-8004 records on chain 56'],
  ['Endpoint', '4 / 4', 'A2A endpoint reached during preflight'],
  ['Quote', '4 / 4', '0.10 $U quote accepted'],
  ['Delivered', '0 / 4', 'No paid task result recorded yet'],
];

export default async function ComparePage() {
  const agents = await loadMarketplaceRecords();

  return (
    <main className="subpage evidence-page">
      <SiteHeader active="compare" />
      <div className="compare-shell evidence-shell">
        <PrototypeNote />
        <header className="compare-hero evidence-hero">
          <p className="eyebrow">Evidence leaderboard</p>
          <h1>Rank proof,<br /><span>not promises.</span></h1>
          <p>Performance ranks stay blank until the same paid canary task has delivered for every category.</p>
        </header>

        <section className="evidence-gates" aria-label="Verification gate summary">
          {gateSummary.map(([label, value, note], index) => (
            <article className={index < 3 ? 'is-passed' : 'is-pending'} key={label}>
              <span>0{index + 1} / 04</span>
              <strong>{value}</strong>
              <h2>{label}</h2>
              <p>{note}</p>
            </article>
          ))}
        </section>

        <section className="evidence-board">
          <header className="panel-heading">
            <div><p className="eyebrow">Comparable evidence</p><h2>Four required categories</h2></div>
            <span className="protocol-pill">BSC · CHAIN 56</span>
          </header>
          <div className="evidence-table" role="table" aria-label="Agent verification leaderboard">
            <div className="evidence-row evidence-table-head" role="row">
              <span role="columnheader">Rank</span>
              <span role="columnheader">Agent / category</span>
              <span role="columnheader">Registry</span>
              <span role="columnheader">A2A</span>
              <span role="columnheader">Quote</span>
              <span role="columnheader">Result</span>
              <span role="columnheader">Evidence</span>
            </div>
            {agents.map((agent) => (
              <div className="evidence-row" role="row" key={agent.tokenId}>
                <strong className="unranked" role="cell">—</strong>
                <div role="cell">
                  <strong>{agent.displayName}</strong>
                  <small>{agent.category} · #{agent.tokenId}</small>
                </div>
                <span className="gate-pass" role="cell">PASS</span>
                <span className="gate-pass" role="cell">REACHABLE</span>
                <span role="cell">{agent.price}</span>
                <span className="gate-pending" role="cell">NOT TESTED</span>
                <a role="cell" href={'/registry/' + agent.tokenId}>Open</a>
              </div>
            ))}
          </div>
        </section>

        <section className="evidence-warning" role="note">
          <span>!</span>
          <div>
            <strong>No performance winner yet.</strong>
            <p>These four identities share one provider. Identity, reachability and a quote do not prove return, drawdown, uptime or result quality.</p>
          </div>
        </section>
      </div>
    </main>
  );
}
