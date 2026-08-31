'use client';

import { AgentCelestial, type AgentCelestialVariant } from '@/app/agent-celestial';
import { GrabitScene } from '@/app/grabit-scene';
import Link from 'next/link';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ActiveAgents } from '@/components/active-agents';
import { EvidenceLeaderboard } from '@/components/evidence-leaderboard';

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

type VerificationGate = {
  identityRegistered: boolean;
  endpointReachable: boolean;
  quoteAccepted: boolean;
  taskDelivered: boolean;
  jobSettled: boolean;
};

type SlashHomeProps = {
  agents: SlashAgent[];
  gate: VerificationGate;
  ownerConcentration: number;
};

type StoreFilter = 'all' | 'automate' | 'monitor';

type DemoResult = {
  category?: string;
  verdict?: string;
  summary?: string;
  dataQuality?: string;
  metrics?: Array<{ label?: string; value?: string; note?: string }>;
  actions?: string[];
  risks?: string[];
  evidence?: {
    sourceBlock?: string;
    gasPriceGwei?: string;
    observedAt?: string;
  };
};

type DemoSelection = {
  agent: SlashAgent;
  index: number;
};

const agentCodes = ['RBL', 'GRID', 'YLD', 'HLTH'];
const variants: AgentCelestialVariant[] = ['core', 'tech', 'income', 'alpha'];
const agentProfiles = [
  {
    role: 'PORTFOLIO MAINTENANCE',
    risk: 'CONTROLLED',
    summary: 'Reprices a drifted portfolio against executable BSC pool routes before rebalancing.',
    bestFor: 'Allocations that have drifted away from their target weights',
    demoTask: 'Price a 60/40 WBNB-USDT portfolio back to a 50/50 target with bounded execution cost.',
  },
  {
    role: 'SYSTEMATIC EXECUTION',
    risk: 'ACTIVE',
    summary: 'Builds fee-aware grid levels and break-even spacing for a selected BSC pool.',
    bestFor: 'Traders who need pool-costed grid levels before execution',
    demoTask: 'Build a 10-level WBNB-USDT grid across a 15% band for a $1,000 test notional.',
  },
  {
    role: 'YIELD ROUTING',
    risk: 'VARIABLE',
    summary: 'Ranks Venus stablecoin markets by base supply APY and estimated switching cost.',
    bestFor: 'Stablecoin suppliers comparing Venus markets after gas',
    demoTask: 'Rank current Venus stablecoin supply yields and show the best base APY with source block.',
  },
  {
    role: 'RISK MONITOR',
    risk: 'DEFENSIVE',
    summary: 'Monitors Venus health factor, liquidation distance and collateral stress on-chain.',
    bestFor: 'Borrowers who need liquidation-distance and stress alerts',
    demoTask: 'Stress-test a Venus borrowing position and report health-factor liquidation distance.',
  },
];

function shortName(name: string) {
  return name.replace(/^Brain on BNB\s*[—-]\s*/i, '');
}

function AgentCard({
  agent,
  index,
  running,
  onRun,
}: {
  agent: SlashAgent;
  index: number;
  running: boolean;
  onRun: (agent: SlashAgent, index: number) => void;
}) {
  const profile = agentProfiles[index] ?? agentProfiles[0];
  const variant = variants[index] ?? 'core';
  const verification = agent.endpointVerified === true ? 'VERIFIED' : agent.live ? 'LIVE' : 'CHECK';

  return (
    <article className={'grabit-agent-card grabit-product-' + variant}>
      <Link
        className="grabit-card-hit"
        href={'/activate?registry=' + agent.tokenId}
        aria-label={'Open the Testnet terminal for ' + agent.name}
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
          <p>{profile.summary}</p>
          <div className="grabit-best-for"><span>BEST FOR</span><b>{profile.bestFor}</b></div>
        </div>
        <div className="grabit-card-planet" aria-hidden="true">
          <AgentCelestial variant={variant} />
        </div>
      </div>
      <dl className="grabit-card-metrics">
        <div><dt>ENDPOINT</dt><dd>{verification}<small>{agent.live ? 'LIVE' : 'WAIT'}</small></dd></div>
        <div><dt>JOB PRICE</dt><dd>{agent.price}</dd></div>
        <div><dt>FEEDBACK</dt><dd>{agent.feedbacks ?? '—'}</dd></div>
        <div><dt>VALIDATIONS</dt><dd>{agent.validations ?? '—'}</dd></div>
      </dl>
      <div className="grabit-card-actions">
        <div className="grabit-capability-chips" aria-label="Agent capabilities">
          <span>BSC</span><span>TESTNET</span><span>A2A</span>
        </div>
        <button
          className="grabit-view-agent"
          type="button"
          disabled={running}
          onClick={(event) => {
            event.preventDefault();
            event.stopPropagation();
            onRun(agent, index);
          }}
        >
          <i aria-hidden="true" />
          <span>{running ? 'OBSERVING...' : 'RUN AGENT'}</span>
          <small>{running ? 'LIVE BSC' : 'LIVE DEMO'}</small>
          <b aria-hidden="true">↗</b>
        </button>
      </div>
    </article>
  );
}

