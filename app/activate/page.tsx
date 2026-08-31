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

function AsciiRail({ character = '=' }: { character?: '-' | '=' }) {
  return (
    <div className="ascii-v2-rail" aria-hidden="true">
      <span>+</span><b>{character.repeat(220)}</b><span>+</span>
    </div>
  );
}

export default async function ActivatePage({ searchParams }: ActivatePageProps) {
  const query = await searchParams;
  const tokenId = query.registry || (query.agent ? getRegistryIdForLegacySlug(query.agent) : undefined);
  const selected = getCandidateByTokenId(tokenId) || marketplaceCandidates[0];

  return (
    <main className="slash-activate-page ascii-v2-execute">
      <section className="slash-activate-shell" aria-label="Grabit Agent test terminal">
        <AsciiRail />
        <header className="slash-activate-top">
          <span>|</span>
          <Link href="/">[&lt;] AGENT STORE</Link>
          <strong>GRABIT://TEST_AGENT/{selected.tokenId}</strong>
          <b>TESTNET_97 :: ONLINE</b>
          <span>|</span>
        </header>
        <AsciiRail character="-" />

        <section className="slash-agent-head">
          <span>|</span>
          <div>
            <small>==[ SELECTED AGENT ]== &nbsp; ERC-8004 #{selected.tokenId}</small>
            <h1>{selected.name}</h1>
          </div>
          <i>::</i>
          <nav aria-label="Agent test flow">
            <span>[1] PREVIEW</span><b>---&gt;</b>
            <span>[2] HIRE</span><b>---&gt;</b>
            <span>[3] RESULT</span>
          </nav>
          <span>|</span>
        </section>
        <AsciiRail character="-" />

        <details className="slash-help">
          <summary>[?] WHAT SHOULD I TEST? &nbsp; &gt;&gt; OPEN GUIDE</summary>
          <div>
            <p>&gt; <b>NO WALLET:</b> Preview the result and check the verdict, metrics and source.</p>
            <p>&gt; <b>TESTNET:</b> Connect chain 97, run preflight and confirm five visible transactions.</p>
          </div>
        </details>
        <AsciiRail character="-" />

        <div className="slash-console-frame">
          <HireExecutionConsole
            tokenId={selected.tokenId}
            agentName={selected.name}
            defaultTask={CANARY_TASKS[selected.tokenId]}
          />
        </div>

        <AsciiRail character="-" />
        <footer className="slash-activate-footer">
          <span>|</span>
          <b>PREVIEW FIRST &nbsp; // &nbsp; SIGN TESTNET ONLY &nbsp; // &nbsp; VERIFY RESULT</b>
          <span>|</span>
        </footer>
        <AsciiRail />
      </section>
    </main>
  );
}
