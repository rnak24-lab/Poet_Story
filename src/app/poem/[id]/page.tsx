'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAppStore } from '@/store/useAppStore';
import { flowers } from '@/data/flowers';
import Link from 'next/link';
import type { CommentItem } from '@/store/useAppStore';

export default function PoemDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { poems, likePoem, unlikePoem, viewPoem, user, reportPoem, incrementShareCount, showSharePopup, setShowSharePopup, addComment, likeComment, deleteComment, blockUser, blockedUsers } = useAppStore();
  const [mounted, setMounted] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const [reportReason, setReportReason] = useState('');
  const [showLocalShare, setShowLocalShare] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [showComments, setShowComments] = useState(true);
  const poemRef = useRef<HTMLDivElement>(null);
  const commentInputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => { setMounted(true); }, []);
  useEffect(() => {
    if (mounted && params.id) {
      viewPoem(params.id as string);
    }
  }, [mounted, params.id]);

  useEffect(() => {
    if (mounted && showSharePopup) {
      setShowLocalShare(true);
      const timer = setTimeout(() => setShowSharePopup(false), 100);
      return () => clearTimeout(timer);
    }
  }, [mounted, showSharePopup]);

  if (!mounted) return null;

  const poemId = params.id as string;
  const poem = poems.find(p => p.id === poemId);

  if (!poem) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-ink-400 mb-4">시를 찾을 수 없어요</p>
          <Link href="/" className="text-ink-600 underline">홈으로 돌아가기</Link>
        </div>
      </div>
    );
  }

  const flower = flowers.find(f => f.id === poem.flowerId);
  const isDark = poem.background.includes('800') || poem.background.includes('700');
  const isLiked = user && poem.likedBy?.includes(user.id);
  const comments = poem.comments || [];

  const handleLikeToggle = () => {
    if (!user) return;
    if (isLiked) unlikePoem(poemId, user.id);
    else likePoem(poemId, user.id);
  };

  const handleShare = async (method: 'link' | 'kakao' | 'twitter' | 'clipboard') => {
    incrementShareCount();
    const shareText = `${poem.title}\n\n${poem.finalPoem}\n\n— ${poem.authorName}\n\n시글담에서 나만의 시 쓰기`;
    const shareUrl = window.location.href;

    if (method === 'link' || method === 'clipboard') {
      try {
        await navigator.clipboard.writeText(`${shareText}\n${shareUrl}`);
        alert('링크가 복사되었습니다!');
      } catch { alert('복사에 실패했습니다.'); }
    } else if (method === 'kakao') {
      // 카카오톡 공유 (카카오톡 링크)
      const kakaoShareUrl = `https://sharer.kakao.com/talk/friends/picker/link?app_key=javascript_key&text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`;
      // Fallback: 모바일에서 카카오톡 앱으로 직접 공유
      if (navigator.share) {
        try {
          await navigator.share({
            title: poem.title || '시글담',
            text: shareText,
            url: shareUrl,
          });
        } catch {
          // User cancelled or error - try clipboard
          await navigator.clipboard.writeText(`${shareText}\n${shareUrl}`);
          alert('카카오톡에 붙여넣기 해주세요! 링크가 복사되었어요.');
        }
      } else {
        // Desktop: 링크 복사 후 안내
        try {
          await navigator.clipboard.writeText(`${shareText}\n${shareUrl}`);
          alert('링크가 복사되었어요! 카카오톡에 붙여넣기 해주세요.');
        } catch {
          alert('복사에 실패했습니다.');
        }
      }
    } else if (method === 'twitter') {
      window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`, '_blank');
    }
    setShowLocalShare(false);
  };

  const handleCapture = async () => {
    if (poemRef.current) {
      try {
        const html2canvas = (await import('html2canvas')).default;
        const canvas = await html2canvas(poemRef.current, { backgroundColor: null, scale: 2 });
        const link = document.createElement('a');
        link.download = `${poem.title || '시글담'}.png`;
        link.href = canvas.toDataURL();
        link.click();
        incrementShareCount();
      } catch { alert('이미지 저장 기능을 사용할 수 없습니다.'); }
    }
  };

  const handleReport = () => {
    if (!reportReason.trim() || !user) return;
    reportPoem(poemId, { reporterId: user.id, reporterName: user.name, reason: reportReason, createdAt: new Date().toISOString() });
    setShowReport(false);
    setReportReason('');
    alert('신고가 접수되었습니다.');
  };

  const handleAddComment = () => {
    if (!commentText.trim() || !user) return;
    const newComment: CommentItem = {
      id: `comment-${Date.now()}-${Math.random().toString(36).slice(2)}`,
      poemId,
      authorId: user.id,
      authorName: user.name,
      authorAvatar: user.avatar || '🌸',
      text: commentText.trim(),
      createdAt: new Date().toISOString(),
      likes: 0,
      likedBy: [],
    };
    addComment(poemId, newComment);
    setCommentText('');
  };

  const handleCommentLike = (commentId: string) => {
    if (!user) return;
    likeComment(poemId, commentId, user.id);
  };

  const handleDeleteComment = (commentId: string) => {
    if (confirm('댓글을 삭제하시겠습니까?')) {
      deleteComment(poemId, commentId);
    }
  };

  const timeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return '방금 전';
    if (mins < 60) return `${mins}분 전`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}시간 전`;
    const days = Math.floor(hours / 24);
    if (days < 30) return `${days}일 전`;
    return new Date(dateStr).toLocaleDateString('ko-KR');
  };

  return (
    <div className="min-h-screen bg-warm-50 pb-12">
      <div className="px-6 pt-6 pb-3 flex items-center justify-between bg-white">
        <button onClick={() => router.push('/')} className="text-ink-400 text-sm">← 홈으로</button>
        <div className="flex items-center gap-2"><span>{flower?.emoji}</span><span className="text-xs text-ink-400">{flower?.name}</span></div>
        <div className="flex items-center gap-2">
          {user && poem.authorId !== user.id && (
            <button onClick={() => {
              if (confirm(`${poem.authorName || '이 사용자'}님을 차단하시겠어요? 이 사용자의 시가 더 이상 보이지 않습니다.`)) {
                blockUser(poem.authorId);
                router.push('/');
              }
            }} className="text-xs text-ink-300 hover:text-red-400">🚫 차단</button>
          )}
          {user && poem.authorId !== user.id && (
            <button onClick={() => setShowReport(true)} className="text-xs text-ink-300 hover:text-red-400">🚨 신고</button>
          )}
        </div>
      </div>

      <div className="px-6 py-6">
        <div ref={poemRef} className={`${poem.background} rounded-card p-8 min-h-[400px] flex flex-col justify-center items-center relative`}>
          <h1 className={`text-xl font-bold mb-8 ${isDark ? 'text-white' : 'text-ink-700'}`}>{poem.title}</h1>
          <pre className={`poem-text whitespace-pre-wrap text-center ${isDark ? 'text-white/90' : 'text-ink-600'}`}>{poem.finalPoem}</pre>
          <div className={`mt-8 text-sm ${isDark ? 'text-white/60' : 'text-ink-300'}`}>— {poem.authorName}</div>
          <div className="absolute bottom-4 right-4 text-3xl opacity-20">{flower?.emoji}</div>
        </div>
      </div>

      {/* Action buttons */}
      <div className="px-6">
        <div className="flex items-center justify-center gap-8 mb-6">
          <button onClick={handleLikeToggle} className="flex flex-col items-center gap-1">
            <span className={`text-2xl ${isLiked ? 'text-red-400' : 'text-ink-200'}`}>{isLiked ? '❤️' : '♡'}</span>
            <span className="text-xs text-ink-400">{poem.likes}</span>
          </button>
          <button onClick={() => { setShowComments(true); commentInputRef.current?.focus(); }} className="flex flex-col items-center gap-1">
            <span className="text-2xl text-ink-300">💬</span>
            <span className="text-xs text-ink-400">{comments.length}</span>
          </button>
          <button onClick={() => setShowLocalShare(true)} className="flex flex-col items-center gap-1">
            <span className="text-2xl text-ink-300">📤</span>
            <span className="text-xs text-ink-400">공유</span>
          </button>
          <button onClick={handleCapture} className="flex flex-col items-center gap-1">
            <span className="text-2xl text-ink-300">📸</span>
            <span className="text-xs text-ink-400">저장</span>
          </button>
          <div className="flex flex-col items-center gap-1">
            <span className="text-2xl text-ink-200">👀</span>
            <span className="text-xs text-ink-400">{poem.views || 0}</span>
          </div>
        </div>
      </div>

      {/* Share prompt */}
      <div className="px-6 mb-6">
        <div className="bg-cream-50 rounded-xl p-4 flex items-center gap-3">
          <span className="text-2xl">🌸</span>
          <div className="flex-1">
            <p className="text-sm text-ink-600 font-medium">이 시가 마음에 드셨나요?</p>
            <p className="text-xs text-ink-400">친구에게 추천해보세요!</p>
          </div>
          <button onClick={() => setShowLocalShare(true)} className="px-3 py-1.5 bg-ink-700 text-white text-xs rounded-lg font-medium">
            공유하기
          </button>
        </div>
      </div>

      {/* Comments Section */}
      <div className="px-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-ink-600">💬 댓글 {comments.length > 0 && `(${comments.length})`}</h3>
          <button onClick={() => setShowComments(!showComments)} className="text-xs text-ink-300">
            {showComments ? '접기' : '펼치기'}
          </button>
        </div>

        {showComments && (
          <>
            {/* Comment input */}
            {user ? (
              <div className="mb-4 bg-white rounded-card p-4 shadow-sm">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-cream-100 flex items-center justify-center text-sm flex-shrink-0">
                    {user.avatar || '🌸'}
                  </div>
                  <div className="flex-1">
                    <textarea
                      ref={commentInputRef}
                      value={commentText}
                      onChange={(e) => setCommentText(e.target.value)}
                      placeholder="따뜻한 댓글을 남겨주세요..."
                      className="w-full bg-cream-50 rounded-xl p-3 text-sm text-ink-600 placeholder:text-ink-200 focus:outline-none focus:ring-1 focus:ring-warm-300 resize-none min-h-[60px]"
                      rows={2}
                    />
                    <div className="flex justify-between items-center mt-2">
                      <span className="text-xs text-ink-300">{commentText.length}/200</span>
                      <button
                        onClick={handleAddComment}
                        disabled={!commentText.trim() || commentText.length > 200}
                        className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${
                          commentText.trim() && commentText.length <= 200
                            ? 'bg-ink-700 text-white hover:bg-ink-600'
                            : 'bg-ink-100 text-ink-300 cursor-not-allowed'
                        }`}
                      >
                        등록
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="mb-4 bg-cream-50 rounded-xl p-4 text-center">
                <p className="text-sm text-ink-400">댓글을 작성하려면 로그인해주세요</p>
                <Link href="/profile" className="text-sm text-ink-600 underline mt-1 inline-block">로그인하기 →</Link>
              </div>
            )}

            {/* Comment list */}
            {comments.length === 0 ? (
              <div className="bg-cream-50 rounded-xl p-6 text-center">
                <p className="text-ink-300 text-sm">아직 댓글이 없어요</p>
                <p className="text-ink-200 text-xs mt-1">첫 번째 댓글을 남겨보세요!</p>
              </div>
            ) : (
              <div className="space-y-3">
                {comments.map(comment => {
                  const isCommentLiked = user && comment.likedBy.includes(user.id);
                  const canDelete = user && (user.id === comment.authorId || user.isAdmin);
                  return (
                    <div key={comment.id} className="bg-white rounded-xl p-4 shadow-sm bubble-in">
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-full bg-cream-100 flex items-center justify-center text-sm flex-shrink-0">
                          {comment.authorAvatar}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-sm font-medium text-ink-600">{comment.authorName}</span>
                            <span className="text-xs text-ink-200">{timeAgo(comment.createdAt)}</span>
                          </div>
                          <p className="text-sm text-ink-500 leading-relaxed break-words">{comment.text}</p>
                          <div className="flex items-center gap-4 mt-2">
                            <button
                              onClick={() => handleCommentLike(comment.id)}
                              className={`flex items-center gap-1 text-xs transition-colors ${
                                isCommentLiked ? 'text-red-400' : 'text-ink-300 hover:text-red-400'
                              }`}
                            >
                              <span>{isCommentLiked ? '❤️' : '♡'}</span>
                              <span>{comment.likes > 0 ? comment.likes : ''}</span>
                            </button>
                            {canDelete && (
                              <button
                                onClick={() => handleDeleteComment(comment.id)}
                                className="text-xs text-ink-200 hover:text-red-400"
                              >
                                삭제
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>

      <div className="px-6 mt-6">
        <Link href="/" className="block text-center text-sm text-ink-300">홈으로 돌아가기</Link>
      </div>

      {/* Share Popup */}
      {showLocalShare && (
        <div className="fixed inset-0 z-50 modal-overlay flex items-end justify-center" onClick={() => setShowLocalShare(false)}>
          <div className="bg-white rounded-t-card w-full max-w-[430px] p-6 pb-10 animate-slide-up" onClick={e => e.stopPropagation()}>
            <div className="w-12 h-1 bg-ink-100 rounded-full mx-auto mb-4" />
            <h3 className="font-bold text-ink-700 text-lg mb-1">시를 공유해보세요! 🌸</h3>
            <p className="text-sm text-ink-400 mb-4">친구에게 나만의 시를 보여주세요</p>
            <div className="grid grid-cols-2 gap-3">
              <button onClick={() => handleShare('clipboard')} className="py-4 rounded-xl bg-cream-50 text-ink-500 font-medium flex flex-col items-center gap-2 hover:bg-cream-100">
                <span className="text-2xl">🔗</span><span className="text-sm">링크 복사</span>
              </button>
              <button onClick={() => handleShare('kakao')} className="py-4 rounded-xl bg-[#FEE500]/20 text-[#3C1E1E] font-medium flex flex-col items-center gap-2 hover:bg-[#FEE500]/30">
                <span className="text-2xl">💬</span><span className="text-sm">카카오톡</span>
              </button>
              <button onClick={() => handleShare('twitter')} className="py-4 rounded-xl bg-blue-50 text-blue-600 font-medium flex flex-col items-center gap-2 hover:bg-blue-100">
                <span className="text-2xl">🐦</span><span className="text-sm">트위터</span>
              </button>
              <button onClick={handleCapture} className="py-4 rounded-xl bg-green-50 text-green-600 font-medium flex flex-col items-center gap-2 hover:bg-green-100">
                <span className="text-2xl">📸</span><span className="text-sm">이미지 저장</span>
              </button>
            </div>
            <button onClick={() => setShowLocalShare(false)} className="w-full mt-4 py-3 rounded-xl bg-cream-100 text-ink-400 font-medium">닫기</button>
          </div>
        </div>
      )}

      {/* Report Modal */}
      {showReport && (
        <div className="fixed inset-0 z-50 modal-overlay flex items-center justify-center" onClick={() => setShowReport(false)}>
          <div className="bg-white rounded-card w-[90%] max-w-[360px] p-6" onClick={e => e.stopPropagation()}>
            <h3 className="font-bold text-ink-700 text-lg mb-4">🚨 게시글 신고</h3>
            <div className="space-y-2 mb-4">
              {['부적절한 내용', '혐오/차별 표현', '스팸/광고', '개인정보 노출', '기타'].map(reason => (
                <button key={reason} onClick={() => setReportReason(reason)}
                  className={`w-full text-left px-4 py-2.5 rounded-xl text-sm transition-all ${reportReason === reason ? 'bg-red-50 text-red-600 ring-1 ring-red-200' : 'bg-cream-50 text-ink-500'}`}>
                  {reason}
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              <button onClick={() => setShowReport(false)} className="flex-1 py-3 rounded-xl bg-cream-100 text-ink-500 font-medium">취소</button>
              <button onClick={handleReport} disabled={!reportReason.trim()} className="flex-1 py-3 rounded-xl bg-red-500 text-white font-medium disabled:opacity-50">신고하기</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
