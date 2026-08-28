import type { Metadata } from 'next';
import { ActivateClient } from './activate-client';

export const metadata: Metadata = {
  title: 'Activate agent — Agent Market',
  description: 'Configure an agent budget, strategy and revocable onchain permissions.',
};

type ActivatePageProps = {
  searchParams: Promise<{ agent?: string }>;
};

export default async function ActivatePage({ searchParams }: ActivatePageProps) {
  const query = await searchParams;
  return <ActivateClient initialSlug={query.agent} />;
}

