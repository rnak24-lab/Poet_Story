import type { Metadata } from 'next';
import Script from 'next/script';
import LayoutWrapper from '@/components/LayoutWrapper';
import './globals.css';

export const metadata: Metadata = {
  title: '시글담 - 나만의 시를 담다',
  description: '꽃말과 함께 나만의 시를 써보세요. 질문에 답하며 자연스럽게 시가 완성됩니다.',
  metadataBase: new URL(process.env.NEXT_PUBLIC_BASE_URL || 'https://sigeuldam.kr'),
  openGraph: {
    title: '시글담 - 나만의 시를 담다',
    description: '꽃말과 함께 나만의 시를 써보세요. 질문에 답하며 자연스럽게 시가 완성됩니다.',
    siteName: '시글담',
    locale: 'ko_KR',
    type: 'website',
    images: [{ url: '/api/og?title=시글담 - 나만의 시를 담다', width: 1200, height: 630, alt: '시글담' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: '시글담 - 나만의 시를 담다',
    description: '꽃말과 함께 나만의 시를 써보세요.',
    images: ['/api/og?title=시글담'],
  },
  icons: { icon: '/favicon.ico' },
  other: {
    'apple-mobile-web-app-capable': 'yes',
    'apple-mobile-web-app-status-bar-style': 'default',
    'apple-mobile-web-app-title': '시글담',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#FFF5E8" />
      </head>
      <body className="min-h-screen bg-warm-50">
        {/* Chunk load error recovery - auto-refresh on stale cache */}
        <Script id="chunk-error-handler" strategy="beforeInteractive">{`
          if (typeof window !== 'undefined') {
            window.addEventListener('error', function(e) {
              if (e.message && (e.message.includes('Loading chunk') || e.message.includes('ChunkLoadError'))) {
                console.warn('Chunk load error detected, refreshing page...');
                window.location.reload();
              }
            });
          }
        `}</Script>
        <LayoutWrapper>
          {children}
        </LayoutWrapper>

      </body>
    </html>
  );
}
