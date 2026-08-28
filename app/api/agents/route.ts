import { agents } from '@/lib/agents';
import { getLiveBscAgents } from '@/lib/scan8004';

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
  const requestUrl = new URL(request.url);
  const query = requestUrl.searchParams.get('q')?.trim();
  const requestedLimit = Number(requestUrl.searchParams.get('limit') ?? 2);
  const limit = Number.isFinite(requestedLimit)
    ? Math.min(Math.max(requestedLimit, 1), 20)
    : 2;

  try {
    const result = await getLiveBscAgents(limit, query);
    return Response.json({
      source: '8004scan-live',
      chainId: 56,
      count: result.items.length,
      total: result.total,
      agents: result.items,
    });
  } catch (error) {
    const fallback = (await mockResponse(request.url).json()) as Record<string, unknown>;
    return Response.json({
      ...fallback,
      source: 'prototype-fallback',
      notice: error instanceof Error ? error.message : '8004scan is temporarily unreachable',
    });
  }
}
