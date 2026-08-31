import type { Metadata } from 'next';
import Link from 'next/link';
import {
  getCandidateByTokenId,
  getRegistryIdForLegacySlug,
} from '@/lib/marketplace-data';
import { marketplaceCandidates } from '@/lib/marketplace-candidates';
import { CANARY_TASKS } from '@/lib/erc8183';
import { HireExecutionConsole } from '@/app/activate/execution-client';

export const metadata: Metadata = {
  title: 'Test an Agent — Grabit',
  description: 'Hire a BSC Testnet Agent and verify its result in one guided flow.',
};

type ActivatePageProps = {
  searchParams: Promise<{ agent?: string; registry?: string }>;
};

export default async function ActivatePage({ searchParams }: ActivatePageProps) {
  const query = await searchParams;
  const tokenId = query.registry || (query.agent ? getRegistryIdForLegacySlug(query.agent) : undefined);
  const selected = getCandidateByTokenId(tokenId) || marketplaceCandidates[0];

  return (
    <main className="ascii-activate-page">
      <section className="ascii-activate-shell" aria-label="Grabit Agent test terminal">
        <header className="ascii-activate-top">
          <Link href="/">[/] AGENT STORE</Link>
          <strong>GRABIT://TEST_AGENT/{selected.tokenId}</strong>
          <span>BSC TESTNET 97 [ONLINE]</span>
        </header>

        <section className="ascii-agent-head">
          <div>
            <small>SELECTED AGENT · ERC-8004 #{selected.tokenId}</small>
            <h1>{selected.name}</h1>
          </div>
          <nav aria-label="Agent test flow">
            <span className="is-active">[1] PREVIEW</span>
            <span>[2] HIRE</span>
            <span>[3] RESULT</span>
          </nav>
        </section>

        <details className="ascii-help">
          <summary>[?] WHAT SHOULD I TEST?</summary>
          <div>
            <p><b>NO WALLET:</b> Preview the result and check the verdict, metrics and source.</p>
            <p><b>TESTNET:</b> Connect chain 97, run preflight and confirm five visible transactions.</p>
          </div>
        </details>

        <HireExecutionConsole
          tokenId={selected.tokenId}
          agentName={selected.name}
          defaultTask={CANARY_TASKS[selected.tokenId]}
        />
      </section>
    </main>
  );
}
