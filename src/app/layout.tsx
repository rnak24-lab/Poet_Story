import type { Metadata } from 'next';
import Script from 'next/script';
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
  const adsenseId = process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID;

  return (
    <html lang="ko">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#FFF5E8" />
      </head>
      <body className="min-h-screen bg-warm-50">
        <div className="max-w-[430px] mx-auto min-h-screen bg-white shadow-lg relative">
          {children}
        </div>

        {/* Google AdSense - 사업자등록 후 ID 발급받아 환경변수에 설정 */}
        {adsenseId && (
          <Script
            src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${adsenseId}`}
            crossOrigin="anonymous"
            strategy="lazyOnload"
          />
        )}
      </body>
    </html>
  );
}
