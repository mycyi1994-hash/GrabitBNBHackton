import type { Metadata } from 'next';
/* eslint-disable @next/next/no-html-link-for-pages */
import { notFound } from 'next/navigation';
import { SiteHeader } from '@/components/site-header';
import { getRegistryAgent } from '@/lib/scan8004';

type RegistryPageProps = {
  params: Promise<{ tokenId: string }>;
};

function compact(address: string) {
  return address.slice(0, 10) + '...' + address.slice(-6);
}

export async function generateMetadata({ params }: RegistryPageProps): Promise<Metadata> {
  const { tokenId } = await params;
  try {
    const agent = await getRegistryAgent(tokenId);
    const title = (agent.name || 'BSC Agent #' + tokenId) + ' — Agent Market';
    const description = agent.description || 'Live ERC-8004 identity on BNB Smart Chain.';
    return {
      title,
      description,
      openGraph: { title, description, images: [] },
      twitter: { title, description, images: [] },
    };
  } catch {
    return { title: 'Registry agent not found — Agent Market' };
  }
}

export default async function RegistryAgentPage({ params }: RegistryPageProps) {
  const { tokenId } = await params;
  const agent = await getRegistryAgent(tokenId).catch(() => null);
  if (!agent) notFound();

  const officialUrl = 'https://8004scan.io/agents/bsc/' + agent.token_id;
  const health = agent.health_score == null ? 'Not scored' : agent.health_score.toFixed(0) + '/100';
  const protocols = agent.supported_protocols.length ? agent.supported_protocols.join(', ') : 'Custom';

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
            <p>ERC-8004 #{agent.token_id}</p>
            <span className={'registry-state ' + (agent.is_active === false ? 'is-offline' : 'is-online')}>
              {agent.is_active === false ? 'INACTIVE' : 'ACTIVE'}
            </span>
          </aside>

          <section className="registry-properties">
            <div className="registry-tabs"><strong>General</strong><span>Trust</span><span>Onchain</span></div>
            <div className="registry-description">
              <h2>Description</h2>
              <p>{agent.description || 'No description was published by this agent owner.'}</p>
            </div>
            <dl className="registry-fields">
              <div><dt>Owner</dt><dd title={agent.owner_address}>{compact(agent.owner_address)}</dd></div>
              <div><dt>Registry contract</dt><dd title={agent.contract_address}>{compact(agent.contract_address)}</dd></div>
              <div><dt>Service</dt><dd>{protocols}</dd></div>
              <div><dt>Health score</dt><dd>{health}</dd></div>
              <div><dt>Endpoint verified</dt><dd>{agent.is_endpoint_verified ? 'Yes' : 'No'}</dd></div>
              <div><dt>Feedbacks</dt><dd>{agent.total_feedbacks}</dd></div>
              <div><dt>Validations</dt><dd>{agent.total_validations ?? 0}</dd></div>
              <div><dt>Last registry update</dt><dd>{new Date(agent.updated_at).toISOString().slice(0, 10)}</dd></div>
            </dl>
            <div className="registry-warning">
              <strong>Identity record only</strong>
              <p>This live registration does not prove strategy returns or spending permissions. Verify the endpoint and wallet before authorising work.</p>
            </div>
            <div className="win95-actions">
              <a href={officialUrl} target="_blank" rel="noreferrer">Open official record</a>
              <a href={'/activate?registry=' + agent.token_id}>Review execution gate</a>
            </div>
          </section>
        </div>
        <footer className="win95-statusbar"><span>1 object</span><span>LIVE 8004SCAN DATA</span><span>CHAIN ID: 56</span></footer>
      </section>
    </main>
  );
}
