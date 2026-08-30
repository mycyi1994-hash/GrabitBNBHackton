const PROVIDER_BASE = 'https://agent.brainonbnb.com';

export async function GET(request: Request) {
  const jobId = new URL(request.url).searchParams.get('jobId') || '';
  if (!/^\d{1,20}$/.test(jobId) || BigInt(jobId) < BigInt(1)) {
    return Response.json({ error: 'A positive numeric jobId is required.' }, { status: 400 });
  }
  try {
    const response = await fetch(`${PROVIDER_BASE}/job?id=${jobId}`, {
      cache: 'no-store',
      signal: AbortSignal.timeout(12_000),
    });
    const body = await response.json();
    return Response.json(body, {
      status: response.ok ? 200 : response.status,
      headers: { 'cache-control': 'no-store' },
    });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : 'Job tracker unavailable.' }, { status: 503 });
  }
}
