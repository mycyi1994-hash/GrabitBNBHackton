const A2A_ENDPOINT = 'https://agent.brainonbnb.com/a2a';

export async function POST(request: Request) {
  try {
    const input = await request.json() as { jobId?: unknown };
    const jobId = String(input.jobId || '');
    if (!/^\d{1,20}$/.test(jobId) || BigInt(jobId) < BigInt(1)) {
      return Response.json({ error: 'A positive numeric jobId is required.' }, { status: 400 });
    }
    const response = await fetch(A2A_ENDPOINT, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: `grabit-${jobId}`,
        method: 'message/send',
        params: {
          message: {
            role: 'user',
            messageId: `hire-${jobId}`,
            parts: [{ kind: 'data', data: { skill: 'notify_funded', job_id: Number(jobId) } }],
          },
        },
      }),
      signal: AbortSignal.timeout(15_000),
    });
    const body = await response.json();
    return Response.json({ notified: response.ok, providerResponse: body }, {
      status: response.ok ? 200 : 502,
      headers: { 'cache-control': 'no-store' },
    });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : 'Delivery notification failed.' }, { status: 503 });
  }
}
