import type { Metadata } from 'next';
import Link from 'next/link';
import { AltanaSessionPanel } from '@/components/altana-session-panel';
import { ERC8183_TESTNET } from '@/lib/erc8183';

export const metadata: Metadata = {
  title: 'Agent authority — Grabit',
  description: 'The exact calls, spending cap and expiry an agent acts under, and the control to revoke them.',
};

export default function AuthorityPage() {
  return (
    <main className="agent-detail">
      <div className="agent-detail-frame">
        <header className="agent-detail-bar">
          <p className="agent-detail-crumb">
            <Link href="/">STORE</Link> / AGENT AUTHORITY
          </p>
          <span className="network-badge">TEST NETWORK · CHAIN {ERC8183_TESTNET.chainId}</span>
        </header>
        <div className="agent-detail-body">
          <AltanaSessionPanel chainId={ERC8183_TESTNET.chainId} />
        </div>
      </div>
    </main>
  );
}
