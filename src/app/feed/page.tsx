'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { flowers } from '@/data/flowers';
import { BottomNav } from '@/components/BottomNav';
import { useToast } from '@/components/Toast';
import Link from 'next/link';
import type { PoemDraft } from '@/store/useAppStore';

export default function FeedPage() {
  const { user, blockedUsers, blockUser } = useAppStore();
  const toast = useToast();
  const [mounted, setMounted] = useState(false);
  const [activeFilter, setActiveFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'recent' | 'popular'>('popular');
  const [reportModal, setReportModal] = useState<string | null>(null);
  const [reportReason, setReportReason] = useState('');
  const [blockConfirm, setBlockConfirm] = useState<{ id: string; name: string } | null>(null);

  // DB에서 가져온 시 목록
  const [dbPoems, setDbPoems] = useState<PoemDraft[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(false);

  // DB에서 시 목록 가져오기
  const fetchPoems = useCallback(async () => {
    setFetchError(false);
    try {
      const res = await fetch('/api/poems?limit=100');
      if (res.ok) {
        const data = await res.json();
        if (data.poems) {
          setDbPoems(data.poems);
        }
      } else {
        setFetchError(true);
      }
    } catch (e) {
      console.error('Failed to fetch poems:', e);
      setFetchError(true);
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
    toast.showToast('info', '신고가 접수되었어요. 검토 후 조치할게요.');
  };

  const [animatingLike, setAnimatingLike] = useState<string | null>(null);

  const handleLikeToggle = async (poemId: string, likedBy: string[]) => {
    if (!user) {
      toast.showToast('info', '좋아요를 누르려면 로그인해주세요.');
      return;
    }
    setAnimatingLike(poemId);
    setTimeout(() => setAnimatingLike(null), 400);
    const isLiked = likedBy?.includes(user.id);
    try {
      const res = await fetch(`/api/poems/${poemId}/like`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, action: isLiked ? 'unlike' : 'like' }),
      });
      if (res.ok) {
        const data = await res.json();
        setDbPoems(prev => prev.map(p => 
          p.id === poemId ? { ...p, likes: data.likes, likedBy: data.likedBy } : p
        ));
      }
    } catch (e) {
      console.error('Like error:', e);
    }
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
    useAppStore.getState().viewPoem(poemId);
  };

  // 시 미리보기 텍스트 (최대 4줄)
  const previewPoem = (text: string) => {
    const lines = text.split('\n').filter(l => l.trim());
    if (lines.length <= 4) return text;
    return lines.slice(0, 4).join('\n') + '\n...';
  };

  // 시간 포맷
  const timeAgo = (dateStr: string) => {
    const now = new Date();
    const d = new Date(dateStr);
    const diffMs = now.getTime() - d.getTime();
    const diffMin = Math.floor(diffMs / 60000);
    if (diffMin < 1) return '방금 전';
    if (diffMin < 60) return `${diffMin}분 전`;
    const diffHr = Math.floor(diffMin / 60);
    if (diffHr < 24) return `${diffHr}시간 전`;
    const diffDay = Math.floor(diffHr / 24);
    if (diffDay < 7) return `${diffDay}일 전`;
    return d.toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' });
  };

  return (
    <div className="min-h-screen pb-24">
      <div className="px-6 pt-8 pb-4">
        <h1 className="text-2xl font-bold text-ink-700">시 피드</h1>
        <p className="text-sm text-ink-300 mt-1">다른 사람들의 시를 읽어보세요</p>
      </div>

      <div className="px-6 mb-4 overflow-x-auto scrollbar-hide">
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
        <div className="px-6 space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="rounded-card overflow-hidden shadow-sm">
              <div className="bg-cream-50 p-6">
                <div className="skeleton w-full h-3 mb-2" />
                <div className="skeleton w-5/6 h-3 mb-2" />
                <div className="skeleton w-3/4 h-3 mb-2" />
                <div className="skeleton w-1/2 h-3" />
              </div>
              <div className="bg-white px-5 py-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="skeleton w-8 h-8 rounded-full" />
                  <div>
                    <div className="skeleton w-20 h-4 mb-1" />
                    <div className="skeleton w-16 h-3" />
                  </div>
                </div>
                <div className="flex gap-2">
                  <div className="skeleton w-8 h-4" />
                  <div className="skeleton w-8 h-4" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : fetchError && sorted.length === 0 ? (
        <div className="px-6 py-12 text-center">
          <div className="text-4xl mb-3">🌧️</div>
          <p className="text-ink-400 text-sm mb-2">시를 불러오는 데 문제가 있어요</p>
          <button onClick={() => { setLoading(true); fetchPoems(); }}
            className="text-ink-600 underline text-sm">다시 시도하기 →</button>
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
                    <pre className={`poem-text whitespace-pre-wrap text-sm leading-relaxed ${isDark ? 'text-white' : 'text-ink-600'}`}>
                      {previewPoem(poem.finalPoem)}
                    </pre>
                  </div>
                  <div className="bg-white px-5 py-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <span className="text-lg flex-shrink-0">{flower?.emoji || '🌸'}</span>
                        <div className="min-w-0">
                          <h3 className="font-bold text-ink-700 text-sm truncate">{poem.title || '무제'}</h3>
                          <p className="text-xs text-ink-300">{poem.authorName || '익명'} · {flower?.name} · {timeAgo(poem.createdAt || '')}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                        <button onClick={(e) => { e.preventDefault(); handleLikeToggle(poem.id, poem.likedBy || []); }}
                          className={`flex items-center gap-1 transition-colors ${isLiked ? 'text-red-400' : 'text-ink-300 hover:text-red-400'}`}>
                          <span className={`text-base ${animatingLike === poem.id ? 'heart-pop' : ''}`}>{isLiked ? '❤️' : '♡'}</span>
                          <span className="text-xs">{poem.likes || 0}</span>
                        </button>
                        <span className="text-xs text-ink-200">💬 {commentCount}</span>
                      </div>
                    </div>
                    {/* 신고/차단 버튼 (로그인 + 타인 시만) */}
                    {user && poem.authorId !== user.id && (
                      <div className="flex justify-end gap-2 mt-2 pt-2 border-t border-cream-100">
                        <button onClick={(e) => { e.preventDefault(); setReportModal(poem.id); }}
                          className="text-ink-200 hover:text-red-400 text-[10px] px-2 py-1 rounded-lg hover:bg-red-50 transition-colors">🚨 신고</button>
                        <button onClick={(e) => { e.preventDefault(); setBlockConfirm({ id: poem.authorId, name: poem.authorName || '이 사용자' }); }}
                          className="text-ink-200 hover:text-red-400 text-[10px] px-2 py-1 rounded-lg hover:bg-red-50 transition-colors">🚫 차단</button>
                      </div>
                    )}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}

      {/* Block Confirm Modal */}
      {blockConfirm && (
        <div className="fixed inset-0 z-50 modal-overlay flex items-center justify-center" onClick={() => setBlockConfirm(null)}>
          <div className="bg-white rounded-card w-[90%] max-w-[340px] p-6" onClick={e => e.stopPropagation()}>
            <div className="text-center mb-5">
              <div className="text-4xl mb-3">🚫</div>
              <h3 className="font-bold text-ink-700 text-lg">{blockConfirm.name}님을 차단할까요?</h3>
              <p className="text-sm text-ink-400 mt-2 leading-relaxed">
                차단하면 이 사용자의 시가<br/>더 이상 피드에 표시되지 않아요.
              </p>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setBlockConfirm(null)}
                className="flex-1 py-3 rounded-xl bg-cream-100 text-ink-500 font-medium text-sm">취소</button>
              <button onClick={() => { blockUser(blockConfirm.id); setBlockConfirm(null); toast.showToast('info', `${blockConfirm.name}님을 차단했어요.`); }}
                className="flex-1 py-3 rounded-xl bg-red-500 text-white font-medium text-sm">차단하기</button>
            </div>
          </div>
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
