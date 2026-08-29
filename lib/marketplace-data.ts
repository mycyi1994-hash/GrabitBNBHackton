import {
  marketplaceCandidates,
  verificationGate,
  type CandidateSnapshot,
} from '@/lib/marketplace-candidates';
import { getRegistryAgent, type RegistryAgent } from '@/lib/scan8004';

export type MarketplaceRecord = CandidateSnapshot & {
  registry: RegistryAgent | null;
  sourceState: 'LIVE REGISTRY' | 'STALE SNAPSHOT';
  displayName: string;
  displayDescription: string;
  displayOwner: string;
  registryUpdatedAt: string;
  feedbacks: number | null;
  validations: number | null;
  endpointVerified: boolean | null;
  verification: typeof verificationGate;
  verificationLevel: 'NEGOTIATED';
  hireStatus: 'LOCKED';
};

function compact(address: string) {
  return address.slice(0, 8) + '...' + address.slice(-4);
}

export async function loadMarketplaceRecord(
  snapshot: CandidateSnapshot,
): Promise<MarketplaceRecord> {
  const registry = await getRegistryAgent(snapshot.tokenId).catch(() => null);

  return {
    ...snapshot,
    registry,
    sourceState: registry ? 'LIVE REGISTRY' : 'STALE SNAPSHOT',
    displayName: registry?.name || snapshot.name,
    displayDescription: registry?.description || snapshot.description,
    displayOwner: compact(registry?.owner_address || snapshot.owner),
    registryUpdatedAt: registry?.updated_at || snapshot.observedAt,
    feedbacks: registry?.total_feedbacks ?? null,
    validations: registry?.total_validations ?? null,
    endpointVerified: registry?.is_endpoint_verified ?? null,
    verification: verificationGate,
    verificationLevel: 'NEGOTIATED',
    hireStatus: 'LOCKED',
  };
}

export async function loadMarketplaceRecords() {
  return Promise.all(marketplaceCandidates.map(loadMarketplaceRecord));
}

export function getCandidateByTokenId(tokenId?: string) {
  return marketplaceCandidates.find((candidate) => candidate.tokenId === tokenId);
}

const legacyCategoryMap: Record<string, string> = {
  'range-pilot': '304494',
  'liquidity-keeper': '304494',
  'grid-forge': '302258',
  'orbit-grid': '302258',
  'yield-route': '304493',
  'apex-harvest': '304493',
  'sentinel-hf': '302257',
  'collateral-guard': '302257',
};

export function getRegistryIdForLegacySlug(slug: string) {
  return legacyCategoryMap[slug];
}
