'use client';

import { useEffect, useMemo, useRef, useState } from 'react';

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

const COLS = 92;
const ROWS = 46;
const SPARK_WIDTH = 96;

function priceNumber(value: string, fallback: number) {
  const parsed = Number(value.replace(/[^0-9.]/g, ''));
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

export function SlashHome({ agents }: SlashHomeProps) {
  const skyRef = useRef<HTMLPreElement>(null);
  const momentumRef = useRef(0);
  const [clock, setClock] = useState('--:--:--');
  const [indexValue, setIndexValue] = useState(1000);
  const [indexChange, setIndexChange] = useState(0);
  const [spark, setSpark] = useState('');
  const [changes, setChanges] = useState<number[]>(() => agents.map(() => 0));

  const rows = useMemo(
    () =>
      agents.slice(0, 7).map((agent, index, visibleAgents) => ({
        ...agent,
        tick: ['RBL', 'GRID', 'YLD', 'HLTH', 'AGT5', 'AGT6', 'AGT7'][index],
        numericPrice: priceNumber(agent.price, 0.02 + index * 0.01),
        weight: 1 / Math.max(visibleAgents.length, 1),
      })),
    [agents],
  );

  useEffect(() => {
    const updateClock = () => setClock(new Date().toLocaleTimeString('en-GB'));
    updateClock();
    const timer = window.setInterval(updateClock, 1000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    let seed = 74321;
    const random = () => {
      seed = (seed * 16807) % 2147483647;
      return (seed - 1) / 2147483646;
    };
    let value = 1000;
    const history = new Array(120).fill(1000);
    const momentum = rows.map(() => 0);
    const base = rows.map((row) => row.numericPrice);
    const prices = [...base];

    const makeSpark = () => {
      const slice = history.slice(-SPARK_WIDTH);
      const min = Math.min(...slice);
      const max = Math.max(...slice);
      const ramp = ' .:-=+*#%@';
      const sparkRows = 5;
      const canvas = Array.from({ length: sparkRows }, () =>
        new Array<string>(SPARK_WIDTH).fill(' '),
      );
      slice.forEach((point, column) => {
        const norm = max === min ? 0.5 : (point - min) / (max - min);
        const level = norm * sparkRows;
        for (let row = 0; row < sparkRows; row += 1) {
          const from = sparkRows - 1 - row;
          if (level >= from + 1) canvas[row][column] = '█';
          else if (level > from) canvas[row][column] = ramp[Math.floor((level - from) * 9)];
        }
      });
      return canvas.map((line) => line.join('')).join('\n');
    };

    const step = (paint: boolean) => {
      let composite = 0;
      let weightSum = 0;
      rows.forEach((row, index) => {
        momentum[index] += (random() - 0.5) * Math.max(base[index] * 0.006, 0.0001);
        momentum[index] *= 0.92;
        prices[index] = Math.max(
          0.0001,
          prices[index] + momentum[index] + (base[index] - prices[index]) * 0.01,
        );
        composite += (prices[index] / base[index]) * row.weight;
        weightSum += row.weight;
      });
      const previous = value;
      value = weightSum ? 1000 * (composite / weightSum) : 1000;
      momentumRef.current = value - previous;
      history.push(value);
      history.shift();
      if (paint) {
        setIndexValue(value);
        setIndexChange(value - 1000);
        setChanges(prices.map((price, index) => ((price - base[index]) / base[index]) * 100));
        setSpark(makeSpark());
      }
    };

    for (let index = 0; index < 120; index += 1) step(false);
    step(true);
    const timer = window.setInterval(() => step(true), 240);
    return () => window.clearInterval(timer);
  }, [rows]);

  useEffect(() => {
    const sky = skyRef.current;
    if (!sky) return;
    const stars = Array.from({ length: 90 }, () => ({
      x: Math.random() * COLS,
      y: Math.random() * ROWS,
      tw: Math.random() * Math.PI * 2,
      ch: '.·*+'.charAt(Math.floor(Math.random() * 4)),
    }));
    let frame = 0;
    let animationId = 0;

    const draw = () => {
      frame += 1;
      const grid = Array.from({ length: ROWS }, () => new Array<string>(COLS).fill(' '));
      const put = (x: number, y: number, char: string) => {
        const px = Math.round(x);
        const py = Math.round(y);
        if (px >= 0 && px < COLS && py >= 0 && py < ROWS) grid[py][px] = char;
      };

      stars.forEach((star) => {
        if (Math.sin(frame * 0.08 + star.tw) > 0.2) put(star.x, star.y, star.ch);
      });

      const jupiterX = COLS * 0.62;
      const jupiterY = ROWS * 0.5;
      const jupiterRadius = 11;
      for (let angle = 0; angle < 360; angle += 4) {
        const radians = (angle * Math.PI) / 180;
        put(
          jupiterX + Math.cos(radians) * jupiterRadius * 1.9,
          jupiterY + Math.sin(radians) * jupiterRadius,
          '@',
        );
      }
      for (let y = -jupiterRadius + 1; y < jupiterRadius; y += 1) {
        const half = Math.sqrt(1 - (y / jupiterRadius) ** 2) * jupiterRadius * 1.9;
        const band = '=~-≈'[(Math.abs(y) + Math.floor(frame * 0.05)) % 4];
        for (let x = -half + 1; x < half; x += 1) {
          const spot = x > 4 && x < 12 && y > 1 && y < 5 ? '0' : band;
          put(jupiterX + x, jupiterY + y, spot);
        }
      }

      const momentum = momentumRef.current;
      const speed = 0.03 + Math.min(Math.abs(momentum) * 0.02, 0.08);
      const orbitAngle = frame * speed;
      const moonX = jupiterX + Math.cos(orbitAngle) * 34;
      const moonY = jupiterY + Math.sin(orbitAngle) * 15;
      const moonRadius = 3;
      for (let y = -moonRadius; y <= moonRadius; y += 1) {
        const half = Math.sqrt(Math.max(0, moonRadius ** 2 - y ** 2)) * 1.8;
        for (let x = -half; x <= half; x += 1) {
          put(moonX + x, moonY + y, momentum >= 0 ? 'O' : 'o');
        }
      }
      put(moonX - 1, moonY - 1, '◦');
      for (let trail = 1; trail <= 10; trail += 1) {
        const trailAngle = orbitAngle - trail * 0.12;
        put(
          jupiterX + Math.cos(trailAngle) * 34,
          jupiterY + Math.sin(trailAngle) * 15,
          trail < 4 ? '·' : '‧',
        );
      }

      sky.textContent = grid.map((line) => line.join('')).join('\n');
      sky.dataset.direction = momentum >= 0 ? 'up' : 'down';
      animationId = window.requestAnimationFrame(draw);
    };

    animationId = window.requestAnimationFrame(draw);
    return () => window.cancelAnimationFrame(animationId);
  }, []);

  const isUp = indexChange >= 0;
  const liveCount = agents.filter((agent) => agent.live).length;

  return (
    <main className="ganymede-exact-home">
      <header className="ganymede-exact-header">
        <h1>◐ GRABIT&nbsp;INDEX</h1>
        <span className="ganymede-exact-sub">BNB AGENTS · ASCII CELESTIAL TERMINAL</span>
        <time className="ganymede-exact-clock">{clock}</time>
      </header>

      <section className="ganymede-exact-main">
        <section className="ganymede-exact-sky">
          <pre ref={skyRef} className="ganymede-exact-stars" aria-label="Animated ASCII celestial field" />
          <div className="ganymede-exact-caption">
            ORBIT: GRABIT ⟳ BNB CHAIN — flux mapped to agent activity
          </div>
        </section>

        <aside className="ganymede-exact-aside">
          <div className="ganymede-exact-index-head">
            <div>
              <div className="ganymede-exact-name">GRABIT AGENT COMPOSITE · GRT</div>
              <div className="ganymede-exact-value">{indexValue.toFixed(2)}</div>
            </div>
            <div className={'ganymede-exact-chg ' + (isUp ? 'up' : 'down')}>
              {isUp ? '+' : ''}{indexChange.toFixed(2)} ({isUp ? '+' : ''}{(indexChange / 10).toFixed(2)}%)
            </div>
          </div>

          <pre className="ganymede-exact-spark">{spark}</pre>

          <table className="ganymede-exact-table">
            <thead>
              <tr><th>AGENT</th><th>PRICE</th><th>CHG%</th><th>WEIGHT</th></tr>
            </thead>
            <tbody>
              {rows.map((agent, index) => {
                const change = changes[index] ?? 0;
                const rowIsUp = change >= 0;
                return (
                  <tr key={agent.tokenId}>
                    <td>
                      <a href={'/activate?registry=' + agent.tokenId}>
                        <span className="ganymede-exact-tick">{agent.tick}</span>{' '}
                        <span className="ganymede-exact-dim">{agent.name}</span>
                      </a>
                    </td>
                    <td>{agent.price}</td>
                    <td className={rowIsUp ? 'up' : 'down'}>{rowIsUp ? '+' : ''}{change.toFixed(2)}%</td>
                    <td>
                      <span
                        className="ganymede-exact-bar"
                        style={{
                          width: Math.max(2, agent.weight * 90),
                          background: rowIsUp ? 'var(--ganymede-up)' : 'var(--ganymede-down)',
                        }}
                      />{' '}
                      <span className="ganymede-exact-dim">{(agent.weight * 100).toFixed(0)}%</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </aside>
      </section>

      <footer className="ganymede-exact-footer">
        <span className="ganymede-exact-pill">STATUS <b>{liveCount === agents.length ? 'LIVE' : 'SYNC'}</b></span>
        <span>ENGINE <b>ascii-orbit v1</b></span>
        <span>DATA <b>BSC registry</b></span>
        <span className="ganymede-exact-footer-note">Grabit — BNB Agent Market · click an agent to open</span>
      </footer>
    </main>
  );
}
