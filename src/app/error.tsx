'use client';

import { useEffect } from 'react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('App error:', error);
    // Auto-refresh on chunk load errors (stale cache)
    if (error.message?.includes('Loading chunk') || error.message?.includes('ChunkLoadError')) {
      window.location.reload();
      return;
    }
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-warm-50 px-4">
      <div className="text-center max-w-sm">
        <div className="text-5xl mb-4">🌸</div>
        <h2 className="text-lg font-bold text-ink-700 mb-2">
          잠깐 문제가 생겼어요
        </h2>
        <p className="text-sm text-ink-400 mb-6">
          일시적인 오류입니다. 다시 시도해주세요.
        </p>
        <button
          onClick={() => {
            // Clear any cached state and try again
            reset();
          }}
          className="px-6 py-2.5 bg-ink-700 text-white rounded-xl text-sm font-medium"
        >
          다시 시도
        </button>
        <button
          onClick={() => window.location.reload()}
          className="block mx-auto mt-3 text-xs text-ink-300 underline"
        >
          페이지 새로고침
        </button>
      </div>
    </div>
  );
}
