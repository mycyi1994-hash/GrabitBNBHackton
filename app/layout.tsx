import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import { RetroInterface } from '@/components/retro-interface';
import './globals.css';
import './ganymede-detail.css';
import './agent-detail.css';

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
  title: 'Grabit — BNB Chain Agent Market',
  description:
    'Inspect BSC DeFi agents by registry identity, endpoint evidence and execution readiness.',
  icons: {
    icon: '/og.png',
  },
  openGraph: {
    title: 'Grabit — BNB Chain Agent Market',
    description:
      'Inspect BSC DeFi agents by registry identity, endpoint evidence and execution readiness.',
    images: ['/og.png'],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Grabit — BNB Chain Agent Market',
    description:
      'Inspect BSC DeFi agents by registry identity, endpoint evidence and execution readiness.',
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
