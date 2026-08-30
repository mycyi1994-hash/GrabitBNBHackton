'use client';
/* eslint-disable @next/next/no-html-link-for-pages */

import { BSC_MAINNET, useBscWallet } from '@/components/use-bsc-wallet';

type SiteHeaderProps = {
  active?: 'explore' | 'compare' | 'dashboard';
  compact?: boolean;
  homeAnchors?: boolean;
};

export function SiteHeader({ active = 'explore', compact = false, homeAnchors = false }: SiteHeaderProps) {
  const { account, chainId, hasProvider, connecting, isMainnet, error, connect } = useBscWallet();
  const walletLabel = connecting
    ? 'Connecting...'
    : account
      ? account.slice(0, 6) + '...' + account.slice(-4) + (isMainnet ? ' · Mainnet' : ` · Chain ${chainId ?? '?'}`)
      : hasProvider
        ? 'Connect wallet'
        : 'Wallet unavailable';

  return (
    <>
      {error && (
        <aside className="wallet-recovery" role="alert" aria-live="assertive">
          <header><strong>NETWORK CONNECTION FAILED</strong><span>!</span></header>
          <p>{error}</p>
          <dl>
            <div><dt>RPC</dt><dd>{BSC_MAINNET.rpcUrls[0]}</dd></div>
            <div><dt>CHAIN</dt><dd>56 / BNB</dd></div>
          </dl>
          <div className="wallet-recovery-actions">
            <button type="button" onClick={() => void connect().catch(() => undefined)} disabled={connecting}>Retry wallet</button>
            <a href="https://docs.bnbchain.org/bnb-smart-chain/developers/wallet-configuration/" target="_blank" rel="noreferrer">Manual settings</a>
          </div>
        </aside>
      )}
      <nav className={'topbar win95-taskbar' + (compact ? ' topbar-compact' : '')} aria-label="Windows taskbar navigation">
        <a href="/" className="brand" aria-label="Agent Market home">
          <span className="brand-mark">▦</span>
          <span>Start</span>
        </a>

        <div className="nav-links">
          {homeAnchors ? (
            <span className="home-task-label">C:\GRABIT\COMMAND_CENTER</span>
          ) : (
            <>
              <a className={active === 'explore' ? 'active' : ''} href="/">Main screen</a>
              <a className={active === 'compare' ? 'active' : ''} href="/compare">Leaderboard</a>
              <a className={active === 'dashboard' ? 'active' : ''} href="/dashboard">Dashboard</a>
            </>
          )}
        </div>

        <button className="wallet-button" type="button" onClick={() => void connect().catch(() => undefined)} disabled={connecting} title={error ?? 'Connect an EIP-1193 wallet. This global button never switches networks.'}>
          <span className={'wallet-dot ' + (account && isMainnet ? 'is-connected' : '')} /> {walletLabel}
        </button>
        <span className="taskbar-clock">BSC 56</span>
      </nav>
    </>
  );
}
