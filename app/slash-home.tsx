'use client';

import { useEffect, useState } from 'react';

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

const BSC_ASCII = String.raw`
              /\
             /  \
        /\  / /\ \  /\
       /  \/ /  \ \/  \
       \  /\ \  / /\  /
        \/  \ \/ /  \/
             \  /
              \/`;

function SlashLine({ character = '/' }: { character?: '/' | '-' | '=' }) {
  return <div className="slash-line" aria-hidden="true">{character.repeat(320)}</div>;
}

export function SlashHome({ agents }: SlashHomeProps) {
  const [entered, setEntered] = useState(false);
  const liveCount = agents.filter((agent) => agent.live).length;

  useEffect(() => {
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'Enter' && !entered) setEntered(true);
      if (event.key === 'Escape' && entered) setEntered(false);
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [entered]);

  if (!entered) {
    return (
      <main className="slash-gateway">
        <section className="slash-gate-console" aria-label="Enter Grabit BNB Agent Market">
          <SlashLine />
          <header><span>/</span><strong>GRABIT://BNB_AGENT_MARKET</strong><span>/</span></header>
          <SlashLine />

          <div className="slash-gate-center">
            <div className="slash-logo-orbit" aria-label="Rotating ASCII BSC logo">
              <pre>{BSC_ASCII}</pre>
            </div>
            <p>BNB SMART CHAIN / AGENT EXECUTION NETWORK</p>
            <button type="button" autoFocus onClick={() => setEntered(true)}>
              [ ENTER GRABIT ]
            </button>
            <small>/ PRESS ENTER / TESTNET READY / NO MAINNET SPENDING /</small>
          </div>

          <SlashLine />
          <footer><span>/</span><b>BSC 56 ONLINE</b><b>AGENTS {liveCount}/4 LIVE</b><span>/</span></footer>
          <SlashLine />
        </section>
      </main>
    );
  }

  return (
    <main className="slash-home">
      <section className="slash-workspace" aria-label="Grabit Agent Market workspace">
        <SlashLine />
        <header className="slash-workspace-head">
          <span>/</span>
          <strong>GRABIT://COMMAND_CENTER</strong>
          <nav>
            <a href="#store">[S] STORE</a>
            <a href="#leaderboard">[L] LEADERBOARD</a>
            <button type="button" onClick={() => setEntered(false)}>[ESC] EXIT</button>
          </nav>
          <span>/</span>
        </header>
        <SlashLine />

        <section className="slash-status">
          <span>/</span>
          <b>AGENTS {liveCount}/4 LIVE</b><i>/</i>
          <b>QUOTES 4/4 READY</b><i>/</i>
          <b>RESULTS 0/4 TESTED</b><i>/</i>
          <b>JOBS 0 ACTIVE</b>
          <span>/</span>
        </section>
        <SlashLine />

        <div className="slash-main-grid">
          <section className="slash-panel slash-store" id="store">
            <SlashLine />
            <header><span>/</span><b>AGENT STORE</b><small>SELECT ONE JOB</small><span>/</span></header>
            <SlashLine />
            <div className="slash-agent-list">
              {agents.map((agent, index) => (
                <div className="slash-agent-entry" key={agent.tokenId}>
                  <a href={'/activate?registry=' + agent.tokenId}>
                    <span>/</span>
                    <strong>{agent.tokenId === '304493' ? '>' : ' '}{String(index + 1).padStart(2, '0')}</strong>
                    <span><b>{agent.name}</b><small>{agent.category} / ERC-8004 #{agent.tokenId}</small></span>
                    <i>/</i>
                    <span>IDENTITY {agent.live ? 'PASS' : 'WAIT'}<br />QUOTE {agent.price}</span>
                    <i>/</i>
                    <b>[ OPEN ]</b>
                    <span>/</span>
                  </a>
                  <SlashLine character="-" />
                </div>
              ))}
            </div>
            <SlashLine />
          </section>

          <div className="slash-side">
            <section className="slash-panel slash-leader" id="leaderboard">
              <SlashLine />
              <header><span>/</span><b>EVIDENCE LEADERBOARD</b><small>NO MOCK PNL</small><span>/</span></header>
              <SlashLine />
              {agents.map((agent, index) => (
                <div className="slash-leader-entry" key={agent.tokenId}>
                  <a href={'/activate?registry=' + agent.tokenId}>
                    <span>/</span>
                    <b>{String(index + 1).padStart(2, '0')}</b>
                    <span>{agent.category}<small>{agent.name}</small></span>
                    <i>/</i>
                    <strong>READY</strong>
                    <span>/</span>
                  </a>
                  <SlashLine character="-" />
                </div>
              ))}
              <SlashLine />
            </section>

            <section className="slash-panel slash-command">
              <SlashLine />
              <header><span>/</span><b>NEXT COMMAND</b><small>TESTNET 97</small><span>/</span></header>
              <SlashLine />
              <pre>{String.raw`
/ $ select yield_agent
/ $ preview live_rates
/ $ connect testnet_wallet
/ $ hire --limit 0.10_USD
/ _`}</pre>
              <a href="/activate?registry=304493">[ ENTER / RUN YIELD AGENT ]</a>
              <SlashLine />
            </section>
          </div>
        </div>

        <SlashLine />
        <footer className="slash-footer">
          <span>/</span>
          <b>IDENTITY 4/4 / QUOTE 4/4 / RESULT 0/4</b>
          <b>ESC EXIT / ENTER OPEN</b>
          <span>/</span>
        </footer>
        <SlashLine />
      </section>
    </main>
  );
}
