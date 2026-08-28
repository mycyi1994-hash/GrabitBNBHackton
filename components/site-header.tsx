type SiteHeaderProps = {
  active?: 'explore' | 'compare' | 'dashboard';
  compact?: boolean;
};

export function SiteHeader({ active = 'explore', compact = false }: SiteHeaderProps) {
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

      <button className="wallet-button" type="button">
        <span className="wallet-dot" /> Wallet: offline
      </button>
      <span className="taskbar-clock">BSC 56</span>
    </nav>
  );
}
