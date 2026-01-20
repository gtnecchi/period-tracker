import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'カップル生理日共有アプリ',
  description: 'パートナーと生理周期を共有・管理するPWAアプリ',
  manifest: '/manifest.json',
  themeColor: '#ec4899',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: '生理日共有',
  },
  formatDetection: {
    telephone: false,
  },
  openGraph: {
    type: 'website',
    siteName: 'カップル生理日共有アプリ',
    title: 'カップル生理日共有アプリ',
    description: 'パートナーと生理周期を共有・管理するPWAアプリ',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja">
      <head>
        <link rel="apple-touch-icon" href="/icons/apple-touch-icon.png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="生理日共有" />
      </head>
      <body className={inter.className}>{children}</body>
    </html>
  );
}