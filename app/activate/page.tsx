import type { Metadata } from 'next';
import { PrototypeNote } from '@/components/prototype-note';
import { SiteHeader } from '@/components/site-header';
import {
  getCandidateByTokenId,
  getRegistryIdForLegacySlug,
} from '@/lib/marketplace-data';
import { marketplaceCandidates } from '@/lib/marketplace-candidates';
import { CANARY_TASKS } from '@/lib/erc8183';
import { HireExecutionConsole } from '@/app/activate/execution-client';

export const metadata: Metadata = {
  title: 'Execution gate — Agent Market',
  description: 'Review what must be verified before a BSC DeFi agent can be hired.',
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
      <SiteHeader />
      <div className="activate-shell evidence-shell">
        <PrototypeNote />
        <a className="breadcrumb back-link" href={'/registry/' + selected.tokenId}>← Back to registry evidence</a>

        <div className="execution-gate-layout">
          <section className="execution-lock execution-live-intro">
            <pre className="lock-ascii" aria-hidden="true">{'  __________________\n / ________________ \\\n| | GRABIT.EXE      | |\n| | > HIRE AGENT_  | |\n| |________________| |\n \\_____[______]____/'}</pre>
            <p className="eyebrow">ERC-8183 mainnet console</p>
            <h1>Five signatures. Zero hidden calls.</h1>
            <p>The plan is verified against BSC mainnet before the wallet opens. No transaction runs automatically; only the final Fund step moves 0.10 $U into escrow.</p>
          </section>

          <section className="execution-checklist">
            <header className="panel-heading">
              <div><p className="eyebrow">Selected agent</p><h2>{selected.name}</h2></div>
              <span className="protocol-pill">#{selected.tokenId}</span>
            </header>
            <div className="gate-checklist">
              <div className="is-complete"><span>✓</span><p><strong>ERC-8004 identity</strong><small>Recorded on BSC chain 56</small></p></div>
              <div className="is-complete"><span>✓</span><p><strong>A2A endpoint</strong><small>Reachable during recorded preflight</small></p></div>
              <div className="is-complete"><span>✓</span><p><strong>Quote negotiation</strong><small>{selected.price} quote accepted</small></p></div>
              <div><span>4</span><p><strong>Task delivery</strong><small>No paid result inspected</small></p></div>
              <div><span>5</span><p><strong>Onchain settlement</strong><small>No completed ERC-8183 Job receipt</small></p></div>
            </div>
            <div className="execution-note"><strong>Current proof level</strong><p>The contracts and quote path are verified. A paid Grabit Job is still 0 / 1 until you complete the five wallet confirmations and the deliverable arrives.</p></div>
            <div className="win95-actions">
              <a href={'/registry/' + selected.tokenId}>Open identity evidence</a>
              <a href="/dashboard">Return to dashboard</a>
            </div>
          </section>
        </div>
        <HireExecutionConsole
          tokenId={selected.tokenId}
          agentName={selected.name}
          defaultTask={CANARY_TASKS[selected.tokenId]}
        />
      </div>
    </main>
  );
}
