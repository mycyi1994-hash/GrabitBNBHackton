import type { Metadata } from 'next';
import { CompareClient } from './compare-client';

export const metadata: Metadata = {
  title: 'Compare agents — Agent Market',
  description: 'Compare BSC DeFi agents across performance, risk, cost, reputation and permissions.',
};

type ComparePageProps = {
  searchParams: Promise<{ a?: string; b?: string }>;
};

export default async function ComparePage({ searchParams }: ComparePageProps) {
  const query = await searchParams;
  return <CompareClient initialA={query.a} initialB={query.b} />;
}

