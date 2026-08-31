import type { Metadata } from 'next';
import Link from 'next/link';
import { AgentCelestial, type AgentCelestialVariant } from '@/app/agent-celestial';
import { TerminalTabs } from '@/app/activate/terminal-tabs';
import {
  getCandidateByTokenId,
  getRegistryIdForLegacySlug,
} from '@/lib/marketplace-data';
import { marketplaceCandidates, type MarketplaceCategory } from '@/lib/marketplace-candidates';
import { agentProfiles } from '@/lib/agent-profiles';
import { CANARY_TASKS, ERC8183_TESTNET } from '@/lib/erc8183';
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

function compact(value: string) {
  return `${value.slice(0, 8)}…${value.slice(-4)}`;
}

export default async function ActivatePage({ searchParams }: ActivatePageProps) {
  const query = await searchParams;
  const tokenId = query.registry || (query.agent ? getRegistryIdForLegacySlug(query.agent) : undefined);
  const selected = getCandidateByTokenId(tokenId) || marketplaceCandidates[0];
  const variant = categoryVariant[selected.category];
  const profile = agentProfiles[selected.category];

  return (
    <main className={`grabit-detail-page grabit-product-${variant}`}>
      <header className="product-detail-topbar">
        <Link className="detail-brand" href="/" aria-label="Grabit Agent Market overview">
          <span>G</span>
          <strong>GRABIT AGENT MARKET<small>BNB AGENT OBSERVATORY</small></strong>
        </Link>
        <nav aria-label="Current location">
          <Link href="/">AGENT STORE</Link>
          <i aria-hidden="true">/</i>
          <b>TESTNET TERMINAL</b>
        </nav>
        <p><i aria-hidden="true" />BSC TESTNET · CHAIN {ERC8183_TESTNET.chainId}</p>
      </header>

      <div className="testnet-notice">
        <span><i aria-hidden="true" /> PRE-LAUNCH TEST ENVIRONMENT</span>
        <p>
          {ERC8183_TESTNET.chainName} · Chain ID {ERC8183_TESTNET.chainId} · Valueless tBNB and test
          $U. Nothing on this screen can spend Mainnet assets.
        </p>
        <a href={ERC8183_TESTNET.explorerUrl} target="_blank" rel="noreferrer">OPEN EXPLORER ↗</a>
      </div>

      <section className="product-detail-hero" aria-labelledby="detail-agent-name">
        <div className="product-detail-copy">
          <Link className="detail-back" href="/">← ALL AGENTS</Link>
          <div className="product-detail-labels">
            <span>{profile.role} / {profile.code}</span>
            <b>ERC-8004 #{selected.tokenId}</b>
            <b>{profile.risk}</b>
          </div>
          <h1 id="detail-agent-name">{shortName(selected.name)}</h1>
          <h2>{profile.summary}</h2>
          <p>{selected.description}</p>

          <div className="product-fit-strip">
            <div>
              <span>BEST FOR</span>
              <p>{profile.bestFor}</p>
            </div>
            <div>
              <span>EVIDENCE SO FAR</span>
              <p>Identity, endpoint and a quote are verified. No paid task has been delivered.</p>
            </div>
            <div>
              <span>MAY NOT SUIT</span>
              <p>{profile.notFor}</p>
            </div>
          </div>

          <div className="product-hero-actions">
            <a href="#terminal-panel-run">RUN A LIVE PREVIEW</a>
            <a href="#grabit-authority">REVIEW AGENT AUTHORITY</a>
          </div>

          <dl className="product-hero-facts">
            <div><dt>JOB PRICE</dt><dd>{selected.price}</dd></div>
            <div><dt>SERVICE</dt><dd>{selected.serviceId}</dd></div>
            <div><dt>SETTLEMENT</dt><dd>ERC-8183</dd></div>
          </dl>
        </div>

        <div className="product-hero-visual" aria-hidden="true">
          <AgentCelestial variant={variant} />
        </div>

        <aside className="product-market-data" aria-label="Registry evidence">
          <span>REGISTRY EVIDENCE / ERC-8004</span>
          <div className="product-nav">
            <small>ON-CHAIN IDENTITY</small>
            <b>#{selected.tokenId}</b>
            <em>REGISTERED</em>
          </div>
          <p className="product-nav-time">OBSERVED {selected.observedAt.slice(0, 10)} · CHAIN 56</p>
          <dl>
            <div><dt>OWNER</dt><dd>{compact(selected.owner)}</dd></div>
            <div><dt>PROVIDER</dt><dd>{compact(selected.provider)}</dd></div>
            <div><dt>ENDPOINT</dt><dd>REACHABLE</dd></div>
            <div><dt>DELIVERED TASKS</dt><dd>0</dd></div>
          </dl>
        </aside>
      </section>

      <TerminalTabs
        tabs={[
          {
            id: 'run',
            label: '01 RUN & HIRE',
            panel: (
              <HireExecutionConsole
                tokenId={selected.tokenId}
                agentName={selected.name}
                defaultTask={CANARY_TASKS[selected.tokenId]}
              />
            ),
          },
          {
            id: 'authority',
            label: '02 AGENT AUTHORITY',
            panel: <AltanaSessionPanel chainId={ERC8183_TESTNET.chainId} />,
          },
        ]}
      />

      <footer className="product-detail-footer">
        <span>GRABIT / ERC-8004 #{selected.tokenId}</span>
        <p>Preview first · sign Testnet only · verify every result before activation.</p>
        <Link href="/dashboard">OPEN DASHBOARD ↗</Link>
      </footer>
    </main>
  );
}