export function SlashHome({ agents, gate, ownerConcentration }: SlashHomeProps) {
  const [view, setView] = useState<'landing' | 'store'>('landing');
  const [filter, setFilter] = useState<StoreFilter>('all');
  const [demoSelection, setDemoSelection] = useState<DemoSelection | null>(null);
  const [demoResult, setDemoResult] = useState<DemoResult | null>(null);
  const [demoError, setDemoError] = useState<string | null>(null);
  const [demoRunning, setDemoRunning] = useState(false);
  const [pendingAnchor, setPendingAnchor] = useState<'board' | 'active' | null>(null);
  const storeRef = useRef<HTMLElement>(null);
  const boardRef = useRef<HTMLDivElement>(null);
  const activeRef = useRef<HTMLDivElement>(null);
  const visibleAgents = agents.slice(0, 4);
  const firstAgent = visibleAgents[0];
  const indexedAgents = visibleAgents.map((agent, index) => ({ agent, index }));
  const shownAgents = indexedAgents.filter(({ index }) => {
    if (filter === 'automate') return index < 3;
    if (filter === 'monitor') return index === 3;
    return true;
  });

  const scrollTo = useCallback((target: { current: HTMLElement | null }) => {
    target.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, []);

  useEffect(() => {
    window.scrollTo(0, 0);
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
    document.querySelector('.grabit-market-page')?.scrollTo(0, 0);
  }, [view]);

  // Entering the store from a landing call-to-action that names a section: let
  // the view render and its top-scroll settle, then move to the section asked
  // for. Without this the leaderboard link would have to leave the workspace.
  useEffect(() => {
    if (view !== 'store' || !pendingAnchor) return;
    const timer = window.setTimeout(() => {
      const target = pendingAnchor === 'board' ? boardRef : activeRef;
      target.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      setPendingAnchor(null);
    }, 80);
    return () => window.clearTimeout(timer);
  }, [pendingAnchor, view]);

  useEffect(() => {
    if (!demoSelection) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !demoRunning) setDemoSelection(null);
    };
    window.addEventListener('keydown', closeOnEscape);
    return () => window.removeEventListener('keydown', closeOnEscape);
  }, [demoRunning, demoSelection]);

  const runDemo = useCallback(async (agent: SlashAgent, index: number) => {
    const selection = { agent, index };
    setDemoSelection(selection);
    setDemoResult(null);
    setDemoError(null);
    setDemoRunning(true);
    try {
      const task = agentProfiles[index]?.demoTask || agent.description;
      const response = await fetch(
        `/api/hire/strategy-preview?registry=${encodeURIComponent(agent.tokenId)}&task=${encodeURIComponent(task)}`,
        { cache: 'no-store' },
      );
      const payload = await response.json() as {
        preview?: boolean;
        result?: DemoResult;
        error?: string;
      };
      if (!response.ok || !payload.preview || !payload.result) {
        throw new Error(payload.error || 'The Agent did not return a preview result.');
      }
      setDemoResult(payload.result);
    } catch (error) {
      setDemoError(error instanceof Error ? error.message : 'The live Agent demo failed.');
    } finally {
      setDemoRunning(false);
    }
  }, []);

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
            <button className="is-active" type="button" onClick={() => scrollTo(storeRef)}>AGENTS</button>
            <button type="button" onClick={() => scrollTo(boardRef)}>LEADERBOARD</button>
            <button type="button" onClick={() => scrollTo(activeRef)}>ACTIVE</button>
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
              <p className="grabit-section-kicker">SELECT → RUN → VERIFY → HIRE</p>
              <h1>Run an Agent now.</h1>
              <p>Choose one Agent and get a live BSC result immediately. No wallet or payment is required until you continue to Testnet hire.</p>
              <div className="grabit-market-truth">
                <span><i /> LIVE DEMO READY</span><span>NO WALLET NEEDED</span><span>ERC-8004</span>
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

          <section key={filter} className="grabit-agent-grid" ref={storeRef} aria-label="Agent marketplace">
            {shownAgents.map(({ agent, index }) => (
              <AgentCard
                key={agent.tokenId}
                agent={agent}
                index={index}
                running={demoRunning && demoSelection?.agent.tokenId === agent.tokenId}
                onRun={runDemo}
              />
            ))}
          </section>

          <div ref={boardRef}>
            <EvidenceLeaderboard
              agents={visibleAgents}
              gate={gate}
              ownerConcentration={ownerConcentration}
            />
          </div>

          <div ref={activeRef}>
            <ActiveAgents
              hireHref={firstAgent ? `/activate?registry=${firstAgent.tokenId}` : '/activate'}
            />
          </div>
        </main>

        <footer className="grabit-market-disclaimer">
          <span>TESTNET / PRE-LAUNCH</span>
          <p>Quotes and results must be verified before activation. No Mainnet capital moves from this marketplace preview.</p>
          <button type="button" onClick={() => scrollTo(boardRef)}>LEADERBOARD ↗</button>
        </footer>

        {demoSelection ? (
          <div
            className={`grabit-demo-backdrop grabit-product-${variants[demoSelection.index] ?? 'core'}`}
            role="presentation"
            onMouseDown={(event) => {
              if (event.target === event.currentTarget && !demoRunning) setDemoSelection(null);
            }}
          >
            <section
              className="grabit-demo-window"
              role="dialog"
              aria-modal="true"
              aria-labelledby="grabit-demo-title"
            >
              <div className="grabit-demo-celestial" aria-hidden="true">
                <AgentCelestial variant={variants[demoSelection.index] ?? 'core'} />
              </div>
              <header className="grabit-demo-header">
                <div>
                  <span>OBSERVATION SESSION / {String(demoSelection.index + 1).padStart(2, '0')} OF 04</span>
                  <h2 id="grabit-demo-title">{shortName(demoSelection.agent.name)}</h2>
                  <small>ERC-8004 #{demoSelection.agent.tokenId} · {agentProfiles[demoSelection.index]?.role}</small>
                </div>
                <button type="button" disabled={demoRunning} onClick={() => setDemoSelection(null)}>
                  CLOSE / ESC
                </button>
              </header>

              <div className="grabit-demo-task">
                <span>TASK</span>
                <p>{agentProfiles[demoSelection.index]?.demoTask}</p>
                <b>{demoRunning ? 'READING LIVE BSC DATA...' : demoResult ? 'RESULT RECEIVED' : 'RUN STOPPED'}</b>
              </div>

              {demoRunning ? (
                <div className="grabit-demo-loading" role="status">
                  <strong>AGENT IS WORKING</strong>
                  <p>Reading BSC state, calculating the strategy and attaching the source block.</p>
                  <div aria-hidden="true"><i /><i /><i /><i /><i /><i /><i /><i /></div>
                </div>
              ) : null}

              {demoError ? (
                <div className="grabit-demo-error" role="alert">
                  <strong>AGENT RUN FAILED</strong>
                  <p>{demoError}</p>
                  <button type="button" onClick={() => void runDemo(demoSelection.agent, demoSelection.index)}>
                    RETRY LIVE DEMO
                  </button>
                </div>
              ) : null}

              {demoResult ? (
                <div className="grabit-demo-result">
                  <div className="grabit-demo-verdict">
                    <span>{demoResult.category || demoSelection.agent.category}</span>
                    <strong>{demoResult.verdict || 'RESULT READY'}</strong>
                    <p>{demoResult.summary}</p>
                  </div>
                  <dl className="grabit-demo-metrics">
                    {(demoResult.metrics || []).slice(0, 4).map((metric, index) => (
                      <div key={`${metric.label || 'metric'}-${index}`}>
                        <dt>{metric.label}</dt>
                        <dd>{metric.value}</dd>
                        <small>{metric.note}</small>
                      </div>
                    ))}
                  </dl>
                  <div className="grabit-demo-proof">
                    <section>
                      <span>NEXT ACTION</span>
                      <p>{demoResult.actions?.[0] || 'Review the result before Testnet execution.'}</p>
                    </section>
                    <section>
                      <span>RISK CHECK</span>
                      <p>{demoResult.risks?.[0] || 'Live values can change after this observation.'}</p>
                    </section>
                    <footer>
                      <b>{demoResult.dataQuality || 'LIVE RESULT'}</b>
                      <span>BLOCK {demoResult.evidence?.sourceBlock || '?'}</span>
                      <span>{demoResult.evidence?.gasPriceGwei || '?'} GWEI</span>
                      <span>NO CAPITAL MOVED</span>
                    </footer>
                  </div>
                </div>
              ) : null}

              <footer className="grabit-demo-actions">
                <button
                  type="button"
                  disabled={demoRunning}
                  onClick={() => void runDemo(demoSelection.agent, demoSelection.index)}
                >
                  REPEAT OBSERVATION
                </button>
                <button
                  className="grabit-demo-primary"
                  type="button"
                  onClick={() => {
                    window.location.assign(`/activate?registry=${encodeURIComponent(demoSelection.agent.tokenId)}`);
                  }}
                >
                  OPEN TESTNET TERMINAL ↗
                </button>
              </footer>
            </section>
          </div>
        ) : null}
      </div>
    );
  }

  return (
    <main className="grabit-ganymede-launch">
      <GrabitScene />
      <div
        className="grabit-launch-interface"
        style={{
          position: 'absolute',
          inset: 0,
          zIndex: 2147483000,
          visibility: 'visible',
          opacity: 1,
          pointerEvents: 'none',
        }}
      >
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
          <button
            className="grabit-secondary-action"
            type="button"
            onClick={() => {
              setPendingAnchor('board');
              setView('store');
            }}
          >
            VIEW LEADERBOARD
          </button>
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
      </div>
    </main>
  );
}
