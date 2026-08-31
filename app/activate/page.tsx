import type { Metadata } from 'next';
import Link from 'next/link';
import { AgentCelestial, type AgentCelestialVariant } from '@/app/agent-celestial';
import {
  getCandidateByTokenId,
  getRegistryIdForLegacySlug,
} from '@/lib/marketplace-data';
import { marketplaceCandidates, type MarketplaceCategory } from '@/lib/marketplace-candidates';
import { CANARY_TASKS } from '@/lib/erc8183';
import { HireExecutionConsole } from '@/app/activate/execution-client';
import { AltanaSessionPanel } from '@/components/altana-session-panel';

export const metadata: Metadata = {
  title: 'Testnet Terminal — Grabit',
  description: 'Preview, hire and verify a BSC Testnet Agent in one observatory terminal.',
};

type ActivatePageProps = {
  searchParams: Promise<{ agent?: string; registry?: string }>;
};

const categoryVariant: Record<MarketplaceCategory, AgentCelestialVariant> = {
  Rebalancing: 'core',
  'Grid Trading': 'tech',
  'Yield Optimisation': 'income',
  'Health Factor Monitoring': 'alpha',
};

function shortName(name: string) {
  return name.replace(/^Brain on BNB\s*[—-]\s*/i, '');
}

export default async function ActivatePage({ searchParams }: ActivatePageProps) {
  const query = await searchParams;
  const tokenId = query.registry || (query.agent ? getRegistryIdForLegacySlug(query.agent) : undefined);
  const selected = getCandidateByTokenId(tokenId) || marketplaceCandidates[0];
  const variant = categoryVariant[selected.category];

  return (
    <main className={`grabit-terminal-page grabit-product-${variant}`}>
      <section className="grabit-terminal-shell" aria-label="Grabit Agent Testnet terminal">
        <header className="grabit-terminal-topbar">
          <Link className="grabit-terminal-brand" href="/" aria-label="Return to Agent Store">
            <span>G</span>
            <strong>GRABIT<small>AGENT OBSERVATORY</small></strong>
          </Link>
          <nav aria-label="Current location">
            <Link href="/">AGENT STORE</Link>
            <i aria-hidden="true">/</i>
            <b>TESTNET TERMINAL</b>
          </nav>
          <div className="grabit-terminal-network"><i /> BSC TESTNET · CHAIN 97</div>
        </header>

        <section className="grabit-terminal-hero">
          <div className="grabit-terminal-agent">
            <p>SELECTED AGENT / ERC-8004 #{selected.tokenId}</p>
            <h1>{shortName(selected.name)}</h1>
            <span>{selected.category} · {selected.price} PER JOB · TEST TOKENS ONLY</span>
          </div>

          <div className="grabit-terminal-celestial" aria-hidden="true">
            <AgentCelestial variant={variant} />
          </div>

          <ol className="grabit-terminal-flow" aria-label="Agent test flow">
            <li className="is-current"><span>01</span><b>PREVIEW</b><small>NO WALLET</small></li>
            <li><span>02</span><b>HIRE</b><small>5 TESTNET TX</small></li>
            <li><span>03</span><b>RESULT</b><small>VERIFY PROOF</small></li>
          </ol>
        </section>

        <details className="grabit-terminal-guide">
          <summary><span>?</span><b>WHAT SHOULD I TEST?</b><small>OPEN 3-MIN GUIDE</small></summary>
          <div>
            <p><b>01 / PREVIEW</b> Run the Agent without a wallet. Check its verdict, four metrics and source block.</p>
            <p><b>02 / HIRE</b> Connect chain 97, run preflight and approve exactly five visible Testnet transactions.</p>
            <p><b>03 / RESULT</b> Submit the read-only result, inspect its evidence and settle the Testnet job.</p>
          </div>
        </details>

        <div className="grabit-terminal-console">
          <HireExecutionConsole
            tokenId={selected.tokenId}
            agentName={selected.name}
            defaultTask={CANARY_TASKS[selected.tokenId]}
          />
        </div>

        <AltanaSessionPanel chainId={97} />

        <footer className="grabit-terminal-footer">
          <span>TESTNET / PRE-LAUNCH</span>
          <p>PREVIEW FIRST · SIGN TESTNET ONLY · VERIFY EVERY RESULT</p>
          <Link href="/dashboard">OPEN DASHBOARD ↗</Link>
        </footer>
      </section>
    </main>
  );
}
