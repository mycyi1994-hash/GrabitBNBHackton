import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import { RetroInterface } from '@/components/retro-interface';
import './globals.css';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000',
  ),
  title: 'Agent Market 98 — BNB Chain DeFi Agents',
  description:
    'Discover, compare and hire autonomous DeFi agents with verifiable onchain performance and permissions.',
  icons: {
    icon: '/og.png',
  },
  openGraph: {
    title: 'Agent Market 98 — BNB Chain DeFi Agents',
    description:
      'Discover, compare and hire autonomous DeFi agents with verifiable onchain performance and permissions.',
    images: ['/og.png'],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Agent Market 98 — BNB Chain DeFi Agents',
    description:
      'Discover, compare and hire autonomous DeFi agents with verifiable onchain performance and permissions.',
    images: ['/og.png'],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <RetroInterface>{children}</RetroInterface>
      </body>
    </html>
  );
}
