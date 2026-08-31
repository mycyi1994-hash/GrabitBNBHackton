import type { Metadata } from 'next';
import Image from 'next/image';
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
    <main className="subpage activate-page">
      <SiteHeader compact homeAnchors hideWallet testnetMode />
      <div className="crt-demo-stage">
        <Image
          className="crt-workstation-art"
          src="/assets/crt-workstation-demo.png"
          alt="A late 1990s CRT workstation with two speakers and a keyboard"
          width={1536}
          height={1024}
          priority
        />

        <section className="crt-screen-surface" aria-label="Grabit Agent terminal">
          <div className="activate-shell simple-activate-shell">
            <Link className="breadcrumb back-link" href="/#store">← AGENT STORE</Link>

            <section className="simple-activate-intro">
              <div className="simple-agent-title">
                <span className="simple-agent-icon">AI</span>
                <div>
                  <p className="eyebrow">BSC TESTNET · SAFE DEMO</p>
                  <h1>{selected.name}</h1>
                  <p>Preview the strategy, connect Testnet, then hire the Agent.</p>
                </div>
              </div>
              <div className="simple-flow-strip" aria-label="Three step hire flow">
                <span className="is-current"><b>1</b> PREVIEW</span>
                <span><b>2</b> HIRE</span>
                <span><b>3</b> RESULT</span>
              </div>
            </section>

            <details className="user-test-checklist">
              <summary>F1 HELP · WHAT SHOULD I TEST?</summary>
              <div className="user-test-checklist-grid">
                <section>
                  <strong>TEST NOW · NO WALLET</strong>
                  <ol>
                    <li>Click <b>PREVIEW AGENT RESULT</b>.</li>
                    <li>Confirm a verdict and four large metrics appear.</li>
                    <li>Confirm it says <b>PREVIEW</b>, <b>NO JOB</b> and <b>NO CAPITAL MOVED</b>.</li>
                    <li>Return to the Store and repeat for all four Agent categories.</li>
                  </ol>
                </section>
                <section>
                  <strong>TEST LATER · TESTNET WALLET</strong>
                  <ol>
                    <li>Connect a wallet on BSC Testnet, chain 97.</li>
                    <li>Run preflight after receiving tBNB and test $U.</li>
                    <li>Confirm the five Hire transactions one at a time.</li>
                    <li>Run Agent, verify the result, wait 15 minutes and settle.</li>
                  </ol>
                </section>
              </div>
              <p>If something fails, send the Agent name, failed step and one screenshot or error message.</p>
            </details>

            <HireExecutionConsole
              tokenId={selected.tokenId}
              agentName={selected.name}
              defaultTask={CANARY_TASKS[selected.tokenId]}
            />
          </div>
        </section>

        <div className="crt-shortcut-legend" aria-hidden="true">
          <span>F1 HELP</span>
          <span>F2 PREVIEW</span>
          <span>F3 WALLET</span>
          <span>ENTER NEXT</span>
        </div>
        <div className="crt-power-label" aria-hidden="true">GRABIT 98 · TESTNET</div>
      </div>
    </main>
  );
}
