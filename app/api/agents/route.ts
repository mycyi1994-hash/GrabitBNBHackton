import { getLiveBscAgents } from '@/lib/scan8004';

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
    return Response.json({
      source: '8004scan-unavailable',
      chainId: 56,
      count: 0,
      agents: [],
      stale: true,
      notice: error instanceof Error ? error.message : '8004scan is temporarily unreachable',
    }, { status: 503 });
  }
}
