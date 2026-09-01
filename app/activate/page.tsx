import type { Metadata } from 'next';
import Link from 'next/link';
import { AgentDetail } from '@/app/activate/detail-client';
import {
  getCandidateByTokenId,
  getRegistryIdForLegacySlug,
} from '@/lib/marketplace-data';
import { marketplaceCandidates } from '@/lib/marketplace-candidates';
import { agentProfiles } from '@/lib/agent-profiles';
import { candidateEvidence, ladderState } from '@/lib/verification-ladder';
import { ERC8183_TESTNET } from '@/lib/erc8183';

export const metadata: Metadata = {
  title: 'Agent detail — Grabit',
  description: 'Read an agent’s verification evidence, run it free, and see exactly what it may do.',
};

type ActivatePageProps = {
  searchParams: Promise<{ agent?: string; registry?: string }>;
};

function compact(value: string) {
  return `${value.slice(0, 8)}…${value.slice(-4)}`;
}

function shortName(name: string) {
  return name.replace(/^Brain on BNB\s*[—-]\s*/i, '');
}

export default async function ActivatePage({ searchParams }: ActivatePageProps) {
  const query = await searchParams;
  const tokenId = query.registry || (query.agent ? getRegistryIdForLegacySlug(query.agent) : undefined);
  const selected = getCandidateByTokenId(tokenId) || marketplaceCandidates[0];
  const profile = agentProfiles[selected.category];
  const ladder = ladderState(candidateEvidence());

  return (
    <main className="agent-detail">
      <div className="agent-detail-frame">
        <header className="agent-detail-bar">
          <div className="agent-detail-bar-left">
            <Link className="detail-back" href="/">
              <span aria-hidden="true">←</span> ALL AGENTS
            </Link>
            <p className="agent-detail-crumb">
              {profile.crumb} / #{selected.tokenId} · {shortName(selected.name).toUpperCase()}
            </p>
          </div>
          <span className="network-badge">TEST NETWORK · CHAIN {ERC8183_TESTNET.chainId}</span>
        </header>

        <AgentDetail
          chainId={ERC8183_TESTNET.chainId}
          explorerUrl={ERC8183_TESTNET.explorerUrl}
          ladder={ladder}
          agent={{
            tokenId: selected.tokenId,
            crumb: profile.crumb,
            name: shortName(selected.name),
            headline: profile.headline,
            price: selected.price.replace('$U', 'test $U'),
            owner: compact(selected.owner),
            observedAt: selected.observedAt,
            demoTask: profile.demoTask,
            siblings: marketplaceCandidates
              .filter((entry) => entry.tokenId !== selected.tokenId)
              .map((entry) => ({ tokenId: entry.tokenId, name: shortName(entry.name) })),
          }}
        />
      </div>
    </main>
  );
}
