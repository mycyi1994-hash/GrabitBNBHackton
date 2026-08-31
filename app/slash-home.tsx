'use client';

import { AgentCelestial, type AgentCelestialVariant } from '@/app/agent-celestial';
import { GrabitScene } from '@/app/grabit-scene';
import Link from 'next/link';
import { useState } from 'react';

type SlashAgent = {
  tokenId: string;
  name: string;
  category: string;
  price: string;
  live: boolean;
  description: string;
  owner: string;
  feedbacks: number | null;
  validations: number | null;
  endpointVerified: boolean | null;
};

type SlashHomeProps = {
  agents: SlashAgent[];
};

type StoreFilter = 'all' | 'automate' | 'monitor';

const agentCodes = ['RBL', 'GRID', 'YLD', 'HLTH'];
const variants: AgentCelestialVariant[] = ['core', 'tech', 'income', 'alpha'];
const agentProfiles = [
  {
    role: 'PORTFOLIO MAINTENANCE',
    risk: 'CONTROLLED',
    bestFor: 'Allocations that have drifted away from their target weights',
    mode: 'RULES-BASED AUTOMATION',
    capability: 'POOL COSTS · TARGET WEIGHTS',
  },
  {
    role: 'SYSTEMATIC EXECUTION',
    risk: 'ACTIVE',
    bestFor: 'Traders who need pool-costed grid levels before execution',
    mode: 'SYSTEMATIC ACTIVE',
    capability: 'GRID LEVELS · BREAK-EVEN',
  },
  {
    role: 'YIELD ROUTING',
    risk: 'VARIABLE',
    bestFor: 'Stablecoin suppliers comparing Venus markets after gas',
    mode: 'MARKET RANKING',
    capability: 'VENUS APY · GAS CHECK',
  },
  {
    role: 'RISK MONITOR',
    risk: 'DEFENSIVE',
    bestFor: 'Borrowers who need liquidation-distance and stress alerts',
    mode: 'CONTINUOUS MONITOR',
    capability: 'HEALTH FACTOR · STRESS',
  },
];

function shortName(name: string) {
  return name.replace(/^Brain on BNB\s*[—-]\s*/i, '');
}

function AgentCard({ agent, index }: { agent: SlashAgent; index: number }) {
  const profile = agentProfiles[index] ?? agentProfiles[0];
  const variant = variants[index] ?? 'core';
  const verification = agent.endpointVerified === true ? 'VERIFIED' : agent.live ? 'LIVE' : 'CHECK';

  return (
    <article className={'grabit-agent-card grabit-product-' + variant}>
      <Link
        className="grabit-card-hit"
        href={'/activate?registry=' + agent.tokenId}
        aria-label={'View and hire ' + agent.name}
      />
      <div className="grabit-card-index" aria-hidden="true">
        <span>{String(index + 1).padStart(2, '0')}</span><i />
      </div>
      <div className="grabit-card-hero">
        <div className="grabit-card-copy">
          <span className="grabit-product-role">{profile.role}</span>
          <div className="grabit-card-labels">
            <span className="grabit-agent-code">{agentCodes[index] ?? 'AGT'}</span>
            <span className="grabit-registry-badge">ERC-8004 #{agent.tokenId}</span>
            <span className="grabit-risk-badge">{profile.risk}</span>
          </div>
          <h2>{shortName(agent.name)}</h2>
          <p>{agent.description}</p>
          <div className="grabit-best-for"><span>BEST FOR</span><b>{profile.bestFor}</b></div>
          <small>{profile.mode} · {agent.live ? 'LIVE REGISTRY' : 'REGISTRY CHECK'} · BSC</small>
        </div>
        <div className="grabit-card-planet" aria-hidden="true">
          <AgentCelestial variant={variant} />
        </div>
      </div>
      <dl className="grabit-card-metrics">
        <div><dt>ENDPOINT</dt><dd>{verification}<small>{agent.live ? 'LIVE' : 'WAIT'}</small></dd></div>
        <div><dt>JOB PRICE</dt><dd>{agent.price}</dd></div>
        <div><dt>FEEDBACK</dt><dd>{agent.feedbacks ?? '—'}</dd></div>
        <div><dt>VALIDATIONS</dt><dd>{agent.validations ?? '—'}<small>{profile.capability}</small></dd></div>
      </dl>
      <div className="grabit-card-actions">
        <div className="grabit-capability-chips" aria-label="Agent capabilities">
          <span>BSC</span><span>TESTNET</span><span>A2A</span>
        </div>
        <span className="grabit-view-agent" aria-hidden="true">VIEW + HIRE <span>↗</span></span>
      </div>
    </article>
  );
}

