'use client';

import { useMemo, useState } from 'react';
import { MetricBars } from '@/components/metric-bars';
import { PrototypeNote } from '@/components/prototype-note';
import { SiteHeader } from '@/components/site-header';
import { agents } from '@/lib/agents';

type CompareClientProps = {
  initialA?: string;
  initialB?: string;
};

export function CompareClient({ initialA, initialB }: CompareClientProps) {
  const [slugA, setSlugA] = useState(initialA && agents.some((agent) => agent.slug === initialA) ? initialA : 'range-pilot');
  const [slugB, setSlugB] = useState(initialB && agents.some((agent) => agent.slug === initialB) ? initialB : 'yield-route');
  const agentA = useMemo(() => agents.find((agent) => agent.slug === slugA) ?? agents[0], [slugA]);
  const agentB = useMemo(() => agents.find((agent) => agent.slug === slugB) ?? agents[1], [slugB]);

  const rows = [
    ['Net return / APY', agentA.returnValue, agentB.returnValue],
    ['Maximum drawdown', agentA.drawdown.toFixed(1) + '%', agentB.drawdown.toFixed(1) + '%'],
    ['Risk level', agentA.risk, agentB.risk],
    ['Reputation', agentA.reputation + ' / 100', agentB.reputation + ' / 100'],
    ['Uptime', agentA.uptime + '%', agentB.uptime + '%'],
    ['Settled jobs', agentA.jobs.toLocaleString(), agentB.jobs.toLocaleString()],
    ['Hire fee', agentA.fee.toFixed(2) + ' $U', agentB.fee.toFixed(2) + ' $U'],
    ['Track record', agentA.activityDays + ' days', agentB.activityDays + ' days'],
  ];

  return (
    <main className="subpage">
      <SiteHeader active="compare" />
      <div className="compare-shell">
        <PrototypeNote />
        <header className="compare-hero">
          <p className="eyebrow">Decision workspace</p>
          <h1>Compare agents,<br /><span>not promises.</span></h1>
          <p>Put verifiable performance, downside, cost and permissions side by side before you commit capital.</p>
        </header>

        <section className="compare-picker">
          {[{ agent: agentA, value: slugA, set: setSlugA }, { agent: agentB, value: slugB, set: setSlugB }].map((item, index) => (
            <div className="compare-agent" key={index}>
              <label>
                <span>Agent {index + 1}</span>
                <select value={item.value} onChange={(event) => item.set(event.target.value)}>
                  {agents.filter((agent) => index === 0 || agent.slug !== slugA).map((agent) => (
                    <option value={agent.slug} key={agent.slug}>{agent.name} · {agent.category}</option>
                  ))}
                </select>
              </label>
              <div className="compare-agent-card">
                <div className="compare-agent-head">
                  <span className={'agent-avatar ' + item.agent.tone}>{item.agent.initials}</span>
                  <div><h2>{item.agent.name} <span className="verified">✓</span></h2><p>{item.agent.tagline}</p></div>
                  <span className="category-badge">{item.agent.category}</span>
                </div>
                <div className="compare-return">
                  <div><strong>{item.agent.returnValue}</strong><span>{item.agent.returnLabel}</span></div>
                  <MetricBars values={item.agent.chart} />
                </div>
                <div className="compare-actions">
                  <a href={'/agents/' + item.agent.slug}>View profile</a>
                  <a className="primary-button" href={'/activate?agent=' + item.agent.slug}>Hire <span>↗</span></a>
                </div>
              </div>
            </div>
          ))}
          <div className="versus">VS</div>
        </section>

        <section className="comparison-table">
          <div className="comparison-row comparison-head">
            <span>What matters</span><strong>{agentA.name}</strong><strong>{agentB.name}</strong>
          </div>
          {rows.map(([label, valueA, valueB]) => (
            <div className="comparison-row" key={label}>
              <span>{label}</span><strong>{valueA}</strong><strong>{valueB}</strong>
            </div>
          ))}
          <div className="comparison-row permissions-row">
            <span>Onchain permissions</span>
            <div>{agentA.permissions.map((permission) => <small key={permission}>✓ {permission}</small>)}</div>
            <div>{agentB.permissions.map((permission) => <small key={permission}>✓ {permission}</small>)}</div>
          </div>
        </section>

        <section className="compare-note">
          <div><span>i</span><p><strong>Read the downside.</strong> Returns are only meaningful with the period, drawdown, fee and number of settled jobs beside them.</p></div>
          <a href="/#agents">Browse all agents →</a>
        </section>
      </div>
    </main>
  );
}
