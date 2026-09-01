'use client';

import { type ReactNode, useEffect } from 'react';

/**
 * Page-transition shell.
 *
 * Same-origin link clicks are intercepted so the outgoing page can fade before
 * the navigation commits, which is what keeps the workspace from flashing white
 * between routes. Everything else — modified clicks, new tabs, downloads,
 * cross-origin links and in-page anchors — is left to the browser.
 *
 * This used to also carry a Win95 click-sound layer and a fixed "SFX ON/OFF"
 * button pinned to the bottom-left corner. The button survived the redesign
 * only as a leftover: it sat outside every current screen's frame, and the
 * clearance reserved for it pushed full-height pages past the viewport.
 */
export function RetroInterface({ children }: { children: ReactNode }) {
  useEffect(() => {
    const restorePage = () => document.documentElement.classList.remove('page-is-leaving');
    restorePage();
    window.addEventListener('pageshow', restorePage);
    return () => window.removeEventListener('pageshow', restorePage);
  }, []);

  useEffect(() => {
    const handleClick = (event: MouseEvent) => {
      const target = event.target instanceof Element ? event.target : null;
      const control = target?.closest('a[href]');
      if (!(control instanceof HTMLAnchorElement)) return;

      if (
        event.defaultPrevented ||
        event.button !== 0 ||
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey ||
        control.target === '_blank' ||
        control.hasAttribute('download')
      ) {
        return;
      }

      const destination = new URL(control.href, window.location.href);
      if (destination.origin !== window.location.origin) return;

      // An in-page anchor is not a navigation; let the browser scroll to it.
      if (
        destination.pathname === window.location.pathname &&
        destination.search === window.location.search &&
        destination.hash
      ) {
        return;
      }

      event.preventDefault();
      document.documentElement.classList.add('page-is-leaving');
      window.setTimeout(() => window.location.assign(destination.href), 190);
    };

    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, []);

  return <div className="page-transition-stage">{children}</div>;
}
