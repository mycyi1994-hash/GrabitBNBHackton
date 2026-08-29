export type RegistryAgent = {
  agent_id: string;
  token_id: string;
  chain_id: number;
  contract_address: string;
  owner_address: string;
  name: string | null;
  description: string | null;
  supported_protocols: string[];
  x402_supported: boolean;
  is_active?: boolean;
  is_endpoint_verified?: boolean;
  health_score?: number | null;
  total_score?: number;
  total_validations?: number;
  total_feedbacks: number;
  average_score: number;
  tags?: string[];
  created_tx_hash?: string;
  created_at?: string;
  updated_at: string;
};

type RegistryPayload = {
  items?: RegistryAgent[];
  total?: number;
};

const API_BASE =
  process.env.SCAN_8004_API_BASE_URL ?? 'https://api.8004scan.io/api/v1';

export async function getLiveBscAgents(limit = 2, query?: string) {
  const endpoint = query ? '/agents/search/semantic' : '/agents';
  const upstream = new URL(API_BASE + endpoint);
  upstream.searchParams.set('chain_id', '56');
  upstream.searchParams.set('limit', String(limit));
  if (query) upstream.searchParams.set('q', query);

  const headers: Record<string, string> = { Accept: 'application/json' };
  if (process.env.SCAN_8004_API_KEY) {
    headers['X-API-Key'] = process.env.SCAN_8004_API_KEY;
  }

  const response = await fetch(upstream, { headers });
  if (!response.ok) {
    throw new Error('8004scan request failed with status ' + response.status);
  }

  const payload = (await response.json()) as RegistryPayload;
  return {
    items: (payload.items ?? []).filter((agent) => agent.chain_id === 56).slice(0, limit),
    total: payload.total ?? 0,
  };
}

export async function getRegistryAgent(tokenId: string) {
  if (!/^\d+$/.test(tokenId)) throw new Error('Invalid registry token ID');

  const headers: Record<string, string> = { Accept: 'application/json' };
  if (process.env.SCAN_8004_API_KEY) {
    headers['X-API-Key'] = process.env.SCAN_8004_API_KEY;
  }

  const response = await fetch(API_BASE + '/agents/56/' + tokenId, { headers });
  if (!response.ok) {
    throw new Error('8004scan agent request failed with status ' + response.status);
  }

  return (await response.json()) as RegistryAgent;
}
