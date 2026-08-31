import { SlashHome } from '@/app/slash-home';
import { loadMarketplaceRecords } from '@/lib/marketplace-data';
import { discoveredCandidates, verificationGate } from '@/lib/marketplace-candidates';

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

  // How many of the surfaced identities share one provider wallet. The
  // leaderboard states this instead of letting four cards imply four suppliers.
  const owners = new Set(records.map((agent) => agent.owner.toLowerCase()));
  const ownerConcentration = owners.size === 1 ? records.length : 0;

  return (
    <SlashHome
      agents={agents}
      gate={{ ...verificationGate }}
      ownerConcentration={ownerConcentration}
      discovered={discoveredCandidates.map((candidate) => ({
        category: candidate.category,
        tokenId: candidate.tokenId,
        name: candidate.name,
        level: candidate.level,
        blocker: candidate.blocker,
      }))}
    />
  );
}
