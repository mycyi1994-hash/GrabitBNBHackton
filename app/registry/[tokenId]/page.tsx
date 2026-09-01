import type { Metadata } from 'next';
/* eslint-disable @next/next/no-html-link-for-pages */
import { notFound } from 'next/navigation';
import { SiteHeader } from '@/components/site-header';
import { getRegistryAgent } from '@/lib/scan8004';
import { getCandidateByTokenId } from '@/lib/marketplace-data';

type RegistryPageProps = {
  params: Promise<{ tokenId: string }>;
};

function compact(address: string) {
  return address.slice(0, 10) + '...' + address.slice(-6);
}

type RegistryView = {
  sourceState: 'LIVE REGISTRY' | 'STALE SNAPSHOT';
  observedAt: string;
  tokenId: string;
  name: string | null;
  description: string | null;
  owner: string;
  contractAddress: string | null;
  protocols: string;
  health: string;
  endpointVerified: boolean | null;
  feedbacks: number | null;
  validations: number | null;
  isActive: boolean | null;
};

/**
 * Resolves one registry record, preferring 8004scan and falling back to the
 * frozen candidate snapshot when it cannot be reached.
 *
 * The page used to 404 on any upstream failure, which reported a demonstrably
 * registered identity as missing and broke every evidence link in the
 * leaderboard during an outage. The data rules call for stale or unavailable
 * instead, so an unreachable upstream now degrades to the snapshot and every
 * field the snapshot does not carry reports Unavailable rather than a zero that
 * would read as evidence.
 */
async function loadRegistryView(tokenId: string): Promise<RegistryView | null> {
  const live = await getRegistryAgent(tokenId).catch(() => null);
  if (live) {
    return {
      sourceState: 'LIVE REGISTRY',
      observedAt: live.updated_at,
      tokenId: live.token_id,
      name: live.name,
      description: live.description,
      owner: live.owner_address,
      contractAddress: live.contract_address,
      protocols: live.supported_protocols.length ? live.supported_protocols.join(', ') : 'Custom',
      health: live.health_score == null ? 'Not scored' : live.health_score.toFixed(0) + '/100',
      endpointVerified: live.is_endpoint_verified ?? null,
      feedbacks: live.total_feedbacks,
      validations: live.total_validations ?? null,
      isActive: live.is_active ?? null,
    };
  }

  const snapshot = getCandidateByTokenId(tokenId);
  if (!snapshot) return null;

  return {
    sourceState: 'STALE SNAPSHOT',
    observedAt: snapshot.observedAt,
    tokenId: snapshot.tokenId,
    name: snapshot.name,
    description: snapshot.description,
    owner: snapshot.owner,
    contractAddress: null,
    protocols: snapshot.serviceId,
    health: 'Unavailable',
    endpointVerified: null,
    feedbacks: null,
    validations: null,
    isActive: null,
  };
}

function count(value: number | null) {
  return value === null ? 'Unavailable' : String(value);
}

export async function generateMetadata({ params }: RegistryPageProps): Promise<Metadata> {
  const { tokenId } = await params;
  const agent = await loadRegistryView(tokenId);
  if (!agent) return { title: 'Registry agent not found — Agent Market' };

  const title = (agent.name || 'BSC Agent #' + tokenId) + ' — Agent Market';
  const description =
    agent.description ||
    (agent.sourceState === 'LIVE REGISTRY'
      ? 'Live ERC-8004 identity on BNB Smart Chain.'
      : 'ERC-8004 identity on BNB Smart Chain, shown from a stale snapshot.');
  return {
    title,
    description,
    openGraph: { title, description, images: [] },
    twitter: { title, description, images: [] },
  };
}

