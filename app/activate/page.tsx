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

function SlashLine({ character = '/' }: { character?: '/' | '=' }) {
  return <div className="slash-line" aria-hidden="true">{character.repeat(320)}</div>;
}

export default async function ActivatePage({ searchParams }: ActivatePageProps) {
  const query = await searchParams;
  const tokenId = query.registry || (query.agent ? getRegistryIdForLegacySlug(query.agent) : undefined);
  const selected = getCandidateByTokenId(tokenId) || marketplaceCandidates[0];

  return (
    <main className="slash-activate-page">
      <section className="slash-activate-shell" aria-label="Grabit Agent test terminal">
        <SlashLine />
        <header className="slash-activate-top">
          <span>/</span>
          <Link href="/">[/] AGENT STORE</Link>
          <strong>GRABIT://TEST_AGENT/{selected.tokenId}</strong>
          <b>BSC TESTNET 97 [ONLINE]</b>
          <span>/</span>
        </header>
        <SlashLine />

        <section className="slash-agent-head">
          <span>/</span>
          <div>
            <small>SELECTED AGENT / ERC-8004 #{selected.tokenId}</small>
            <h1>{selected.name}</h1>
          </div>
          <i>/</i>
          <nav aria-label="Agent test flow">
            <span>[1] PREVIEW</span><b>/</b>
            <span>[2] HIRE</span><b>/</b>
            <span>[3] RESULT</span>
          </nav>
          <span>/</span>
        </section>
        <SlashLine />

        <details className="slash-help">
          <summary>/ [?] WHAT SHOULD I TEST? /</summary>
          <div>
            <p>/ <b>NO WALLET:</b> Preview the result and check the verdict, metrics and source. /</p>
            <p>/ <b>TESTNET:</b> Connect chain 97, run preflight and confirm five visible transactions. /</p>
          </div>
        </details>
        <SlashLine />

        <div className="slash-console-frame">
          <HireExecutionConsole
            tokenId={selected.tokenId}
            agentName={selected.name}
            defaultTask={CANARY_TASKS[selected.tokenId]}
          />
        </div>

        <SlashLine />
        <footer className="slash-activate-footer">
          <span>/</span>
          <b>PREVIEW FIRST / SIGN TESTNET ONLY / VERIFY RESULT</b>
          <span>/</span>
        </footer>
        <SlashLine />
      </section>
    </main>
  );
}
