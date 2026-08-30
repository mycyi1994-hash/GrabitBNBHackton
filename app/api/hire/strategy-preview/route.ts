import { formatGwei } from 'viem';
import { CANARY_TASKS } from '@/lib/erc8183';
import { getCandidateByTokenId } from '@/lib/marketplace-data';
import { buildCategoryStrategyResult } from '@/lib/reference-agent-strategies';
import { getTestnetPublicClient } from '@/lib/testnet-reference-provider';

function previewTask(value: string | null, fallback: string) {
  const cleaned = String(value || '')
    .replace(/[\u0000-\u001f\u007f]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  return cleaned.length >= 12 && cleaned.length <= 320 ? cleaned : fallback;
}

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const tokenId = requestUrl.searchParams.get('registry') || '';
  const candidate = getCandidateByTokenId(tokenId);
  if (!candidate) {
    return Response.json({ error: 'Unsupported registry identity.' }, { status: 400 });
  }

  try {
    const publicClient = getTestnetPublicClient();
    const [blockNumber, gasPrice] = await Promise.all([
      publicClient.getBlockNumber(),
      publicClient.getGasPrice(),
    ]);
    const result = await buildCategoryStrategyResult({
      registry: candidate.tokenId,
      service: candidate.serviceId,
      task: previewTask(requestUrl.searchParams.get('task'), CANARY_TASKS[candidate.tokenId]),
      sourceBlock: blockNumber.toString(),
      gasPriceGwei: formatGwei(gasPrice),
      observedAt: new Date().toISOString(),
    });

    return Response.json({
      preview: true,
      onchainDeliverable: false,
      disclaimer: 'Read-only preview. No wallet signature, Job or capital movement occurred.',
      result,
    }, { headers: { 'cache-control': 'no-store' } });
  } catch (error) {
    return Response.json({
      error: error instanceof Error ? error.message : 'Agent strategy preview unavailable.',
    }, { status: 503, headers: { 'cache-control': 'no-store' } });
  }
}
