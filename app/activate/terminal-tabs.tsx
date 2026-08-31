'use client';

/**
 * The detail page's tab strip, ported from Ganymede's product detail surface.
 *
 * Two panels rather than five: the Agent's own run-and-hire console, and the
 * authority it acts under. They are separated because the second is what the
 * user grants and revokes, and burying it under the console is what put it out
 * of reach before.
 */
import { useState, type ReactNode } from 'react';

type Tab = { id: string; label: string; panel: ReactNode };

export function TerminalTabs({ tabs }: { tabs: Tab[] }) {
  const [active, setActive] = useState(tabs[0]?.id);
  const current = tabs.find((tab) => tab.id === active) ?? tabs[0];

  return (
    <>
      <div className="product-tabs" role="tablist" aria-label="Testnet terminal sections">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            id={`terminal-tab-${tab.id}`}
            role="tab"
            type="button"
            aria-selected={tab.id === current?.id}
            aria-controls={`terminal-panel-${tab.id}`}
            className={tab.id === current?.id ? 'is-active' : ''}
            onClick={() => setActive(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <section
        key={current?.id}
        id={`terminal-panel-${current?.id}`}
        role="tabpanel"
        aria-labelledby={`terminal-tab-${current?.id}`}
        className="product-tab-panel"
      >
        {current?.panel}
      </section>
    </>
  );
}
