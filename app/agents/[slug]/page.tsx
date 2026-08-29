import type { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import { getRegistryIdForLegacySlug } from '@/lib/marketplace-data';

export const metadata: Metadata = {
  title: 'Registry evidence — Agent Market',
  description: 'Legacy prototype profiles now resolve to source-backed ERC-8004 registry evidence.',
};

type AgentPageProps = {
  params: Promise<{ slug: string }>;
};

export default async function AgentDetailPage({ params }: AgentPageProps) {
  const { slug } = await params;
  const tokenId = getRegistryIdForLegacySlug(slug);
  if (!tokenId) notFound();
  redirect('/registry/' + tokenId);
}
