import { loadMarketplaceRecords } from '@/lib/marketplace-data';

const categoryCode: Record<string, string> = {
  Rebalancing: 'REBALANCE',
  'Grid Trading': 'GRID',
  'Yield Optimisation': 'YIELD',
  'Health Factor Monitoring': 'HEALTH',
};

export default async function Home() {
  const agents = await loadMarketplaceRecords();
  const liveRegistry = agents.filter((agent) => agent.sourceState === 'LIVE REGISTRY').length;

  return (
    <main className="ascii-home">
      <section className="ascii-shell" aria-label="Grabit BNB Agent Market">
        <header className="ascii-topline">
          <strong>GRABIT://BNB_AGENT_MARKET</strong>
          <span>CHAIN 56 [ONLINE]</span>
        </header>

        <nav className="ascii-nav" aria-label="Main sections">
          <a href="#dashboard">[/] DASHBOARD</a>
          <a href="#store">[S] STORE</a>
          <a href="#leaderboard">[L] LEADERBOARD</a>
          <a href="/activate?registry=304493">[ENTER] TEST AGENT</a>
        </nav>

        <section className="ascii-summary" id="dashboard" aria-label="System summary">
          <span>AGENTS <b>{liveRegistry}/4 LIVE</b></span>
          <span>QUOTES <b>4/4 READY</b></span>
          <span>RESULTS <b>0/4 TESTED</b></span>
          <span>JOBS <b>0 ACTIVE</b></span>
        </section>

        <div className="ascii-home-grid">
          <section className="ascii-panel ascii-store-panel" id="store">
            <header>
              <span>+-- AGENT STORE --+</span>
              <small>SELECT ONE JOB</small>
            </header>

            <div className="ascii-agent-list">
              {agents.map((agent, index) => (
                <a
                  className={agent.tokenId === '304493' ? 'ascii-agent-row is-selected' : 'ascii-agent-row'}
                  href={'/activate?registry=' + agent.tokenId}
                  key={agent.tokenId}
                >
                  <span className="ascii-row-index">{agent.tokenId === '304493' ? '>' : ' '}{String(index + 1).padStart(2, '0')}</span>
                  <span>
                    <b>{agent.displayName}</b>
                    <small>{categoryCode[agent.category] || 'AGENT'} · ERC-8004 #{agent.tokenId}</small>
                  </span>
                  <span className="ascii-row-proof">ID:PASS<br />A2A:LIVE</span>
                  <strong>{agent.price}</strong>
                  <span className="ascii-open-label">[OPEN]</span>
                </a>
              ))}
            </div>
          </section>

          <div className="ascii-side-stack">
            <section className="ascii-panel ascii-leader-panel" id="leaderboard">
              <header>
                <span>+-- EVIDENCE LEADERBOARD --+</span>
                <small>NO MOCK PNL</small>
              </header>

              <div className="ascii-leader-head">
                <span>#</span><span>AGENT</span><span>PROOF</span>
              </div>
              {agents.map((agent, index) => (
                <a className="ascii-leader-row" href={'/activate?registry=' + agent.tokenId} key={agent.tokenId}>
                  <span>{String(index + 1).padStart(2, '0')}</span>
                  <span><b>{categoryCode[agent.category]}</b><small>{agent.displayName}</small></span>
                  <span>QUOTE<br /><b>READY</b></span>
                </a>
              ))}
            </section>

            <section className="ascii-panel ascii-next-panel">
              <header>
                <span>+-- NEXT COMMAND --+</span>
                <small>TESTNET 97</small>
              </header>
              <pre aria-hidden="true">{String.raw`
  $ select yield_agent
  $ preview live_rates
  $ connect testnet_wallet
  $ hire --limit 0.10_USD
  _`}</pre>
              <p>Preview first. Sign only visible Testnet transactions. No Mainnet funds.</p>
              <a href="/activate?registry=304493">[ENTER] RUN YIELD AGENT</a>
            </section>
          </div>
        </div>

        <footer className="ascii-footer">
          <span>IDENTITY 4/4 · QUOTE 4/4 · RESULT 0/4</span>
          <span>ESC BACK · ↑↓ SELECT · ENTER OPEN</span>
        </footer>
      </section>
    </main>
  );
}
