import { SiteHeader } from '@/components/site-header';
import { agents } from '@/lib/agents';
import { getLiveBscAgents, type RegistryAgent } from '@/lib/scan8004';

const categories = [
  ['[R]', 'Rebalancing'],
  ['[G]', 'Grid Trading'],
  ['[Y]', 'Yield Optimisation'],
  ['[H]', 'Health Factor'],
];

type DisplayAgent = {
  id: string;
  name: string;
  description: string;
  owner: string;
  service: string;
  updated: string;
  href: string;
  live: boolean;
};

function toDisplayAgent(agent: RegistryAgent): DisplayAgent {
  return {
    id: '#' + agent.token_id,
    name: agent.name || 'Unnamed BSC Agent',
    description: agent.description || 'No description published in the registry.',
    owner: agent.owner_address.slice(0, 8) + '...' + agent.owner_address.slice(-4),
    service: agent.supported_protocols[0] || (agent.x402_supported ? 'X402' : 'Custom'),
    updated: new Date(agent.updated_at).toISOString().slice(0, 10),
    href: '/registry/' + agent.token_id,
    live: true,
  };
}

function fallbackAgents(): DisplayAgent[] {
  return agents.slice(0, 2).map((agent) => ({
    id: agent.identity.split('#')[1] ? '#' + agent.identity.split('#')[1] : 'DEMO',
    name: agent.name,
    description: agent.tagline,
    owner: agent.wallet,
    service: agent.protocol,
    updated: 'DEMO RECORD',
    href: '/agents/' + agent.slug,
    live: false,
  }));
}

export default async function Home() {
  let rows = fallbackAgents();
  let total = 0;
  let connected = false;

  try {
    const registry = await getLiveBscAgents(2, 'PancakeSwap DeFi agent');
    if (registry.items.length) {
      rows = registry.items.map(toDisplayAgent);
      total = registry.total;
      connected = true;
    }
  } catch {
    connected = false;
  }

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
          <a href="/compare">Compare</a>
          <label><span>Address</span><input readOnly value="C:\BNB\AGENTS" aria-label="Current folder" /></label>
        </div>

        <div className="win95-window-body">
          <aside className="win95-tree">
            <h2>All Agent Types</h2>
            <ul>
              {categories.map(([icon, name]) => <li key={name}><span>{icon}</span>{name}</li>)}
            </ul>
            <div className={'registry-box ' + (connected ? 'is-live' : 'is-demo')}>
              <span className="registry-light" />
              <div><strong>8004scan</strong><small>{connected ? 'CONNECTED / BSC 56' : 'OFFLINE / DEMO MODE'}</small></div>
            </div>
          </aside>

          <section className="win95-folder">
            <header className="folder-heading">
              <div>
                <p>BNB SMART CHAIN / ERC-8004</p>
                <h1>Registered agents</h1>
              </div>
              <span>{connected ? total.toLocaleString() + ' records' : 'fallback records'}</span>
            </header>

            <div className="win95-agent-list">
              {rows.map((agent, index) => (
                <article className="win95-agent-row" key={agent.id + agent.name}>
                  <span className="file-icon">{String(index + 1).padStart(2, '0')}</span>
                  <div className="file-main">
                    <h2>{agent.name}</h2>
                    <p>{agent.description}</p>
                  </div>
                  <dl>
                    <div><dt>ID</dt><dd>{agent.id}</dd></div>
                    <div><dt>Service</dt><dd>{agent.service}</dd></div>
                    <div><dt>Owner</dt><dd>{agent.owner}</dd></div>
                  </dl>
                  <a href={agent.href}>Open</a>
                </article>
              ))}
            </div>

            <div className="win95-actions">
              <a href="/compare">Compare reference agents</a>
              <a href="/activate?agent=range-pilot">Run activation demo</a>
            </div>
          </section>
        </div>

        <footer className="win95-statusbar">
          <span>{rows.length} object(s)</span>
          <span>{connected ? 'LIVE DATA / ' + rows[0]?.updated : 'PROTOTYPE FALLBACK'}</span>
          <span>BNB CHAIN ID: 56</span>
        </footer>
      </section>
    </main>
  );
}
