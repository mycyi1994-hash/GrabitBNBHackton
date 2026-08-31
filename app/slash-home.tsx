'use client';

import { GrabitScene } from '@/app/grabit-scene';
import Link from 'next/link';

type SlashAgent = {
  tokenId: string;
  name: string;
  category: string;
  price: string;
  live: boolean;
};

type SlashHomeProps = {
  agents: SlashAgent[];
};

const agentCodes = ['RBL', 'GRID', 'YLD', 'HLTH'];

export function SlashHome({ agents }: SlashHomeProps) {
  const visibleAgents = agents.slice(0, 4);
  const firstAgent = visibleAgents[0];

  return (
    <main className="grabit-ganymede-launch">
      <GrabitScene />

      <header className="grabit-launch-nav">
        <Link className="grabit-wordmark" href="/" aria-label="Grabit home">
          <span>G</span>
          <b>GRABIT AGENT MARKET<small>BNB AGENT OBSERVATORY</small></b>
        </Link>
        <nav className="grabit-main-nav" aria-label="Primary navigation">
          <a href="#agent-universe">AGENTS</a>
          <a href="/dashboard">LEADERBOARD</a>
        </nav>
        {firstAgent ? (
          <a className="grabit-testnet-link" href={'/activate?registry=' + firstAgent.tokenId}>
            <i /> OPEN TESTNET
          </a>
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
          <a className="grabit-primary-action" href="#agent-universe">
            EXPLORE AGENTS <span aria-hidden="true">↗</span>
          </a>
          <a className="grabit-secondary-action" href="/dashboard">VIEW LEADERBOARD</a>
        </div>
        <div className="grabit-assurance">
          <span>IDENTITY VERIFIED</span>
          <span>PERMISSIONS VISIBLE</span>
          <span>TESTNET FIRST</span>
        </div>
      </section>

      <aside className="grabit-agent-index" id="agent-universe" aria-label="Agent universe">
        <span className="grabit-agent-index-label">AGENT UNIVERSE / {String(visibleAgents.length).padStart(2, '0')}</span>
        {visibleAgents.map((agent, index) => (
          <a
            key={agent.tokenId}
            className={'grabit-agent-' + String(index + 1)}
            href={'/activate?registry=' + agent.tokenId}
          >
            <i>{String(index + 1).padStart(2, '0')}</i>
            <span>
              <b>{agentCodes[index] ?? 'AGT'}</b>
              <small>{agent.category}</small>
            </span>
            <em>{agent.price}</em>
          </a>
        ))}
      </aside>

      <p className="grabit-launch-disclosure">
        <span>TESTNET / PRE-LAUNCH</span>
        Agent performance is shown only after verified execution. No mainnet capital moves from this screen.
      </p>
    </main>
  );
}
