import { agents } from '@/lib/agents';

const API_BASE = process.env.SCAN_8004_API_BASE_URL ?? 'https://api.8004scan.io/api/v1';

function mockResponse(requestUrl: string) {
  const url = new URL(requestUrl);
  const category = url.searchParams.get('category');
  const query = url.searchParams.get('q')?.toLowerCase().trim();
  const filtered = agents.filter((agent) => {
    const matchesCategory = !category || agent.category.toLowerCase() === category.toLowerCase();
    const haystack = [agent.name, agent.tagline, agent.description, agent.category, agent.protocol].join(' ').toLowerCase();
    const matchesQuery = !query || haystack.includes(query);
    return matchesCategory && matchesQuery;
  });

  return Response.json({
    source: 'prototype-mock',
    notice: 'Set SCAN_8004_API_KEY to proxy live ERC-8004 data from the server.',
    chainId: 56,
    count: filtered.length,
    agents: filtered,
  });
}

export async function GET(request: Request) {
  const apiKey = process.env.SCAN_8004_API_KEY;
  if (!apiKey) return mockResponse(request.url);

  const requestUrl = new URL(request.url);
  const query = requestUrl.searchParams.get('q')?.trim();
  const upstream = new URL(query ? API_BASE + '/agents/search/semantic' : API_BASE + '/agents');
  if (query) upstream.searchParams.set('q', query);

  for (const key of ['page', 'limit', 'owner_address']) {
    const value = requestUrl.searchParams.get(key);
    if (value) upstream.searchParams.set(key, value);
  }

  try {
    const response = await fetch(upstream, {
      headers: { Accept: 'application/json', 'X-API-Key': apiKey },
    });

    if (!response.ok) {
      return Response.json(
        { error: '8004scan request failed', status: response.status },
        { status: 502 },
      );
    }

    const data = await response.json();
    return Response.json({ source: '8004scan', chainId: 56, data });
  } catch {
    return Response.json(
      { error: '8004scan is temporarily unreachable' },
      { status: 502 },
    );
  }
}

