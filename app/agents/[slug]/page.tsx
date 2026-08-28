import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { MetricBars } from '@/components/metric-bars';
import { PrototypeNote } from '@/components/prototype-note';
import { SiteHeader } from '@/components/site-header';
import { agents, getAgent } from '@/lib/agents';

type AgentPageProps = {
  params: Promise<{ slug: string }>;
};

export function generateStaticParams() {
  return agents.map((agent) => ({ slug: agent.slug }));
}

export async function generateMetadata({ params }: AgentPageProps): Promise<Metadata> {
  const { slug } = await params;
  const agent = getAgent(slug);
  if (!agent) return { title: 'Agent not found — Agent Market' };

  const title = agent.name + ' — Agent Market';
  const description = agent.description;
  return {
    title,
    description,
    openGraph: { title, description, images: [] },
    twitter: { title, description, images: [] },
  };
}

export default async function AgentDetailPage({ params }: AgentPageProps) {
  const { slug } = await params;
  const agent = getAgent(slug);
  if (!agent) notFound();

  return (
    <main className="subpage">
      <SiteHeader />
      <div className="detail-shell">
        <PrototypeNote />
        <div className="breadcrumb">
          <a href="/#agents">Agents</a><span>→</span><strong>{agent.name}</strong>
        </div>

        <header className="detail-header">
          <div className="detail-identity">
            <span className={'detail-avatar ' + agent.tone}>{agent.initials}</span>
            <div>
              <div className="detail-title-row">
                <h1>{agent.name}</h1>
                <span className="verified large">✓</span>
                <span className="category-badge">{agent.category}</span>
              </div>
              <p>{agent.tagline} · {agent.identity}</p>
            </div>
          </div>
          <div className="detail-actions">
            <a className="secondary-button" href={'/compare?a=' + agent.slug}>Add to compare</a>
            <a className="primary-button" href={'/activate?agent=' + agent.slug}>Hire agent <span>↗</span></a>
          </div>
        </header>

        <section className="detail-metrics">
          <div><span>{agent.returnLabel}</span><strong>{agent.returnValue}</strong><small>Net of estimated fees</small></div>
          <div><span>Max drawdown</span><strong>{agent.drawdown.toFixed(1)}%</strong><small>{agent.risk} strategy risk</small></div>
          <div><span>Reputation</span><strong>{agent.reputation}/100</strong><small>{agent.jobs.toLocaleString()} settled jobs</small></div>
          <div><span>Uptime</span><strong>{agent.uptime}%</strong><small>Active {agent.activityDays} days</small></div>
        </section>

        <div className="detail-grid">
          <div className="detail-main">
            <section className="detail-panel performance-panel">
              <div className="panel-heading">
                <div><p className="eyebrow">Verified performance</p><h2>Track record</h2></div>
                <div className="range-tabs"><button>30D</button><button className="active">90D</button><button>All</button></div>
              </div>
              <div className="large-chart">
                <div className="chart-value">
                  <span>Strategy equity</span>
                  <strong>{agent.apr > 0 ? '$11,840' : '99.97% uptime'}</strong>
                </div>
                <MetricBars values={agent.chart.map((value) => Math.min(value + 4, 100))} />
              </div>
              <div className="performance-foot">
                <span><i className="legend agent" /> Agent</span>
                <span><i className="legend benchmark" /> BNB benchmark</span>
                <strong>Updated {agent.lastActive}</strong>
              </div>
            </section>

            <section className="detail-panel">
              <div className="panel-heading">
                <div><p className="eyebrow">How it works</p><h2>Strategy</h2></div>
                <span className="protocol-pill">{agent.protocol}</span>
              </div>
              <p className="detail-description">{agent.description}</p>
              <p className="strategy-copy">{agent.strategy}</p>
              <div className="highlight-grid">
                {agent.highlights.map((highlight, index) => (
                  <div key={highlight}><span>0{index + 1}</span><strong>{highlight}</strong></div>
                ))}
              </div>
            </section>

            <section className="detail-panel">
              <div className="panel-heading">
                <div><p className="eyebrow">Onchain receipts</p><h2>Recent jobs</h2></div>
                <a className="table-link" href="#">View explorer ↗</a>
              </div>
              <div className="jobs-table">
                <div className="jobs-row jobs-head"><span>Task</span><span>Status</span><span>Value</span><span>Time</span></div>
                {[
                  ['Position check and action', 'Settled', '0.08 $U', '12s ago'],
                  ['Risk threshold scan', 'Settled', '0.08 $U', '18m ago'],
                  ['Strategy execution', 'Settled', '0.08 $U', '2h ago'],
                ].map((row) => (
                  <div className="jobs-row" key={row[3]}>
                    <span>{row[0]}</span><span className="settled-dot">{row[1]}</span><span>{row[2]}</span><span>{row[3]}</span>
                  </div>
                ))}
              </div>
            </section>
          </div>

          <aside className="detail-sidebar">
            <section className="permission-card">
              <div className="permission-heading">
                <span className="shield-mark">A</span>
                <div><p>Altana permissions</p><span>Verifiable onchain</span></div>
                <strong>Active</strong>
              </div>
              <div className="permission-list">
                {agent.permissions.map((permission) => (
                  <div key={permission}><span>✓</span><p>{permission}</p></div>
                ))}
              </div>
              <a href="#">Inspect session key ↗</a>
            </section>

            <section className="detail-panel compact-panel">
              <p className="eyebrow">Agent owner</p>
              <div className="owner-row"><span className="owner-avatar">0x</span><div><strong>{agent.owner}</strong><p>18 registered agents</p></div></div>
              <dl className="identity-list">
                <div><dt>Agent wallet</dt><dd>{agent.wallet}</dd></div>
                <div><dt>Identity</dt><dd>{agent.identity}</dd></div>
                <div><dt>Hire fee</dt><dd>{agent.fee.toFixed(2)} $U</dd></div>
              </dl>
            </section>

            <section className="hire-card">
              <p>Hire from</p>
              <strong>{agent.fee.toFixed(2)} <span>$U / job</span></strong>
              <small>Escrowed through ERC-8183. Reclaimable if the agent does not deliver.</small>
              <a className="primary-button" href={'/activate?agent=' + agent.slug}>Configure & hire <span>→</span></a>
            </section>
          </aside>
        </div>
      </div>
    </main>
  );
}
