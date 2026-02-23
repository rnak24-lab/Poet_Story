'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

function ShareContent() {
  const searchParams = useSearchParams();
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);
  if (!mounted) return null;

  const title = searchParams.get('title') || '무제';
  const poem = searchParams.get('poem') || '';
  const author = searchParams.get('author') || '익명';
  const flower = searchParams.get('flower') || '🌸';

  return (
    <div className="min-h-screen bg-warm-50 flex flex-col items-center justify-center p-6">
      <div className="bg-cream-100 rounded-card p-8 max-w-[380px] w-full text-center">
        <div className="text-4xl mb-4">{flower}</div>
        <h1 className="text-xl font-bold text-ink-700 mb-6">{title}</h1>
        <pre className="poem-text whitespace-pre-wrap text-ink-600 text-sm leading-relaxed mb-6">
          {poem}
        </pre>
        <p className="text-ink-300 text-sm">— {author}</p>
      </div>

      <div className="mt-6 text-center">
        <p className="text-ink-400 text-sm mb-3">시글담에서 나만의 시를 써보세요 🌸</p>
        <Link href="/" className="text-ink-600 underline text-sm">시글담 시작하기</Link>
      </div>
    </div>
  );
}

export default function SharePage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><p className="text-ink-300">불러오는 중...</p></div>}>
      <ShareContent />
    </Suspense>
  );
}
