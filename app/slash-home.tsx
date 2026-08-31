'use client';

import { useEffect, useRef, useState } from 'react';

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

const MARKERS = ['RBL', 'GRID', 'YLD', 'HLTH'];
const COLS = 92;
const ROWS = 44;

function GrabitNetworkSky({ agents, selected }: { agents: SlashAgent[]; selected: number }) {
  const skyRef = useRef<HTMLPreElement>(null);

  useEffect(() => {
    const sky = skyRef.current;
    if (!sky) return;

    let seed = 56;
    const random = () => {
      seed = (seed * 16807) % 2147483647;
      return (seed - 1) / 2147483646;
    };
    const stars = Array.from({ length: 118 }, () => ({
      x: random() * COLS,
      y: random() * ROWS,
      phase: random() * Math.PI * 2,
      char: '.·*+'[Math.floor(random() * 4)],
    }));

    const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    let frame = 0;
    let animationId = 0;
    let lastPaint = 0;

    const draw = (time: number) => {
      if (time - lastPaint < 72 && !motionQuery.matches) {
        animationId = window.requestAnimationFrame(draw);
        return;
      }
      lastPaint = time;
      frame += motionQuery.matches ? 0 : 1;

      const grid = Array.from({ length: ROWS }, () => new Array<string>(COLS).fill(' '));
      const put = (x: number, y: number, char: string) => {
        const px = Math.round(x);
        const py = Math.round(y);
        if (px >= 0 && px < COLS && py >= 0 && py < ROWS) grid[py][px] = char;
      };
      const write = (x: number, y: number, value: string) => {
        [...value].forEach((char, index) => put(x + index, y, char));
      };

      stars.forEach((star) => {
        const pulse = Math.sin(frame * 0.09 + star.phase);
        if (pulse > -0.18) put(star.x, star.y, pulse > 0.72 ? '*' : star.char);
      });

      const centerX = COLS * 0.5;
      const centerY = ROWS * 0.5;

      for (let angle = 0; angle < 360; angle += 5) {
        const radians = angle * Math.PI / 180;
        const char = angle % 30 === 0 ? '+' : angle % 10 === 0 ? '·' : '.';
        put(centerX + Math.cos(radians) * 35, centerY + Math.sin(radians) * 15, char);
      }

      const bsc = [
        '          /\\          ',
        '         /==\\         ',
        '    /\\  / /\\ \\  /\\    ',
        '   /  \\/ <  > \\/  \\   ',
        '   \\  /\\  \\/  /\\  /   ',
        '    \\/  \\ == /  \\/    ',
        '         \\  /         ',
        '          \\/          ',
      ];
      bsc.forEach((line, index) => write(centerX - 12, centerY - 5 + index, line));
      write(centerX - 7, centerY + 5, '[ BSC CORE ]');

      agents.slice(0, 4).forEach((agent, index) => {
        const direction = index % 2 === 0 ? 1 : -1;
        const angle = frame * 0.014 * direction + index * (Math.PI / 2);
        const x = centerX + Math.cos(angle) * 35;
        const y = centerY + Math.sin(angle) * 15;
        const marker = `${index === selected ? '>' : '['}${MARKERS[index] ?? 'AGT'}${index === selected ? '<' : ']'}`;
        write(x - marker.length / 2, y, marker);

        for (let trail = 1; trail <= 5; trail += 1) {
          const trailAngle = angle - trail * 0.075 * direction;
          put(
            centerX + Math.cos(trailAngle) * 35,
            centerY + Math.sin(trailAngle) * 15,
            trail < 3 ? ':' : '·',
          );
        }

        if (agent.live) put(x, y - 1, index === selected ? '*' : '+');
      });

      write(3, 2, 'BNB CHAIN / ERC-8004 REGISTRY FIELD');
      write(3, ROWS - 3, 'SELECTED SIGNAL  > ' + (agents[selected]?.category ?? 'NO AGENT'));
      write(COLS - 29, ROWS - 3, 'VISUAL ACTIVITY / NOT RETURNS');

      sky.textContent = grid.map((row) => row.join('')).join('\n');
      sky.dataset.state = agents[selected]?.live ? 'live' : 'waiting';

      if (!motionQuery.matches) animationId = window.requestAnimationFrame(draw);
    };

    animationId = window.requestAnimationFrame(draw);
    return () => window.cancelAnimationFrame(animationId);
  }, [agents, selected]);

  return <pre ref={skyRef} className="ganymede-network-art" aria-label="Animated BNB Chain agent registry field" />;
}

