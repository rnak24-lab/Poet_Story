'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { flowers } from '@/data/flowers';
import { BottomNav } from '@/components/BottomNav';
import Link from 'next/link';
import type { PoemDraft } from '@/store/useAppStore';

export default function FeedPage() {
  const { user, blockedUsers, blockUser } = useAppStore();
  const [mounted, setMounted] = useState(false);
  const [activeFilter, setActiveFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'recent' | 'popular'>('popular');
  const [reportModal, setReportModal] = useState<string | null>(null);
  const [reportReason, setReportReason] = useState('');

  // DB에서 가져온 시 목록
  const [dbPoems, setDbPoems] = useState<PoemDraft[]>([]);
  const [loading, setLoading] = useState(true);

  // DB에서 시 목록 가져오기
  const fetchPoems = useCallback(async () => {
    try {
      const res = await fetch('/api/poems?limit=100');
      if (res.ok) {
        const data = await res.json();
        if (data.poems) {
          setDbPoems(data.poems);
        }
      }
    } catch (e) {
      console.error('Failed to fetch poems:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    setMounted(true);
    fetchPoems();
  }, [fetchPoems]);

  if (!mounted) return null;

  // DB가 소스 오프 트루스, localStorage는 fallback
  const localPoems = useAppStore.getState().poems;
  const dbPoemIds = new Set(dbPoems.map(p => p.id));
  const mergedPoems = [
    ...dbPoems,
    ...localPoems.filter(p => !dbPoemIds.has(p.id) && p.isCompleted),
  ];

  const allPoems = mergedPoems.filter(p => !p.isHidden && !blockedUsers.includes(p.authorId));
  const filtered = activeFilter === 'all' ? allPoems : allPoems.filter(p => p.flowerId === activeFilter);
  const sorted = [...filtered].sort((a, b) => {
    if (sortBy === 'popular') return (b.likes || 0) - (a.likes || 0);
    return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
  });

  const handleReport = async (poemId: string) => {
    if (!reportReason.trim() || !user) return;
    try {
      await fetch(`/api/poems/${poemId}/report`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reporterId: user.id,
          reporterName: user.name,
          reason: reportReason,
        }),
      });
    } catch (e) {
      console.error('Report error:', e);
    }
    setReportModal(null);
    setReportReason('');
    alert('신고가 접수되었습니다. 검토 후 조치하겠습니다.');
  };

  const handleLikeToggle = async (poemId: string, likedBy: string[]) => {
    if (!user) return;
    const isLiked = likedBy?.includes(user.id);
    try {
      const res = await fetch(`/api/poems/${poemId}/like`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, action: isLiked ? 'unlike' : 'like' }),
      });
      if (res.ok) {
        const data = await res.json();
        // 로컬 상태 업데이트
        setDbPoems(prev => prev.map(p => 
          p.id === poemId ? { ...p, likes: data.likes, likedBy: data.likedBy } : p
        ));
      }
    } catch (e) {
      console.error('Like error:', e);
    }
    // localStorage 쪽도 업데이트
    const store = useAppStore.getState();
    if (isLiked) store.unlikePoem(poemId, user.id);
    else store.likePoem(poemId, user.id);
  };

  const handleView = async (poemId: string) => {
    try {
      await fetch(`/api/poems/${poemId}/view`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
    } catch {}
    // localStorage도 업데이트
    useAppStore.getState().viewPoem(poemId);
  };

  return (
    <div className="min-h-screen pb-24">
      <div className="px-6 pt-8 pb-4">
        <h1 className="text-2xl font-bold text-ink-700">시 피드</h1>
        <p className="text-sm text-ink-300 mt-1">다른 사람들의 시를 읽어보세요</p>
      </div>

      <div className="px-6 mb-4 overflow-x-auto">
        <div className="flex gap-2 pb-2">
          <button onClick={() => setActiveFilter('all')}
            className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-all ${activeFilter === 'all' ? 'bg-ink-700 text-white' : 'bg-cream-50 text-ink-400'}`}>전체</button>
          {flowers.map(flower => (
            <button key={flower.id} onClick={() => setActiveFilter(flower.id)}
              className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-all flex items-center gap-1 ${activeFilter === flower.id ? 'bg-ink-700 text-white' : 'bg-cream-50 text-ink-400'}`}>
              <span>{flower.emoji}</span><span>{flower.name}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="px-6 mb-4 flex gap-4 border-b border-ink-50">
        <button onClick={() => setSortBy('popular')} className={`pb-2 text-sm ${sortBy === 'popular' ? 'tab-active' : 'tab-inactive'}`}>인기순</button>
        <button onClick={() => setSortBy('recent')} className={`pb-2 text-sm ${sortBy === 'recent' ? 'tab-active' : 'tab-inactive'}`}>최신순</button>
      </div>

      {loading ? (
        <div className="px-6 py-12 text-center">
          <div className="text-4xl mb-3 animate-pulse">🌸</div>
          <p className="text-ink-300 text-sm">시를 불러오는 중...</p>
        </div>
      ) : sorted.length === 0 ? (
        <div className="px-6 py-12 text-center">
          <div className="text-4xl mb-3">📝</div>
          <p className="text-ink-400 text-sm mb-2">아직 게시된 시가 없어요</p>
          <Link href="/write" className="text-ink-600 underline text-sm">첫 번째 시를 써보세요 →</Link>
        </div>
      ) : (
        <div className="px-6 space-y-4">
          {sorted.map(poem => {
            const flower = flowers.find(f => f.id === poem.flowerId);
            const isDark = (poem.background || '').includes('800') || (poem.background || '').includes('700');
            const isLiked = user && (poem.likedBy || []).includes(user.id);
            const commentCount = ((poem as any).comments || []).length;

            return (
              <Link key={poem.id} href={`/poem/${poem.id}`} className="block" onClick={() => handleView(poem.id)}>
                <div className="rounded-card overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                  <div className={`${poem.background || 'bg-cream-50'} p-6 relative`}>
                    <pre className={`poem-text whitespace-pre-wrap text-sm leading-relaxed ${isDark ? 'text-white' : 'text-ink-600'}`}>{poem.finalPoem}</pre>
                  </div>
                  <div className="bg-white px-5 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-lg">{flower?.emoji || '🌸'}</span>
                      <div>
                        <h3 className="font-bold text-ink-700 text-sm">{poem.title || '무제'}</h3>
                        <p className="text-xs text-ink-300">{poem.authorName || '익명'} · {flower?.name}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <button onClick={(e) => { e.preventDefault(); handleLikeToggle(poem.id, poem.likedBy || []); }}
                        className={`flex items-center gap-1 transition-colors ${isLiked ? 'text-red-400' : 'text-ink-300 hover:text-red-400'}`}>
                        <span className="text-lg">{isLiked ? '❤️' : '♡'}</span>
                        <span className="text-sm">{poem.likes || 0}</span>
                      </button>
                      <span className="text-xs text-ink-200 flex items-center gap-0.5">💬 {commentCount}</span>
                      <span className="text-xs text-ink-200">👀 {poem.views || 0}</span>
                      {user && poem.authorId !== user.id && (
                        <button onClick={(e) => { e.preventDefault(); setReportModal(poem.id); }} className="text-ink-200 hover:text-red-400 text-xs">🚨</button>
                      )}
                      {user && poem.authorId !== user.id && (
                        <button onClick={(e) => { e.preventDefault(); if (confirm(`${poem.authorName || '이 사용자'}님을 차단하시겠어요?`)) { blockUser(poem.authorId); } }} className="text-ink-200 hover:text-red-400 text-xs">🚫</button>
                      )}
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}

      {/* Report Modal */}
      {reportModal && (
        <div className="fixed inset-0 z-50 modal-overlay flex items-center justify-center" onClick={() => setReportModal(null)}>
          <div className="bg-white rounded-card w-[90%] max-w-[360px] p-6" onClick={e => e.stopPropagation()}>
            <h3 className="font-bold text-ink-700 text-lg mb-4">🚨 게시글 신고</h3>
            <div className="space-y-2 mb-4">
              {['부적절한 내용', '혐오/차별 표현', '스팸/광고', '개인정보 노출', '기타'].map(reason => (
                <button key={reason} onClick={() => setReportReason(reason)}
                  className={`w-full text-left px-4 py-2.5 rounded-xl text-sm transition-all ${reportReason === reason ? 'bg-red-50 text-red-600 ring-1 ring-red-200' : 'bg-cream-50 text-ink-500 hover:bg-cream-100'}`}>
                  {reason}
                </button>
              ))}
            </div>
            {reportReason === '기타' && (
              <textarea value={reportReason === '기타' ? '' : reportReason} onChange={(e) => setReportReason(e.target.value)}
                placeholder="신고 사유를 적어주세요..." className="w-full bg-cream-50 rounded-xl p-3 text-sm mb-4 focus:outline-none" rows={3} />
            )}
            <div className="flex gap-2">
              <button onClick={() => setReportModal(null)} className="flex-1 py-3 rounded-xl bg-cream-100 text-ink-500 font-medium">취소</button>
              <button onClick={() => handleReport(reportModal)} disabled={!reportReason.trim()}
                className="flex-1 py-3 rounded-xl bg-red-500 text-white font-medium disabled:opacity-50">신고하기</button>
            </div>
          </div>
        </div>
      )}

      <BottomNav active="feed" />
    </div>
  );
}
