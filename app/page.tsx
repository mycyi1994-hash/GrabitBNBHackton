import { SlashHome } from '@/app/slash-home';
import { loadMarketplaceRecords } from '@/lib/marketplace-data';

const categoryCode: Record<string, string> = {
  Rebalancing: 'REBALANCE',
  'Grid Trading': 'GRID',
  'Yield Optimisation': 'YIELD',
  'Health Factor Monitoring': 'HEALTH',
};

export default async function Home() {
  const records = await loadMarketplaceRecords();
  const agents = records.map((agent) => ({
    tokenId: agent.tokenId,
    name: agent.displayName,
    category: categoryCode[agent.category] || 'AGENT',
    price: agent.price,
    live: agent.sourceState === 'LIVE REGISTRY',
    description: agent.displayDescription,
    owner: agent.displayOwner,
    feedbacks: agent.feedbacks,
    validations: agent.validations,
    endpointVerified: agent.endpointVerified,
  }));

  return <SlashHome agents={agents} />;
}