export function SlashHome({ agents }: SlashHomeProps) {
  const [selected, setSelected] = useState(0);
  const [clock, setClock] = useState('--:--:--');
  const selectedAgent = agents[selected] ?? agents[0];
  const liveCount = agents.filter((agent) => agent.live).length;

  useEffect(() => {
    const updateClock = () => setClock(new Date().toLocaleTimeString('en-GB'));
    updateClock();
    const timer = window.setInterval(updateClock, 1000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    const handleKey = (event: KeyboardEvent) => {
      if (agents.length === 0) return;
      if (event.key === 'ArrowDown') {
        event.preventDefault();
        setSelected((value) => (value + 1) % agents.length);
      }
      if (event.key === 'ArrowUp') {
        event.preventDefault();
        setSelected((value) => (value - 1 + agents.length) % agents.length);
      }
      if (event.key === 'Enter' && selectedAgent) {
        window.location.href = `/activate?registry=${selectedAgent.tokenId}`;
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [agents.length, selectedAgent]);

  return (
    <main className="ganymede-home">
      <header className="ganymede-head">
        <h1>◆ GRABIT&nbsp;AGENT MARKET</h1>
        <span>BNB CHAIN · ERC-8004 · LIVE AGENT EXECUTION</span>
        <nav aria-label="Primary navigation">
          <a href="#agents">AGENTS</a>
          <a href="#evidence">EVIDENCE</a>
        </nav>
        <time>{clock}</time>
      </header>

      <section className="ganymede-main">
        <section className="ganymede-sky" aria-label="Agent network visualization">
          <GrabitNetworkSky agents={agents} selected={selected} />
          <p>ORBIT: FOUR LIVE DEFI CATEGORIES ⟳ BSC CORE — SELECT AN AGENT TO TRACE ITS SIGNAL</p>
        </section>

        <aside className="ganymede-console" id="agents">
          <section className="ganymede-summary">
            <div>
              <span>VERIFIED AGENTS</span>
              <strong>{String(liveCount).padStart(2, '0')}</strong>
            </div>
            <p><b>4</b> REQUIRED CATEGORIES</p>
          </section>

          {selectedAgent ? (
            <section className="ganymede-selected" id="evidence">
              <div className="ganymede-selected-head">
                <span>SELECTED / ERC-8004 #{selectedAgent.tokenId}</span>
                <b className={selectedAgent.live ? 'is-live' : 'is-waiting'}>
                  {selectedAgent.live ? '● LIVE' : '○ WAITING'}
                </b>
              </div>
              <h2>{selectedAgent.name}</h2>
              <p>{selectedAgent.category}</p>
              <pre>{`> registry.identity     ${selectedAgent.live ? 'PASS' : 'WAIT'}\n> execution.quote       ${selectedAgent.price}\n> network               BNB CHAIN\n> next_action           PREVIEW + HIRE`}</pre>
            </section>
          ) : null}

          <table className="ganymede-agent-table">
            <thead>
              <tr><th>AGENT</th><th>CATEGORY</th><th>QUOTE</th><th>STATE</th></tr>
            </thead>
            <tbody>
              {agents.map((agent, index) => (
                <tr
                  className={index === selected ? 'is-selected' : ''}
                  key={agent.tokenId}
                  onMouseEnter={() => setSelected(index)}
                >
                  <td>
                    <button type="button" onClick={() => setSelected(index)}>
                      {index === selected ? '>' : ' '}{String(index + 1).padStart(2, '0')} {agent.name}
                    </button>
                  </td>
                  <td>{agent.category}</td>
                  <td>{agent.price}</td>
                  <td className={agent.live ? 'is-live' : 'is-waiting'}>{agent.live ? 'READY' : 'WAIT'}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {selectedAgent ? (
            <a className="ganymede-primary" href={`/activate?registry=${selectedAgent.tokenId}`}>
              [ PREVIEW + HIRE SELECTED AGENT ]
            </a>
          ) : null}

          <p className="ganymede-disclosure">
            NO MOCK PNL. PERFORMANCE APPEARS ONLY AFTER A VERIFIED TESTNET RESULT.
          </p>
        </aside>
      </section>

      <footer className="ganymede-foot">
        <span>REGISTRY <b>{liveCount}/4 LIVE</b></span>
        <span>CHAIN <b>BSC</b></span>
        <span>EXECUTION <b>TESTNET_97</b></span>
        <span>MODE <b>SAFE</b></span>
        <span>↑↓ SELECT · ENTER OPEN</span>
        <strong>GRABIT — VERIFY BEFORE CAPITAL</strong>
      </footer>
    </main>
  );
}
