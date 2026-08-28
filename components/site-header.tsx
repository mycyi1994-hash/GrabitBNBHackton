type SiteHeaderProps = {
  active?: 'explore' | 'compare' | 'dashboard';
  compact?: boolean;
};

export function SiteHeader({ active = 'explore', compact = false }: SiteHeaderProps) {
  return (
    <nav className={'topbar' + (compact ? ' topbar-compact' : '')}>
      <a href="/" className="brand" aria-label="Agent Market home">
        <span className="brand-mark">▦</span>
        <span>AGENTMKT.EXE</span>
        <span className="chain-pill">BSC TESTNET</span>
      </a>

      <div className="nav-links">
        <a className={active === 'explore' ? 'active' : ''} href="/#explore">Explore</a>
        <a className={active === 'compare' ? 'active' : ''} href="/compare">Compare</a>
        <a href="/#activity">Activity</a>
        <a className={active === 'dashboard' ? 'active' : ''} href="/dashboard">Dashboard</a>
      </div>

      <button className="wallet-button" type="button">
        <span className="wallet-dot" /> CONNECT_WALLET
      </button>
    </nav>
  );
}
