import type { Metadata } from 'next';
import { PrototypeNote } from '@/components/prototype-note';
import { SiteHeader } from '@/components/site-header';
import { loadMarketplaceRecords } from '@/lib/marketplace-data';

export const metadata: Metadata = {
  title: 'Verification dashboard — Agent Market',
  description: 'Track registry coverage, A2A preflight and real execution readiness for four BSC agent categories.',
};

export default async function DashboardPage() {
  const agents = await loadMarketplaceRecords();
  const liveRegistry = agents.filter((agent) => agent.sourceState === 'LIVE REGISTRY').length;

  return (
    <main className="subpage dashboard-page">
      <SiteHeader active="dashboard" />
      <div className="dashboard-shell evidence-shell">
        <PrototypeNote />
        <header className="dashboard-header evidence-dashboard-header">
          <div>
            <p className="eyebrow">Verification control centre</p>
            <h1>What is actually working?</h1>
            <p>The dashboard separates live identity evidence from work that still needs a funded onchain test.</p>
          </div>
          <a className="primary-button" href="/compare">Open leaderboard <span>→</span></a>
        </header>

        <section className="portfolio-grid readiness-grid" aria-label="Project readiness">
          <div><span>Registry identities</span><strong>{liveRegistry} / 4</strong><small>8004scan · BSC 56</small></div>
          <div><span>A2A negotiation</span><strong>4 / 4</strong><small>Accepted quote observed</small></div>
          <div><span>Delivered tasks</span><strong className="pending-value">0 / 4</strong><small>Paid canaries required</small></div>
          <div><span>Onchain jobs</span><strong className="pending-value">0 / 1</strong><small>ERC-8183 settlement required</small></div>
        </section>

        <div className="dashboard-grid verification-dashboard-grid">
          <section className="dashboard-panel">
            <header className="panel-heading">
              <div><p className="eyebrow">Agent readiness</p><h2>Execution queue</h2></div>
              <span className="protocol-pill">HIRES LOCKED</span>
            </header>
            <div className="readiness-list">
              {agents.map((agent, index) => (
                <article className="readiness-row" key={agent.tokenId}>
                  <span className="readiness-number">{String(index + 1).padStart(2, '0')}</span>
                  <div>
                    <h3>{agent.displayName}</h3>
                    <p>{agent.category} · service {agent.serviceId}</p>
                  </div>
                  <dl>
                    <div><dt>Identity</dt><dd className="gate-pass">PASS</dd></div>
                    <div><dt>Endpoint</dt><dd className="gate-pass">PASS</dd></div>
                    <div><dt>Quote</dt><dd className="gate-pass">{agent.price}</dd></div>
                    <div><dt>Result</dt><dd className="gate-pending">PENDING</dd></div>
                  </dl>
                  <a href={'/registry/' + agent.tokenId}>Evidence</a>
                </article>
              ))}
            </div>
          </section>

          <aside className="dashboard-sidebar verification-sidebar">
            <section className="managed-agent-card empty-agent-card">
              <p className="eyebrow">Active agents</p>
              <strong>0</strong>
              <h2>No funded agent jobs</h2>
              <p>The earlier testnet self-transfer was only an activation proof. It is not counted as a hire or completed agent task.</p>
            </section>

            <section className="permission-card dashboard-permissions">
              <div className="permission-heading">
                <span className="shield-mark">G</span>
                <div><p>Next execution gate</p><span>Stage 4</span></div>
                <strong>LOCKED</strong>
              </div>
              <div className="permission-list">
                <div><span>1</span><p>Fund one 0.10 $U canary safely</p></div>
                <div><span>2</span><p>Receive and inspect the task result</p></div>
                <div><span>3</span><p>Record the ERC-8183 job receipt</p></div>
              </div>
              <a href="/activate">Inspect execution gate →</a>
            </section>

            <section className="evidence-warning compact-warning">
              <span>!</span>
              <div>
                <strong>Provider concentration</strong>
                <p>All four selected identities currently point to the same provider wallet. Diversification remains open work.</p>
              </div>
            </section>
          </aside>
        </div>
      </div>
    </main>
  );
}
