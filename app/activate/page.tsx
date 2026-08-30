import type { Metadata } from 'next';
import Link from 'next/link';
import { SiteHeader } from '@/components/site-header';
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
    <main className="subpage">
      <SiteHeader compact homeAnchors hideWallet testnetMode />
      <div className="activate-shell simple-activate-shell">
        <Link className="breadcrumb back-link" href="/#store">← BACK TO AGENT STORE</Link>

        <section className="simple-activate-intro">
          <div className="simple-agent-title">
            <span className="simple-agent-icon">AI</span>
            <div>
              <p className="eyebrow">BSC TESTNET · SAFE DEMO</p>
              <h1>{selected.name}</h1>
              <p>Connect once, confirm the visible Testnet steps, then receive the Agent result.</p>
            </div>
          </div>
          <div className="simple-flow-strip" aria-label="Three step hire flow">
            <span className="is-current"><b>1</b> PREPARE</span>
            <span><b>2</b> HIRE</span>
            <span><b>3</b> RESULT</span>
          </div>
        </section>

        <HireExecutionConsole
          tokenId={selected.tokenId}
          agentName={selected.name}
          defaultTask={CANARY_TASKS[selected.tokenId]}
        />
      </div>
    </main>
  );
}
