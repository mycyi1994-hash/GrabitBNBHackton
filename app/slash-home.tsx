'use client';

import { useEffect, useMemo, useState } from 'react';

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

const BSC_SCENE_FRAMES = [
  String.raw`                              .----[ BSC / 56 ]----.
                         .----'                       '----.
                    o----+         /\       /\             +----o
                   /     |        /  \     /  \            |     \
       [ REBALANCE ]     |   /\  / /\ \   / /\ \  /\      |     [ GRID ]
                   \     |  /  \/ /  \ \ / /  \ \/  \     |     /
                    o----+  \  /\ \  / / \ \  / /\  /     +----o
                         |   \/  \ \/ /   \ \/ /  \/      |
                         |        \  /     \  /            |
                         |         \/       \/             |
                    o----+              *                  +----o
                   /     |              |                  |     \
          [ YIELD ]      |              v                  |     [ HEALTH ]
                   \     |      .-----------------.         |     /
                    o----+------|  GRABIT AGENT   |---------+----o
                                | identity: PASS  |
                                | quote:    LIVE  |
                                | execute:  READY |
                                '--------+--------'
                                         |
                                         v
                                [ VERIFY BEFORE HIRE ]`,
  String.raw`                              .----[ BSC / 56 ]----.
                         .----'                       '----.
                    *----+         /\       /\             +----*
                   /     |        /  \     /  \            |     \
       [ REBALANCE ]     |   /\  / /\ \   / /\ \  /\      |     [ GRID ]
                   \     |  /  \/ /  \ \ / /  \ \/  \     |     /
                    o----+  \  /\ \  / / \ \  / /\  /     +----o
                         |   \/  \ \/ /   \ \/ /  \/      |
                         |        \  /     \  /            |
                         |         \/       \/             |
                    o----+              +                  +----o
                   /     |              |                  |     \
          [ YIELD ]      |              v                  |     [ HEALTH ]
                   \     |      .-----------------.         |     /
                    *----+------|  GRABIT AGENT   |---------+----*
                                | identity: PASS  |
                                | quote:    LIVE  |
                                | execute:  READY |
                                '--------+--------'
                                         |
                                         v
                                [ VERIFY BEFORE HIRE ]`,
];

function AsciiRail({ character = '=', end = '+' }: { character?: '=' | '-'; end?: '+' | ':' }) {
  return (
    <div className="ascii-v2-rail" aria-hidden="true">
      <span>{end}</span><b>{character.repeat(220)}</b><span>{end}</span>
    </div>
  );
}

