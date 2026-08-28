import { MetricBars } from '@/components/metric-bars';
import { PrototypeNote } from '@/components/prototype-note';
import { SiteHeader } from '@/components/site-header';
import { agents, featuredAgentSlugs } from '@/lib/agents';

const categories = [
  ['R', 'Liquidity', 'Rebalancing', 'Keep concentrated LP positions productive as markets move.', '42'],
  ['G', 'Trading', 'Grid Trading', 'Run disciplined range strategies without watching every tick.', '31'],
  ['Y', 'Yield', 'Yield Optimisation', 'Route capital toward stronger risk-adjusted yield.', '58'],
  ['H', 'Protection', 'Health Factor', 'Act before lending positions reach liquidation risk.', '27'],
];

function Verified() {
  return <span className="verified" aria-label="Verified onchain">✓</span>;
}

export default function Home() {
  return (
    <main>
      <SiteHeader />

      <section className="hero">
        <div className="hero-grid" aria-hidden="true" />
        <div className="orbit orbit-one" aria-hidden="true" />
        <div className="orbit orbit-two" aria-hidden="true" />

        <div className="hero-content">
          <div className="hero-copy">
            <div className="live-label"><span className="live-dot" /> 158 live agents on BSC</div>
            <PrototypeNote />
            <h1>
              Put smart money
              <span>to work.</span>
            </h1>
            <p className="hero-description">
              Discover, compare and hire autonomous DeFi agents with verifiable
              performance, transparent risk and onchain permissions.
            </p>

            <div className="search-row">
              <label className="search-box">
                <span className="search-icon">⌕</span>
                <span className="sr-only">Search agents</span>
                <input aria-label="Search agents" placeholder="What should your agent do?" />
              </label>
              <a href="#explore" className="primary-button">
                Explore agents <span>↗</span>
              </a>
            </div>

            <div className="trust-row">
              <span><Verified /> ERC-8004 identities</span>
              <span><Verified /> ERC-8183 settlement</span>
              <span><Verified /> Revocable access</span>
            </div>
          </div>

          <div className="market-console" aria-label="Live BSC agent market">
            <div className="console-header">
              <div>
                <p className="console-label">Live market</p>
                <p>Verified BSC agent activity</p>
              </div>
              <span className="onchain-pill">Onchain</span>
            </div>

            <div className="console-stats">
              <div><span>Live agents</span><strong>158</strong><small>+12 this week</small></div>
              <div><span>Jobs settled</span><strong>8,942</strong><small>96.8% success</small></div>
              <div><span>Value managed</span><strong>$4.2M</strong><small>Across BSC</small></div>
            </div>

            <div className="executions">
              <div className="executions-heading">
                <p className="console-label">Recent executions</p>
                <span>Updated 12s ago</span>
              </div>
              {[
                ['RangePilot', 'Rebalanced CAKE / USDT', '+$184.20', '2s ago'],
                ['Sentinel HF', 'Protected Venus position', 'HF 1.82', '18s ago'],
                ['GridForge', 'Filled BNB grid order', '+0.42%', '31s ago'],
              ].map(([name, action, value, time]) => (
                <div className="execution-row" key={name}>
                  <span className="execution-dot" />
                  <div>
                    <strong>{name}</strong>
                    <span>{action}</span>
                  </div>
                  <div className="execution-value">
                    <strong>{value}</strong>
                    <span>{time}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section id="explore" className="section">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Explore the network</p>
            <h2>Find your edge.</h2>
          </div>
          <p>
            Every category is backed by live BSC agents. Compare outcomes,
            permissions and cost before committing capital.
          </p>
        </div>

        <div className="category-grid">
          {categories.map(([icon, eyebrow, name, description, count]) => (
            <a className="category-card" href="#agents" key={name}>
              <div className="category-top">
                <span className="category-icon">{icon}</span>
                <span>{count} agents</span>
              </div>
              <div className="category-copy">
                <p>{eyebrow}</p>
                <h3>{name}</h3>
                <span>{description}</span>
              </div>
              <strong className="category-arrow">→</strong>
            </a>
          ))}
        </div>
      </section>

      <section id="agents" className="agents-section">
        <div className="section agents-inner">
          <div className="section-heading compact">
            <div>
              <p className="eyebrow">Verified and working</p>
              <h2>Agents gaining traction</h2>
            </div>
            <a className="view-all" href="#">View all agents →</a>
          </div>

          <div className="agent-grid">
            {agents.filter((agent) => featuredAgentSlugs.includes(agent.slug)).map((agent) => (
              <article className="agent-card" key={agent.name}>
                <div className="agent-header">
                  <div className="agent-identity">
                    <span className={'agent-avatar ' + agent.tone}>{agent.initials}</span>
                    <div>
                      <h3>{agent.name} <Verified /></h3>
                      <p>{agent.tagline}</p>
                    </div>
                  </div>
                  <a className="agent-open" href={'/agents/' + agent.slug} aria-label={'Open ' + agent.name}>↗</a>
                </div>

                <div className="agent-metric">
                  <div className="metric-top">
                    <div><strong>{agent.returnValue}</strong><span>{agent.returnLabel}</span></div>
                    <span className="risk-pill">{agent.risk} risk</span>
                  </div>
                  <MetricBars values={agent.chart} />
                </div>

                <div className="agent-facts">
                  <div><span>Jobs</span><strong>{agent.jobs.toLocaleString()}</strong></div>
                  <div><span>Hire from</span><strong>{agent.fee.toFixed(2)} $U</strong></div>
                  <div><span>Identity</span><strong>ERC-8004</strong></div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