export default async function RegistryAgentPage({ params }: RegistryPageProps) {
  const { tokenId } = await params;
  const agent = await loadRegistryView(tokenId);
  if (!agent) notFound();

  const officialUrl = 'https://8004scan.io/agents/bsc/' + agent.tokenId;
  const stale = agent.sourceState === 'STALE SNAPSHOT';

  return (
    <main className="win95-desktop registry-desktop">
      <SiteHeader />
      <section className="win95-window registry-window" aria-label="Live registry agent details">
        <header className="win95-titlebar">
          <div><span className="titlebar-icon">A</span><strong>{agent.name || 'BSC Agent #' + tokenId}</strong></div>
          <div className="window-controls" aria-hidden="true"><span>_</span><span>□</span><span>×</span></div>
        </header>
        <nav className="win95-menubar" aria-label="Application menu">
          <span><u>F</u>ile</span><span><u>V</u>iew</span><span><u>T</u>rust</span><span><u>H</u>elp</span>
        </nav>
        <div className="win95-toolbar">
          <a href="/">← Agent Explorer</a>
          <a href={officialUrl} target="_blank" rel="noreferrer">8004scan</a>
          <label><span>Address</span><input readOnly value={'C:\\BNB\\AGENTS\\' + tokenId} aria-label="Current registry record" /></label>
        </div>

        <div className="registry-detail-body">
          <aside className="registry-profile">
            <span className="registry-large-icon">A:\</span>
            <h1>{agent.name || 'Unnamed Agent'}</h1>
            <p>ERC-8004 #{agent.tokenId}</p>
            <span className={'registry-state ' + (agent.isActive === false || stale ? 'is-offline' : 'is-online')}>
              {stale ? 'UNVERIFIED' : agent.isActive === false ? 'INACTIVE' : 'ACTIVE'}
            </span>
          </aside>

          <section className="registry-properties">
            <div className="registry-tabs"><strong>General</strong><span>Trust</span><span>Onchain</span></div>
            <div className="registry-description">
              <h2>Description</h2>
              <p>{agent.description || 'No description was published by this agent owner.'}</p>
            </div>
            <dl className="registry-fields">
              <div><dt>Owner</dt><dd title={agent.owner}>{compact(agent.owner)}</dd></div>
              <div><dt>Registry contract</dt><dd title={agent.contractAddress ?? undefined}>{agent.contractAddress ? compact(agent.contractAddress) : 'Unavailable'}</dd></div>
              <div><dt>Service</dt><dd>{agent.protocols}</dd></div>
              <div><dt>Health score</dt><dd>{agent.health}</dd></div>
              <div><dt>Endpoint verified</dt><dd>{agent.endpointVerified === null ? 'Unavailable' : agent.endpointVerified ? 'Yes' : 'No'}</dd></div>
              <div><dt>Feedbacks</dt><dd>{count(agent.feedbacks)}</dd></div>
              <div><dt>Validations</dt><dd>{count(agent.validations)}</dd></div>
              <div><dt>{stale ? 'Snapshot observed' : 'Last registry update'}</dt><dd>{new Date(agent.observedAt).toISOString().slice(0, 10)}</dd></div>
            </dl>
            <div className="registry-warning">
              <strong>{stale ? 'Stale snapshot — 8004scan unreachable' : 'Identity record only'}</strong>
              <p>
                {stale
                  ? 'The live registry could not be reached, so these fields come from the frozen candidate snapshot taken at the date above. Anything the snapshot does not carry reads Unavailable rather than zero. Reload once 8004scan responds.'
                  : 'This live registration does not prove strategy returns or spending permissions. Verify the endpoint and wallet before authorising work.'}
              </p>
            </div>
            <div className="win95-actions">
              <a href={officialUrl} target="_blank" rel="noreferrer">Open official record</a>
              <a href={'/activate?registry=' + agent.tokenId}>Review execution gate</a>
            </div>
          </section>
        </div>
        <footer className="win95-statusbar"><span>1 object</span><span>{agent.sourceState}</span><span>CHAIN ID: 56</span></footer>
      </section>
    </main>
  );
}