export function SlashHome({ agents }: SlashHomeProps) {
  const [entered, setEntered] = useState(false);
  const [logoFrame, setLogoFrame] = useState(0);
  const [selected, setSelected] = useState(0);
  const liveCount = agents.filter((agent) => agent.live).length;
  const selectedAgent = agents[selected] ?? agents[0];

  const rankedAgents = useMemo(
    () => [...agents].sort((a, b) => Number(b.live) - Number(a.live)),
    [agents],
  );

  useEffect(() => {
    const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (motionQuery.matches) return;
    const timer = window.setInterval(() => {
      setLogoFrame((frame) => (frame + 1) % BSC_SCENE_FRAMES.length);
    }, 620);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'Enter' && !entered) setEntered(true);
      if (event.key === 'Escape' && entered) setEntered(false);
      if (!entered || agents.length === 0) return;
      if (event.key === 'ArrowDown') {
        event.preventDefault();
        setSelected((value) => (value + 1) % agents.length);
      }
      if (event.key === 'ArrowUp') {
        event.preventDefault();
        setSelected((value) => (value - 1 + agents.length) % agents.length);
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [agents.length, entered]);

  if (!entered) {
    return (
      <main className="ascii-editorial-gateway">
        <section className="ascii-editorial-page" aria-label="Enter Grabit BNB Agent Market">
          <header className="ascii-editorial-head">
            <b>GRABIT</b>
            <span>BNB AGENT MARKET / 2026</span>
            <span>INDEX 01—04</span>
          </header>

          <div className="ascii-editorial-rule" aria-hidden="true">{'-'.repeat(96)}</div>

          <section className="ascii-editorial-intro">
            <p><span>001</span> / SMART MONEY ERA</p>
            <h1>Agents you can<br />inspect before you trust.</h1>
            <div>
              <span>LIVE IDENTITIES&nbsp;&nbsp;{liveCount}/4</span>
              <span>NETWORK&nbsp;&nbsp;BNB CHAIN</span>
            </div>
          </section>

          <figure className="ascii-editorial-art">
            <pre aria-label="BNB Chain agents connected to the Grabit verification layer">{BSC_SCENE_FRAMES[logoFrame]}</pre>
            <figcaption>FIG. 01 — ONE MARKET, FOUR LIVE DEFI AGENT CATEGORIES.</figcaption>
          </figure>

          <section className="ascii-editorial-entry">
            <p>Find, compare and hire on-chain agents.<br />Identity first. Evidence always. Testnet before capital.</p>
            <button type="button" autoFocus onClick={() => setEntered(true)}>
              ENTER THE MARKET&nbsp;&nbsp;---&gt;
            </button>
          </section>

          <div className="ascii-editorial-rule" aria-hidden="true">{'-'.repeat(96)}</div>

          <footer className="ascii-editorial-foot">
            <span>01 REBALANCE</span>
            <span>02 GRID</span>
            <span>03 YIELD</span>
            <span>04 HEALTH</span>
            <b>TESTNET_97 / SAFE MODE <i aria-hidden="true">_</i></b>
          </footer>
        </section>
      </main>
    );
  }

  return (
    <main className="ascii-v2-home">
      <section className="ascii-v2-terminal" aria-label="Grabit Agent Market workspace">
        <AsciiRail />
        <header className="ascii-v2-terminal-head">
          <span>|</span>
          <div><b>GRABIT://MARKET</b><small>BNB CHAIN AGENT COMMAND CENTER</small></div>
          <nav>
            <a href="#store">[1] STORE</a>
            <a href="#leaderboard">[2] LEADERBOARD</a>
            <button type="button" onClick={() => setEntered(false)}>[ESC] EXIT</button>
          </nav>
          <span>|</span>
        </header>
        <AsciiRail character="-" />

        <div className="ascii-v2-ticker">
          <span>|</span>
          <b>STATUS :: ONLINE</b><i>{'//'}</i>
          <b>{liveCount} VERIFIED AGENTS</b><i>{'//'}</i>
          <b>CHAIN :: BSC</b><i>{'//'}</i>
          <b>MODE :: TESTNET</b>
          <span>|</span>
        </div>
        <AsciiRail character="-" />

        <div className="ascii-v2-market-grid">
          <section className="ascii-v2-store" id="store">
            <div className="ascii-v2-section-title"><span>|</span><b>==[ AGENT STORE ]==</b><small>CHOOSE ONE LIVE STRATEGY</small><span>|</span></div>
            <div className="ascii-v2-columns" aria-hidden="true">
              <span>NO.</span><span>AGENT / CATEGORY</span><span>PRICE</span><span>STATE</span><span>ACTION</span>
            </div>
            <AsciiRail character="-" end=":" />
            <div className="ascii-v2-agent-list">
              {agents.map((agent, index) => (
                <a
                  href={'/activate?registry=' + agent.tokenId}
                  className={index === selected ? 'is-selected' : ''}
                  key={agent.tokenId}
                  onMouseEnter={() => setSelected(index)}
                  onFocus={() => setSelected(index)}
                >
                  <span>{index === selected ? '>' : ' '}{String(index + 1).padStart(2, '0')}</span>
                  <span><b>{agent.name}</b><small>{agent.category} :: ERC-8004 #{agent.tokenId}</small></span>
                  <strong>{agent.price}</strong>
                  <em>{agent.live ? '[LIVE]' : '[WAIT]'}</em>
                  <i>[OPEN]</i>
                </a>
              ))}
            </div>
            <AsciiRail character="-" end=":" />
            <div className="ascii-v2-selected">
              <span>&gt; SELECTED</span>
              <b>{selectedAgent?.name ?? 'NO AGENT'}</b>
              <small>{selectedAgent ? `${selectedAgent.category} // ${selectedAgent.price}` : 'WAITING FOR REGISTRY'}</small>
              {selectedAgent ? <a href={'/activate?registry=' + selectedAgent.tokenId}>[ PREVIEW + HIRE ]</a> : null}
            </div>
          </section>

          <aside className="ascii-v2-rank" id="leaderboard">
            <div className="ascii-v2-section-title"><span>|</span><b>==[ EVIDENCE BOARD ]==</b><span>|</span></div>
            <p>RANK&nbsp;&nbsp;AGENT PROOF&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;STATE</p>
            <AsciiRail character="-" end=":" />
            <ol>
              {rankedAgents.map((agent, index) => (
                <li key={agent.tokenId}>
                  <b>#{index + 1}</b>
                  <span>{agent.category}<small>{agent.name}</small></span>
                  <strong>{agent.live ? 'READY' : 'WAIT'}</strong>
                </li>
              ))}
            </ol>
            <AsciiRail character="-" end=":" />
            <div className="ascii-v2-proof">
              <b>PROOF, NOT PROMISES.</b>
              <span>IDENTITY&nbsp; [PASS]</span>
              <span>LIVE QUOTE [PASS]</span>
              <span>RESULT&nbsp;&nbsp;&nbsp;&nbsp; [TEST]</span>
            </div>
          </aside>
        </div>

        <AsciiRail character="-" />
        <footer className="ascii-v2-terminal-foot">
          <span>|</span>
          <b>UP/DOWN = SELECT&nbsp;&nbsp; // &nbsp;&nbsp;ENTER = OPEN&nbsp;&nbsp; // &nbsp;&nbsp;ESC = EXIT</b>
          <strong>TESTNET_97 :: SAFE MODE</strong>
          <span>|</span>
        </footer>
        <AsciiRail />
      </section>
    </main>
  );
}
