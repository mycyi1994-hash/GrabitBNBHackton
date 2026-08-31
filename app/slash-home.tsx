'use client';

import { AgentCelestial, type AgentCelestialVariant } from '@/app/agent-celestial';
import { GrabitScene } from '@/app/grabit-scene';
import Link from 'next/link';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ActiveAgents } from '@/components/active-agents';
import { EvidenceLeaderboard } from '@/components/evidence-leaderboard';
import { StoreGrid, type StoreAgent } from '@/components/store-grid';
import { agentProfiles as agentProfileMap } from '@/lib/agent-profiles';
import { marketplaceCategoryOrder } from '@/lib/marketplace-candidates';

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
  observedAt: string;
};

type VerificationGate = {
  identityRegistered: boolean;
  endpointReachable: boolean;
  quoteAccepted: boolean;
  taskDelivered: boolean;
  jobSettled: boolean;
};

type DiscoveredRow = {
  category: string;
  tokenId: string;
  name: string;
  level: string;
  blocker: string;
  observedAt: string;
};

type SlashHomeProps = {
  agents: SlashAgent[];
  gate: VerificationGate;
  ownerConcentration: number;
  discovered: DiscoveredRow[];
};

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

const agentCodes = marketplaceCategoryOrder.map((category) => agentProfileMap[category].code);
const variants: AgentCelestialVariant[] = ['core', 'tech', 'income', 'alpha'];
// One source with the terminal: the same Agent must not be described twice.
const agentProfiles = marketplaceCategoryOrder.map((category) => agentProfileMap[category]);

function shortName(name: string) {
  return name.replace(/^Brain on BNB\s*[—-]\s*/i, '');
}

export function SlashHome({ agents, gate, ownerConcentration, discovered }: SlashHomeProps) {
  const [view, setView] = useState<'landing' | 'store'>('landing');
  const [demoSelection, setDemoSelection] = useState<DemoSelection | null>(null);
  const [demoResult, setDemoResult] = useState<DemoResult | null>(null);
  const [demoError, setDemoError] = useState<string | null>(null);
  const [demoRunning, setDemoRunning] = useState(false);
  const [pendingAnchor, setPendingAnchor] = useState<'board' | 'active' | null>(null);
  const storeRef = useRef<HTMLElement>(null);
  const boardRef = useRef<HTMLDivElement>(null);
  const activeRef = useRef<HTMLDivElement>(null);
  const visibleAgents = agents.slice(0, 4);
  const storeAgents: StoreAgent[] = visibleAgents.map((agent, index) => ({
    tokenId: agent.tokenId,
    crumb: agentProfileMap[marketplaceCategoryOrder[index]].crumb,
    name: agent.name.replace(/^Brain on BNB\s*[—-]\s*/i, ''),
    job: agentProfileMap[marketplaceCategoryOrder[index]].headline,
    price: agent.price.replace('$U', 'test $U'),
    observedAt: agent.observedAt,
  }));
  const firstAgent = visibleAgents[0];

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

          <section className="store-surface" ref={storeRef} aria-label="Agent marketplace">
            <StoreGrid
              agents={storeAgents}
              discovered={discovered}
              runningTokenId={demoRunning ? (demoSelection?.agent.tokenId ?? null) : null}
              onPreview={(tokenId) => {
                const index = visibleAgents.findIndex((entry) => entry.tokenId === tokenId);
                if (index >= 0) void runDemo(visibleAgents[index], index);
              }}
            />
          </section>

          <div ref={boardRef}>
            <EvidenceLeaderboard
              agents={visibleAgents}
              gate={gate}
              ownerConcentration={ownerConcentration}
              discovered={discovered}
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
        <dl className="grabit-launch-readiness" aria-label="Verification readiness">
          <div>
            <dt>IDENTITY</dt>
            <dd>{gate.identityRegistered ? `${visibleAgents.length} / ${visibleAgents.length}` : `0 / ${visibleAgents.length}`}</dd>
            <small>ERC-8004 on chain 56</small>
          </div>
          <div>
            <dt>ENDPOINT</dt>
            <dd>{gate.endpointReachable ? `${visibleAgents.length} / ${visibleAgents.length}` : `0 / ${visibleAgents.length}`}</dd>
            <small>A2A reached</small>
          </div>
          <div className="is-pending">
            <dt>DELIVERED</dt>
            <dd>{gate.taskDelivered ? `${visibleAgents.length} / ${visibleAgents.length}` : `0 / ${visibleAgents.length}`}</dd>
            <small>No paid task yet</small>
          </div>
          <div className="is-pending">
            <dt>SETTLED JOBS</dt>
            <dd>{gate.jobSettled ? '1' : '0'}</dd>
            <small>ERC-8183 escrow</small>
          </div>
        </dl>
        <p className="grabit-launch-next">
          <b>NEXT</b> Run any Agent read-only, then open the Testnet terminal to grant a scoped
          session and hire one.
        </p>

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