export function SlashHome({ agents }: SlashHomeProps) {
  const [view, setView] = useState<'landing' | 'store'>('landing');
  const [filter, setFilter] = useState<StoreFilter>('all');
  const visibleAgents = agents.slice(0, 4);
  const firstAgent = visibleAgents[0];
  const indexedAgents = visibleAgents.map((agent, index) => ({ agent, index }));
  const shownAgents = indexedAgents.filter(({ index }) => {
    if (filter === 'automate') return index < 3;
    if (filter === 'monitor') return index === 3;
    return true;
  });

  if (view === 'store') {
    return (
      <div className="grabit-market-shell">
        <header className="grabit-market-topbar">
          <button className="grabit-market-identity" type="button" onClick={() => setView('landing')}>
            <span>G</span>
            <strong>GRABIT AGENT MARKET<small>BNB AGENT OBSERVATORY</small></strong>
          </button>
          <nav className="grabit-market-menu" aria-label="Primary navigation">
            <button type="button" onClick={() => setView('landing')}>OVERVIEW</button>
            <button className="is-active" type="button" aria-current="page">AGENTS</button>
            <Link href="/dashboard">LEADERBOARD</Link>
          </nav>
          {firstAgent ? (
            <Link className="grabit-market-wallet" href={'/activate?registry=' + firstAgent.tokenId}>
              <i /> OPEN TESTNET
            </Link>
          ) : null}
        </header>

        <main className="grabit-market-page">
          <header className="grabit-market-intro">
            <div>
              <p className="grabit-section-kicker">CHOOSE BY AGENT ROLE / BSC TESTNET</p>
              <h1>Build your agent stack.</h1>
              <p>Start with execution, yield or risk monitoring—then inspect the identity, quote and permissions behind each Agent.</p>
              <div className="grabit-market-truth">
                <span><i /> TESTNET MODE</span><span>LIVE REGISTRY</span><span>ERC-8004</span>
              </div>
            </div>
            <div className="grabit-role-map" aria-label="Four agent roles">
              {visibleAgents.map((agent, index) => (
                <span key={agent.tokenId} className={'grabit-product-' + variants[index]}>
                  <i>{String(index + 1).padStart(2, '0')}</i>
                  <b>{agentProfiles[index].role}</b>
                  <small>{agentCodes[index]} · {agentProfiles[index].risk}</small>
                </span>
              ))}
            </div>
          </header>

          <div className="grabit-market-toolbar">
            <div className="grabit-strategy-filters" role="group" aria-label="Filter agents">
              <button type="button" className={filter === 'all' ? 'is-active' : ''} aria-pressed={filter === 'all'} onClick={() => setFilter('all')}>ALL · 4</button>
              <button type="button" className={filter === 'automate' ? 'is-active' : ''} aria-pressed={filter === 'automate'} onClick={() => setFilter('automate')}>AUTOMATE · 3</button>
              <button type="button" className={filter === 'monitor' ? 'is-active' : ''} aria-pressed={filter === 'monitor'} onClick={() => setFilter('monitor')}>MONITOR · 1</button>
            </div>
            <p className="grabit-market-status">
              <b>{String(shownAgents.length).padStart(2, '0')} AGENTS</b> · LIVE BSC REGISTRY
            </p>
          </div>

          <section key={filter} className="grabit-agent-grid" aria-label="Agent marketplace">
            {shownAgents.map(({ agent, index }) => <AgentCard key={agent.tokenId} agent={agent} index={index} />)}
          </section>
        </main>

        <footer className="grabit-market-disclaimer">
          <span>TESTNET / PRE-LAUNCH</span>
          <p>Quotes and results must be verified before activation. No Mainnet capital moves from this marketplace preview.</p>
          <Link href="/dashboard">LEADERBOARD ↗</Link>
        </footer>
      </div>
    );
  }

  return (
    <main className="grabit-ganymede-launch">
      <GrabitScene />

      <header className="grabit-launch-nav">
        <button className="grabit-wordmark" type="button" onClick={() => setView('landing')} aria-label="Grabit home">
          <span>G</span>
          <b>GRABIT AGENT MARKET<small>BNB AGENT OBSERVATORY</small></b>
        </button>
        <nav className="grabit-main-nav" aria-label="Primary navigation">
          <button type="button" onClick={() => setView('store')}>AGENTS</button>
          <Link href="/dashboard">LEADERBOARD</Link>
        </nav>
        {firstAgent ? (
          <Link className="grabit-testnet-link" href={'/activate?registry=' + firstAgent.tokenId}>
            <i /> OPEN TESTNET
          </Link>
        ) : null}
      </header>

      <section className="grabit-launch-copy" aria-labelledby="grabit-hero-title">
        <div className="grabit-status-line">
          <span><i /> LIVE AGENT REGISTRY</span>
          <b>BSC TESTNET · ERC-8004</b>
        </div>
        <p>FOUR DEFI AGENTS · ONE EXECUTION MARKET</p>
        <h1 id="grabit-hero-title">
          <span>FOUR AGENTS.</span>
          <span>ONE CLEAR MARKET.</span>
        </h1>
        <p className="grabit-launch-description">
          Compare rebalancing, grid trading, yield and health-factor agents—then inspect
          every permission, quote and on-chain result before activation.
        </p>
        <div className="grabit-launch-actions">
          <button className="grabit-primary-action" type="button" onClick={() => setView('store')}>
            EXPLORE AGENTS <span aria-hidden="true">↗</span>
          </button>
          <Link className="grabit-secondary-action" href="/dashboard">VIEW LEADERBOARD</Link>
        </div>
        <div className="grabit-assurance">
          <span>IDENTITY VERIFIED</span>
          <span>PERMISSIONS VISIBLE</span>
          <span>TESTNET FIRST</span>
        </div>
      </section>

      <aside className="grabit-agent-index" aria-label="Agent universe">
        <span className="grabit-agent-index-label">AGENT UNIVERSE / {String(visibleAgents.length).padStart(2, '0')}</span>
        {visibleAgents.map((agent, index) => (
          <button
            key={agent.tokenId}
            className={'grabit-agent-' + String(index + 1)}
            type="button"
            onClick={() => setView('store')}
          >
            <i>{String(index + 1).padStart(2, '0')}</i>
            <span>
              <b>{agentCodes[index] ?? 'AGT'}</b>
              <small>{agent.category}</small>
            </span>
            <em>{agent.price}</em>
          </button>
        ))}
      </aside>

      <p className="grabit-launch-disclosure">
        <span>TESTNET / PRE-LAUNCH</span>
        Agent performance is shown only after verified execution. No mainnet capital moves from this screen.
      </p>
    </main>
  );
}
