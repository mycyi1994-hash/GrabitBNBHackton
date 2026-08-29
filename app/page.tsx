/* eslint-disable @next/next/no-html-link-for-pages */
import { SiteHeader } from '@/components/site-header';
import { loadMarketplaceRecords } from '@/lib/marketplace-data';

const categories = [
  ['[R]', 'Rebalancing'],
  ['[G]', 'Grid Trading'],
  ['[Y]', 'Yield Optimisation'],
  ['[H]', 'Health Factor'],
];

export default async function Home() {
  const rows = await loadMarketplaceRecords();
  const available = rows.filter((row) => row.sourceState === 'LIVE REGISTRY').length;

  return (
    <main className="win95-desktop">
      <SiteHeader />

      <div className="win95-shortcuts" aria-label="Desktop shortcuts">
        <a href="#agent-window"><span className="shortcut-icon">A:\</span><b>Agent Explorer</b></a>
        <a href="/dashboard"><span className="shortcut-icon">W:\</span><b>My Wallet</b></a>
      </div>

      <section className="win95-window" id="agent-window" aria-label="BNB Agent Explorer">
        <header className="win95-titlebar">
          <div><span className="titlebar-icon">A</span><strong>BNB Agent Explorer</strong></div>
          <div className="window-controls" aria-hidden="true"><span>_</span><span>□</span><span>×</span></div>
        </header>

        <nav className="win95-menubar" aria-label="Application menu">
          <span><u>F</u>ile</span><span><u>E</u>dit</span><span><u>V</u>iew</span><span><u>A</u>gent</span><span><u>H</u>elp</span>
        </nav>

        <div className="win95-toolbar">
          <a href="/">← Back</a>
          <a href="/compare">Leaderboard</a>
          <label><span>Address</span><input readOnly value="C:\BNB\AGENTS" aria-label="Current folder" /></label>
        </div>

        <div className="win95-window-body">
          <aside className="win95-tree">
            <h2>All Agent Types</h2>
            <ul>
              {categories.map(([icon, name]) => <li key={name}><span>{icon}</span>{name}</li>)}
            </ul>
            <figure className="ascii-workstation" aria-label="ASCII Agent Market workstation">
              <pre aria-hidden="true">{String.raw`
 .------------------.
/  AGENT MARKET 98 /|
+-----------------+ |
| C:\> scan_8004  | |
| [BSC] [ONLINE]   |/
+-----------------+
     |  |   |  |
  .--+--+---+--+--.
  | [_KEYBOARD__] |
  '---------------'
              `}</pre>
              <figcaption>LOCAL AGENT WORKSTATION</figcaption>
            </figure>
            <div className={'registry-box ' + (available === 4 ? 'is-live' : 'is-demo')}>
              <span className="registry-light" />
              <div><strong>8004scan + A2A</strong><small>{available === 4 ? '4/4 PREFLIGHT / BSC 56' : available + '/4 LIVE · SNAPSHOT FALLBACK'}</small></div>
            </div>
          </aside>

          <section className="win95-folder">
            <header className="folder-heading">
              <div>
                <p>BNB SMART CHAIN / ERC-8004</p>
                <h1>Four required categories</h1>
              </div>
              <span>{available}/4 source-backed identities</span>
            </header>

            <div className="win95-agent-list">
              {rows.map((agent, index) => (
                <article className="win95-agent-row" key={agent.id + agent.name}>
                  <span className="file-icon">{String(index + 1).padStart(2, '0')}</span>
                  <div className="file-main">
                    <h2>{agent.displayName}</h2>
                    <p>{agent.displayDescription}</p>
                    <small>{agent.sourceState} · {agent.serviceId} · PREFLIGHT ONLY</small>
                  </div>
                  <dl>
                    <div><dt>ID</dt><dd>#{agent.tokenId}</dd></div>
                    <div><dt>Category</dt><dd>{agent.category}</dd></div>
                    <div><dt>Quote</dt><dd>{agent.price}</dd></div>
                    <div><dt>Owner</dt><dd>{agent.displayOwner}</dd></div>
                  </dl>
                  <a href={'/registry/' + agent.tokenId}>Evidence</a>
                </article>
              ))}
            </div>

            <div className="win95-actions">
              <a href="https://8004scan.io/agents?chain=56" target="_blank" rel="noreferrer">Open BSC registry</a>
              <a href="https://agent.brainonbnb.com/.well-known/agent-card.json" target="_blank" rel="noreferrer">Inspect A2A Agent Card</a>
            </div>
          </section>
        </div>

        <footer className="win95-statusbar">
          <span>{rows.length} category candidate(s)</span>
          <span>{available}/4 REGISTRY · NEGOTIATED 4/4 · DELIVERED 0/4</span>
          <span>BNB CHAIN ID: 56 · NO MOCK FALLBACK</span>
        </footer>
      </section>
    </main>
  );
}
