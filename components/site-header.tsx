type SiteHeaderProps = {
  active?: 'explore' | 'compare' | 'dashboard';
  compact?: boolean;
};

export function SiteHeader({ active = 'explore', compact = false }: SiteHeaderProps) {
  const { account, hasProvider, connecting, isTestnet, error, connect } = useBscWallet();
  const walletLabel = connecting
    ? 'Connecting...'
    : account
      ? account.slice(0, 6) + '...' + account.slice(-4) + (isTestnet ? ' · Testnet' : ' · Switch')
      : hasProvider
        ? 'Connect wallet'
        : 'Wallet unavailable';

  return (
    <nav className={'topbar win95-taskbar' + (compact ? ' topbar-compact' : '')} aria-label="Windows taskbar navigation">
      <a href="/" className="brand" aria-label="Agent Market home">
        <span className="brand-mark">▦</span>
        <span>Start</span>
      </a>

      <div className="nav-links">
        <a className={active === 'explore' ? 'active' : ''} href="/">Agent Explorer</a>
        <a className={active === 'compare' ? 'active' : ''} href="/compare">Compare</a>
        <a className={active === 'dashboard' ? 'active' : ''} href="/dashboard">Dashboard</a>
      </div>

      <button className="wallet-button" type="button" onClick={() => void connect().catch(() => undefined)} disabled={connecting} title={error ?? 'Connect an EIP-1193 wallet to BSC Testnet'}>
        <span className={'wallet-dot ' + (account && isTestnet ? 'is-connected' : '')} /> {walletLabel}
      </button>
      <span className="taskbar-clock">BSC 97</span>
    </nav>
  );
}
'use client';

import { useBscWallet } from '@/components/use-bsc-wallet';
