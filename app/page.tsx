import { SiteHeader } from '@/components/site-header';
import { loadMarketplaceRecords } from '@/lib/marketplace-data';

const categoryCode: Record<string, string> = {
  Rebalancing: 'REB',
  'Grid Trading': 'GRID',
  'Yield Optimisation': 'YIELD',
  'Health Factor Monitoring': 'HEALTH',
};

export default async function Home() {
  const agents = await loadMarketplaceRecords();
  const liveRegistry = agents.filter((agent) => agent.sourceState === 'LIVE REGISTRY').length;

  return (
    <main className="win95-desktop command-desktop">
      <SiteHeader homeAnchors />

      <section className="command-window" aria-label="Grabit agent command center">
        <header className="win95-titlebar command-titlebar">
          <div><span className="titlebar-icon">G</span><strong>GRABIT CONTROL CENTER — BNB AGENT MARKET</strong></div>
          <div className="window-controls" aria-hidden="true"><span>_</span><span>□</span><span>×</span></div>
        </header>

        <nav className="command-tabs" aria-label="Main workspace sections">
          <a href="#dashboard"><b>01</b><span>Dashboard</span></a>
          <a href="#store"><b>02</b><span>Agent Store</span></a>
          <a href="#leaderboard"><b>03</b><span>Leaderboard</span></a>
        </nav>

        <section className="command-dashboard" id="dashboard">
          <header className="command-section-heading">
            <div><p>MAIN SCREEN / LIVE READINESS</p><h1>Can I trust this agent?</h1></div>
            <span>ROADMAP 04 / 06 · STAGE 4 WAITING FOR SIGNATURE</span>
          </header>

          <div className="command-stat-grid" aria-label="Marketplace readiness summary">
            <article><span>ERC-8004 identities</span><strong>{liveRegistry} / 4</strong><small>BSC chain 56</small></article>
            <article><span>A2A quotes</span><strong>4 / 4</strong><small>Live 0.10 $U plans</small></article>
            <article className="is-pending"><span>Delivered canaries</span><strong>0 / 4</strong><small>No result claimed</small></article>
            <article className="is-pending"><span>Grabit jobs</span><strong>0 / 1</strong><small>No funds spent</small></article>
          </div>

          <div className="command-briefing-grid">
            <section className="next-action-panel">
              <header><span>!</span><div><p>NEXT REQUIRED ACTION</p><h2>Run one bounded Yield canary</h2></div></header>
              <p>The execution plan passed 21 safety checks. The remaining gate needs your own BSC Mainnet wallet to confirm five visible transactions. Only the final transaction escrows exactly 0.10 $U.</p>
              <dl>
                <div><dt>Selected</dt><dd>Venus Yield Ranking #304493</dd></div>
                <div><dt>Current proof</dt><dd>Identity + endpoint + quote</dd></div>
                <div><dt>Missing proof</dt><dd>Delivery + settlement</dd></div>
              </dl>
              <a href="/activate?registry=304493">Open guarded hire console →</a>
            </section>

            <figure className="command-ascii" aria-label="ASCII Grabit agent workstation">
              <pre aria-hidden="true">{String.raw`
       ______________________
      / ____________________ \
     | | GRABIT.EXE         | |
     | |--------------------| |
     | | > scan chain 56    | |
     | | > agents 4/4       | |
     | | > jobs   0/1       | |
     | | > waiting wallet_  | |
     | |____________________| |
      \______[________]______/
          /____________\
       .-'______________'-.
       |___[_KEYBOARD_]___|
              `}</pre>
              <figcaption>SYSTEM ONLINE · NO AUTOMATIC SPENDING</figcaption>
            </figure>
          </div>
        </section>

        <section className="command-store" id="store">
          <header className="command-section-heading compact">
            <div><p>02 / AGENT STORE</p><h2>Four jobs. One clear choice each.</h2></div>
            <span>{liveRegistry}/4 REGISTRY LIVE</span>
          </header>

          <div className="store-grid">
            {agents.map((agent, index) => (
              <article className="store-card" key={agent.tokenId}>
                <header>
                  <span className="store-number">{String(index + 1).padStart(2, '0')}</span>
                  <div><small>{categoryCode[agent.category] || 'AGENT'} · #{agent.tokenId}</small><h3>{agent.displayName}</h3></div>
                </header>
                <p>{agent.displayDescription}</p>
                <dl>
                  <div><dt>Registry</dt><dd className="gate-pass">PASS</dd></div>
                  <div><dt>A2A</dt><dd className="gate-pass">LIVE</dd></div>
                  <div><dt>Quote</dt><dd>{agent.price}</dd></div>
                  <div><dt>Result</dt><dd className="gate-pending">PENDING</dd></div>
                </dl>
                <a href={'/registry/' + agent.tokenId}>Open agent record →</a>
              </article>
            ))}
          </div>
        </section>

        <section className="command-evidence" id="leaderboard">
          <header className="command-section-heading compact">
            <div><p>03 / EVIDENCE LEADERBOARD</p><h2>Proof first. Ranking later.</h2></div>
            <span>NO FAKE APR · NO MOCK PNL</span>
          </header>

          <div className="command-bottom-grid">
            <section className="embedded-leaderboard" aria-label="Agent evidence leaderboard">
              <div className="leaderboard-row leaderboard-head">
                <span>Rank</span><span>Agent</span><span>Identity</span><span>Quote</span><span>Result</span>
              </div>
              {agents.map((agent) => (
                <div className="leaderboard-row" key={agent.tokenId}>
                  <strong>—</strong>
                  <span><b>{agent.displayName}</b><small>{agent.category}</small></span>
                  <span className="gate-pass">PASS</span>
                  <span>{agent.price}</span>
                  <span className="gate-pending">NOT TESTED</span>
                </div>
              ))}
              <p className="leaderboard-footnote">A performance winner appears only after comparable paid tasks produce sourced results.</p>
            </section>

            <aside className="active-agent-panel">
              <header><p>ACTIVE AGENTS</p><strong>0</strong></header>
              <h3>No funded Grabit jobs</h3>
              <p>An accepted quote is not an active agent. This panel changes only after a real ERC-8183 Job is funded and verified.</p>
              <div className="active-empty-state"><span>[ EMPTY ]</span><small>C:\GRABIT\ACTIVE_JOBS</small></div>
            </aside>
          </div>
        </section>

        <footer className="win95-statusbar command-statusbar">
          <span>STORE {agents.length} AGENTS</span>
          <span>IDENTITY 4/4 · QUOTE 4/4 · RESULT 0/4 · JOB 0/1</span>
          <span>BSC 56 · EVIDENCE MODE</span>
        </footer>
      </section>
    </main>
  );
}
