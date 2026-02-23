'use client';

import { useState } from 'react';
import { flowers } from '@/data/flowers';
import { useAppStore } from '@/store/useAppStore';
import { BottomNav } from '@/components/BottomNav';
import Link from 'next/link';

export default function FlowersPage() {
  const { poems, user } = useAppStore();
  const [selectedFlower, setSelectedFlower] = useState<string | null>(null);
  const myPoems = poems.filter(p => p.authorId === user?.id);

  return (
    <div className="min-h-screen pb-24">
      <div className="px-6 pt-8 pb-4">
        <Link href="/" className="text-ink-300 text-sm mb-3 block">← 홈으로</Link>
        <h1 className="text-2xl font-bold text-ink-700">🌼 꽃 종류</h1>
        <p className="text-sm text-ink-400 mt-1">꽃을 골라 바로 시를 써보세요</p>
      </div>

      <div className="px-6 space-y-4">
        {flowers.map(flower => {
          const poemsForFlower = myPoems.filter(p => p.flowerId === flower.id);
          const isExpanded = selectedFlower === flower.id;

          return (
            <div key={flower.id} className="bg-white rounded-card shadow-sm overflow-hidden border border-cream-100">
              {/* Flower header - always visible */}
              <button
                onClick={() => setSelectedFlower(isExpanded ? null : flower.id)}
                className="w-full p-5 flex items-center gap-4 text-left hover:bg-cream-50 transition-colors"
              >
                <div
                  className="w-16 h-16 rounded-full flex items-center justify-center text-3xl flex-shrink-0"
                  style={{ backgroundColor: flower.color + '22' }}
                >
                  {flower.emoji}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h2 className="font-bold text-ink-700 text-lg">{flower.name}</h2>
                    {poemsForFlower.length > 0 && (
                      <span className="text-[10px] bg-sage-100 text-sage-500 px-2 py-0.5 rounded-full">
                        {poemsForFlower.length}편 작성
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-warm-500 font-medium mt-0.5">{flower.meaning}</p>
                  <p className="text-xs text-ink-400 mt-1 line-clamp-2">{flower.description}</p>
                </div>
                <span className={`text-ink-300 transition-transform ${isExpanded ? 'rotate-180' : ''}`}>▾</span>
              </button>

              {/* Expanded content */}
              {isExpanded && (
                <div className="px-5 pb-5 border-t border-cream-100 pt-4 space-y-3 bubble-in">
                  <p className="text-sm text-ink-500 leading-relaxed">{flower.description}</p>

                  {/* Poems written with this flower */}
                  {poemsForFlower.length > 0 && (
                    <div>
                      <p className="text-xs text-ink-400 font-medium mb-2">내가 쓴 시</p>
                      <div className="space-y-2">
                        {poemsForFlower.map(poem => (
                          <Link key={poem.id} href={`/poem/${poem.id}`}
                            className="block bg-cream-50 rounded-xl p-3 hover:bg-cream-100 transition-colors">
                            <p className="text-sm font-medium text-ink-600">{poem.title || '무제'}</p>
                            <p className="text-xs text-ink-300 mt-0.5 line-clamp-1">{poem.finalPoem}</p>
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Write button */}
                  <Link href={`/write?flower=${flower.id}`}
                    className="block w-full py-3 rounded-xl bg-ink-700 text-white text-center font-medium text-sm hover:bg-ink-600 transition-colors">
                    {flower.emoji} {flower.name}(으)로 시 쓰기
                  </Link>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <BottomNav active="home" />
    </div>
  );
}
