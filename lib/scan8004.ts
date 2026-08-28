export type RegistryAgent = {
  agent_id: string;
  token_id: string;
  chain_id: number;
  owner_address: string;
  name: string | null;
  description: string | null;
  supported_protocols: string[];
  x402_supported: boolean;
  total_feedbacks: number;
  average_score: number;
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
