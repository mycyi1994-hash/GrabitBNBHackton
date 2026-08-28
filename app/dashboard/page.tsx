'use client';

import { useState } from 'react';
import { MetricBars } from '@/components/metric-bars';
import { PrototypeNote } from '@/components/prototype-note';
import { SiteHeader } from '@/components/site-header';
import { agents } from '@/lib/agents';

export default function DashboardPage() {
  const agent = agents[0];
  const [status, setStatus] = useState<'Active' | 'Paused' | 'Revoked'>('Active');
  const [notice, setNotice] = useState('');

  function updateStatus(next: 'Paused' | 'Revoked') {
    setStatus(next);
    setNotice(next === 'Paused' ? 'Automation paused. Existing session permissions remain active.' : 'Session revoked in the prototype. No further actions are authorised.');
  }

  return (
    <main className="subpage dashboard-page">
      <SiteHeader active="dashboard" />
      <div className="dashboard-shell">
        <PrototypeNote />
        <header className="dashboard-header">
          <div><p className="eyebrow">Control centre</p><h1>Your agents.</h1><p>Track performance, inspect every action and revoke access at any time.</p></div>
          <a className="primary-button" href="/#agents">Hire another agent <span>↗</span></a>
        </header>

        {notice && <div className={'dashboard-notice ' + status.toLowerCase()}><span>{status === 'Revoked' ? '!' : 'Ⅱ'}</span><p>{notice}</p><button onClick={() => setNotice('')} aria-label="Dismiss notice">×</button></div>}

        <section className="portfolio-grid">
          <div><span>Managed capital</span><strong>$250.00</strong><small>Testnet portfolio</small></div>
          <div><span>Net PnL</span><strong className="positive">+$12.84</strong><small>+5.14% since activation</small></div>
          <div><span>Agent actions</span><strong>24</strong><small>23 settled · 1 monitoring</small></div>
          <div><span>Risk budget used</span><strong>18%</strong><small>18 / 100 USDT daily cap</small></div>
        </section>

        <div className="dashboard-grid">
          <div className="dashboard-main">
            <section className="dashboard-panel">
              <div className="panel-heading">
                <div><p className="eyebrow">Active allocation</p><h2>Portfolio performance</h2></div>
                <div className="range-tabs"><button>24H</button><button>7D</button><button className="active">30D</button></div>
              </div>
              <div className="dashboard-chart">
                <div className="chart-value"><span>Total value</span><strong>$262.84</strong></div>
                <MetricBars values={[42, 47, 45, 54, 51, 60, 65, 62, 73, 78, 83, 91]} />
              </div>
              <div className="performance-foot"><span><i className="legend agent" /> Portfolio</span><span><i className="legend benchmark" /> BNB benchmark</span><strong>Updated 12s ago</strong></div>
            </section>

            <section className="dashboard-panel">
              <div className="panel-heading">
                <div><p className="eyebrow">Execution log</p><h2>Agent actions</h2></div>
                <a className="table-link" href="#">Export receipts</a>
              </div>
              <div className="action-timeline">
                {[
                  ['Monitoring', 'Checked CAKE / USDT range', 'No action required · position 68% in range', '12s ago'],
                  ['Settled', 'Rebalanced liquidity position', 'New range $2.31 – $2.89 · fee 0.08 $U', '18m ago'],
                  ['Settled', 'Collected and compounded fees', 'Added 3.42 USDT to liquidity', '4h ago'],
                  ['Monitoring', 'Risk gate evaluation', 'Price impact 0.08% · below 0.5% limit', '8h ago'],
                ].map(([type, title, detail, time]) => (
                  <div className="timeline-row" key={title}>
                    <span className={type.toLowerCase()} />
                    <div><strong>{title}</strong><p>{detail}</p></div>
                    <div><b>{type}</b><small>{time}</small></div>
                  </div>
                ))}
              </div>
            </section>
          </div>

          <aside className="dashboard-sidebar">
            <section className="managed-agent-card">
              <div className="managed-agent-head"><span className={'agent-avatar ' + agent.tone}>{agent.initials}</span><div><h2>{agent.name} <span className="verified">✓</span></h2><p>{agent.tagline}</p></div><span className={'status-badge ' + status.toLowerCase()}>{status}</span></div>
              <dl>
                <div><dt>Allocation</dt><dd>250 USDT</dd></div>
                <div><dt>Position</dt><dd>CAKE / USDT</dd></div>
                <div><dt>Session expiry</dt><dd>6d 18h</dd></div>
                <div><dt>Job ID</dt><dd>#AM-2048</dd></div>
              </dl>
              <a href={'/agents/' + agent.slug}>View agent profile ↗</a>
            </section>

            <section className="permission-card dashboard-permissions">
              <div className="permission-heading"><span className="shield-mark">A</span><div><p>Session permissions</p><span>0x84A1...19D7</span></div><strong>{status === 'Revoked' ? 'Revoked' : 'Onchain'}</strong></div>
              <div className="permission-list">
                <div><span>✓</span><p>Pancake V3 Position Manager</p></div>
                <div><span>✓</span><p>Spend ≤ 100 USDT / day</p></div>
                <div><span>✓</span><p>Expires in 6d 18h</p></div>
              </div>
              <a href="#">Inspect in Altana ↗</a>
            </section>

            <section className="danger-card">
              <p className="eyebrow">Agent controls</p>
              <h3>Stay in control.</h3>
              <p>Pause automation while preserving the session, or revoke all authority immediately.</p>
              <div>
                <button disabled={status !== 'Active'} onClick={() => updateStatus('Paused')}>Pause agent</button>
                <button disabled={status === 'Revoked'} onClick={() => updateStatus('Revoked')}>Revoke session</button>
              </div>
            </section>
          </aside>
        </div>
      </div>
    </main>
  );
}
