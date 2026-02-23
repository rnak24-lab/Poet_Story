'use client';

import { useState, useEffect } from 'react';
import { useAppStore, ALL_ACHIEVEMENTS } from '@/store/useAppStore';
import { flowers } from '@/data/flowers';
import { BottomNav } from '@/components/BottomNav';
import Link from 'next/link';
import { RewardedAdButton } from '@/components/AdSense';

/* ===== Terms of Service Content ===== */
const TERMS_OF_SERVICE = `시글담 이용약관

제1조 (목적)
이 약관은 시글담(이하 "서비스")이 제공하는 시 창작 및 공유 서비스의 이용과 관련한 기본적인 사항을 정하는 데 목적이 있습니다.

제2조 (서비스의 내용)
① 서비스는 사용자에게 꽃말을 기반으로 한 시 창작 도구, 시 공유 및 커뮤니티 기능을 제공합니다.
② 연필(크레딧) 시스템을 통해 자동 완성 등 부가 기능을 이용할 수 있습니다.

제3조 (회원가입 및 탈퇴)
① 이용자는 이메일과 비밀번호로 회원가입할 수 있습니다.
② 회원은 언제든 서비스 탈퇴를 요청할 수 있습니다.

제4조 (연필 시스템)
① 연필은 자동 완성 기능 사용 시 1개가 소비됩니다.
② 연필은 광고 시청(1개), 유료 구매(₩1,000에 10개), 추천인 코드 입력(1개) 등으로 획득할 수 있습니다.
③ 구매한 연필은 환불이 불가능합니다.

제5조 (콘텐츠의 권리)
① 사용자가 작성한 시의 저작권은 작성자에게 있습니다.
② 서비스는 시 공유 기능을 위해 작성된 콘텐츠를 플랫폼 내에서 표시할 수 있습니다.

제6조 (금지 행위)
① 타인의 시를 무단으로 복제하거나 도용하는 행위
② 욕설, 비방, 혐오 표현이 포함된 콘텐츠 게시
③ 서비스의 정상적인 운영을 방해하는 행위

제7조 (책임의 한계)
서비스는 AI 자동 완성 기능으로 생성된 콘텐츠에 대해 책임을 지지 않습니다.

부칙
이 약관은 2026년 2월 22일부터 적용됩니다.`;

const PRIVACY_POLICY = `시글담 개인정보처리방침

1. 수집하는 개인정보
① 필수 항목: 이메일 주소, 비밀번호(암호화 저장), 닉네임
② 선택 항목: 추천인 코드
③ 자동 수집 항목: 서비스 이용 기록, 접속 로그

2. 개인정보의 이용 목적
① 회원 관리: 회원 가입, 본인 확인, 서비스 이용
② 서비스 제공: 시 작성·저장·공유, 연필(크레딧) 관리
③ 서비스 개선: 이용 통계 분석, 기능 개선

3. 개인정보의 보관 및 파기
① 회원 탈퇴 시 지체 없이 파기합니다.
② 법령에 따라 보존이 필요한 경우 해당 기간 동안 보관합니다.
  - 전자상거래 관련 기록: 5년
  - 접속 기록: 3개월

4. 개인정보의 제3자 제공
원칙적으로 제3자에게 제공하지 않습니다. 단, 법률에 의해 요구되는 경우 예외로 합니다.

5. 개인정보 보호 조치
① 비밀번호는 단방향 암호화(해시)하여 저장합니다.
② SSL 통신을 통해 데이터를 보호합니다.
③ 개인정보 접근 권한을 최소화합니다.

6. 이용자의 권리
① 개인정보 열람, 수정, 삭제를 요청할 수 있습니다.
② 개인정보 처리에 대한 동의를 철회할 수 있습니다.

7. 문의
개인정보 관련 문의: support@sigeuldam.kr

시행일: 2026년 2월 22일`;

export default function ProfilePage() {
  const store = useAppStore();
  const { user, setUser, isLoggedIn, poems, authorName, setAuthorName, notifications, markAllNotificationsRead, markNotificationRead, allUsers, loginAsAdmin, registerUser, loginUser, verifyEmail, resendVerification, applyReferralCode, buyPencils, watchAd, blockedUsers, unblockUser } = store;
  const [mounted, setMounted] = useState(false);
  const [tab, setTab] = useState<'profile' | 'notifications' | 'stats' | 'achievements' | 'admin'>('profile');
  const [showLogin, setShowLogin] = useState(false);
  const [loginMode, setLoginMode] = useState<'login' | 'register' | 'kakao' | 'naver'>('login');
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginPasswordConfirm, setLoginPasswordConfirm] = useState('');
  const [loginName, setLoginName] = useState('');
  const [loginError, setLoginError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [showVerification, setShowVerification] = useState(false);
  const [verificationCode, setVerificationCode] = useState('');
  const [verifyError, setVerifyError] = useState('');
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [agreedToPrivacy, setAgreedToPrivacy] = useState(false);

  // Terms / Privacy modals
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);

  // Referral code input
  const [referralInput, setReferralInput] = useState('');
  const [referralMsg, setReferralMsg] = useState('');
  const [showReferralInput, setShowReferralInput] = useState(false);

  // Pencil purchase modal
  const [showPurchaseModal, setShowPurchaseModal] = useState(false);

  useEffect(() => { setMounted(true); }, []);
  if (!mounted) return null;

  const myPoems = poems.filter(p => p.authorId === user?.id);
  const collectedFlowerIds = Array.from(new Set(myPoems.map(p => p.flowerId)));
  const totalLikes = myPoems.reduce((sum, p) => sum + p.likes, 0);
  const totalViews = myPoems.reduce((sum, p) => sum + (p.views || 0), 0);
  const unreadNotifs = notifications.filter(n => !n.isRead).length;

  const handleLogin = () => {
    setLoginError('');
    setSuccessMsg('');
    if (loginMode === 'login') {
      const u = loginUser(loginEmail, loginPassword);
      if (u) {
        setAuthorName(u.name);
        setShowLogin(false);
        if (!u.isEmailVerified && u.email && u.email !== 'admin@sigeuldam.kr') {
          setShowVerification(true);
        }
      }
      else setLoginError('이메일 또는 비밀번호가 틀렸습니다.');
    } else if (loginMode === 'register') {
      if (!loginName.trim() || !loginEmail.trim() || !loginPassword.trim()) {
        setLoginError('모든 필드를 채워주세요.');
        return;
      }
      if (!agreedToTerms || !agreedToPrivacy) {
        setLoginError('이용약관과 개인정보처리방침에 모두 동의해주세요.');
        return;
      }
      if (loginPassword !== loginPasswordConfirm) {
        setLoginError('비밀번호가 일치하지 않습니다.');
        return;
      }
      const result = registerUser(loginName.trim(), loginEmail.trim(), loginPassword);
      if (result.error) {
        setLoginError(result.error);
        return;
      }
      if (result.user) {
        setAuthorName(result.user.name);
        setShowLogin(false);
        setShowVerification(true);
      }
    } else {
      // OAuth simulation
      const name = loginName || `${loginMode === 'kakao' ? '카카오' : '네이버'} 사용자`;
      const referralCode = name.slice(0, 2).toUpperCase() + Math.random().toString(36).slice(2, 6).toUpperCase();
      setUser({
        id: `user-${Date.now()}`,
        name,
        email: `${loginMode}@sigeuldam.kr`,
        avatar: '🌸',
        collectedFlowers: [],
        pencils: 3,
        achievements: [],
        shareCount: 0,
        totalLikes: 0,
        totalViews: 0,
        isAdmin: false,
        isEmailVerified: true,
        createdAt: new Date().toISOString(),
        referralCode,
        usedReferralCodes: [],
      });
      setAuthorName(name);
      setShowLogin(false);
    }
  };

  const handleVerifyEmail = () => {
    if (!user?.email) return;
    const success = verifyEmail(user.email, verificationCode);
    if (success) {
      setShowVerification(false);
      setVerifyError('');
      setSuccessMsg('이메일 인증이 완료되었습니다! 🎉');
      setTimeout(() => setSuccessMsg(''), 3000);
    } else {
      setVerifyError('인증 코드가 올바르지 않습니다.');
    }
  };

  const handleResendCode = () => {
    if (!user?.email) return;
    const newCode = resendVerification(user.email);
    if (newCode) {
      alert('새 인증 코드가 이메일로 전송되었어요!');
    }
  };

  const handleApplyReferral = () => {
    const result = applyReferralCode(referralInput.trim().toUpperCase());
    if (result.success) {
      setReferralMsg('✅ 추천 코드가 적용되었어요! ✏️ 연필 1자루를 받았습니다.');
      setReferralInput('');
      setTimeout(() => setReferralMsg(''), 4000);
    } else {
      setReferralMsg(`❌ ${result.error}`);
      setTimeout(() => setReferralMsg(''), 3000);
    }
  };

  const handleLogout = () => { setUser(null); setTab('profile'); };

  return (
    <div className="min-h-screen pb-24">
      <div className="px-6 pt-8 pb-4 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-ink-700">프로필</h1>
        {isLoggedIn && (
          <button onClick={() => setTab('notifications')} className="relative w-10 h-10 rounded-full bg-cream-50 flex items-center justify-center">
            🔔
            {unreadNotifs > 0 && <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-500 text-white text-[10px] flex items-center justify-center">{unreadNotifs > 9 ? '9+' : unreadNotifs}</span>}
          </button>
        )}
      </div>

      {/* Success message */}
      {successMsg && (
        <div className="px-6 mb-4">
          <div className="bg-sage-100 rounded-xl p-3 text-center text-sm text-sage-500 font-medium bubble-in">{successMsg}</div>
        </div>
      )}

      {/* Email verification banner */}
      {isLoggedIn && user && !user.isEmailVerified && user.email && !user.email.includes('@sigeuldam.kr') && (
        <div className="px-6 mb-4">
          <div className="bg-warm-100 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-lg">📧</span>
              <p className="text-sm font-medium text-ink-600">이메일 인증이 필요합니다</p>
            </div>
            <p className="text-xs text-ink-400 mb-3">계정 보호를 위해 이메일 인증을 완료해주세요.</p>
            <button onClick={() => setShowVerification(true)} className="px-4 py-2 bg-ink-700 text-white text-xs rounded-lg font-medium">
              인증하기
            </button>
          </div>
        </div>
      )}

      {/* Tab nav */}
      {isLoggedIn && (
        <div className="px-6 mb-4 overflow-x-auto">
          <div className="flex gap-1 pb-2">
            {(['profile', 'notifications', 'stats', 'achievements', ...(user?.isAdmin ? ['admin'] as const : [])] as const).map(t => (
              <button key={t} onClick={() => setTab(t as any)}
                className={`flex-shrink-0 px-4 py-2 rounded-full text-xs font-medium transition-all ${tab === t ? 'bg-ink-700 text-white' : 'bg-cream-50 text-ink-400'}`}>
                {t === 'profile' ? '프로필' : t === 'notifications' ? `알림${unreadNotifs > 0 ? ` (${unreadNotifs})` : ''}` : t === 'stats' ? '통계' : t === 'achievements' ? '업적' : '관리자'}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ===== PROFILE TAB ===== */}
      {tab === 'profile' && (
        <>
          <div className="px-6 mb-6">
            <div className="bg-cream-100 rounded-card p-6 text-center">
              <div className="w-20 h-20 rounded-full bg-white flex items-center justify-center text-4xl mx-auto mb-3">
                {isLoggedIn ? (user?.avatar || '🌸') : '👤'}
              </div>
              {isLoggedIn ? (
                <>
                  <h2 className="font-bold text-ink-700 text-lg">{user?.name} {user?.isAdmin && '👑'}</h2>
                  <p className="text-sm text-ink-400 mt-1">시 {myPoems.length}편 · 꽃 {collectedFlowerIds.length}송이 · ❤️ {totalLikes}</p>
                  <p className="text-xs text-ink-300 mt-1">👀 총 조회수 {totalViews}회</p>
                  {user?.isEmailVerified ? (
                    <p className="text-xs text-sage-500 mt-1">✅ 인증된 계정</p>
                  ) : user?.email && !user.email.includes('@sigeuldam.kr') ? (
                    <p className="text-xs text-warm-500 mt-1">⚠️ 이메일 인증 필요</p>
                  ) : null}
                  {user?.createdAt && (
                    <p className="text-[10px] text-ink-200 mt-1">가입일: {new Date(user.createdAt).toLocaleDateString('ko-KR')}</p>
                  )}
                </>
              ) : (
                <>
                  <h2 className="font-bold text-ink-600 text-lg">로그인해주세요</h2>
                  <p className="text-sm text-ink-400 mt-1">시를 저장하고 공유해보세요</p>
                  <button onClick={() => setShowLogin(true)} className="mt-4 px-6 py-2.5 bg-ink-700 text-white rounded-xl text-sm font-medium">로그인</button>
                </>
              )}
            </div>
          </div>

          {/* ===== Pencil (연필) Section ===== */}
          {isLoggedIn && user && (
            <div className="px-6 mb-6">
              <div className="bg-gradient-to-r from-amber-50 to-yellow-50 rounded-card p-5 border border-amber-200">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">✏️</span>
                    <div>
                      <h3 className="font-bold text-ink-700">내 연필</h3>
                      <p className="text-xs text-ink-400">자동 완성에 연필 1자루가 필요해요</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-amber-600">{user.pencils || 0}</p>
                    <p className="text-[10px] text-ink-300">자루</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => setShowPurchaseModal(true)}
                    className="flex-1 py-2.5 rounded-xl bg-amber-500 text-white text-sm font-medium hover:bg-amber-600 transition-colors">
                    💰 연필 구매
                  </button>
                  <RewardedAdButton
                    onRewardEarned={() => {
                      watchAd();
                      setSuccessMsg('✏️ 광고 시청 완료! 연필 1자루를 받았어요.');
                      setTimeout(() => setSuccessMsg(''), 3000);
                    }}
                  >
                    <span className="flex-1 py-2.5 px-4 rounded-xl bg-white text-amber-600 text-sm font-medium border border-amber-300 hover:bg-amber-50 transition-colors inline-block">
                      📺 광고 보기 (+1)
                    </span>
                  </RewardedAdButton>
                </div>
              </div>
            </div>
          )}

          {/* ===== Referral Code Section ===== */}
          {isLoggedIn && user && (
            <div className="px-6 mb-6">
              <div className="bg-purple-50 rounded-card p-5 border border-purple-200">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-xl">🎁</span>
                  <h3 className="font-bold text-ink-700">추천인 코드</h3>
                </div>
                {/* My code */}
                <div className="bg-white rounded-xl p-3 mb-3">
                  <p className="text-xs text-ink-400 mb-1">내 추천 코드 (친구에게 공유하세요!)</p>
                  <div className="flex items-center gap-2">
                    <p className="text-lg font-bold text-purple-600 tracking-wider flex-1">{user.referralCode || '...'}</p>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(user.referralCode || '');
                        setSuccessMsg('추천 코드가 복사되었어요! 📋');
                        setTimeout(() => setSuccessMsg(''), 2000);
                      }}
                      className="px-3 py-1.5 bg-purple-100 text-purple-600 rounded-lg text-xs font-medium hover:bg-purple-200">
                      복사
                    </button>
                  </div>
                  <p className="text-[10px] text-ink-300 mt-1">친구가 이 코드를 입력하면 서로 연필 1자루씩!</p>
                </div>
                {/* Enter someone's code */}
                <button onClick={() => setShowReferralInput(!showReferralInput)}
                  className="text-sm text-purple-600 font-medium underline mb-2">
                  {showReferralInput ? '접기' : '추천 코드 입력하기 →'}
                </button>
                {showReferralInput && (
                  <div className="bubble-in">
                    <div className="flex gap-2">
                      <input
                        value={referralInput}
                        onChange={(e) => setReferralInput(e.target.value.toUpperCase())}
                        placeholder="추천인 코드 입력"
                        className="flex-1 bg-white rounded-xl px-4 py-2.5 text-ink-600 placeholder:text-ink-200 focus:outline-none focus:ring-2 focus:ring-purple-300 text-sm font-medium tracking-wider"
                        maxLength={10}
                      />
                      <button
                        onClick={handleApplyReferral}
                        disabled={!referralInput.trim()}
                        className={`px-4 py-2.5 rounded-xl text-sm font-medium ${referralInput.trim() ? 'bg-purple-500 text-white hover:bg-purple-600' : 'bg-purple-100 text-purple-300 cursor-not-allowed'}`}>
                        적용
                      </button>
                    </div>
                    {referralMsg && (
                      <p className={`text-xs mt-2 ${referralMsg.startsWith('✅') ? 'text-sage-500' : 'text-red-500'}`}>{referralMsg}</p>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Flower Collection */}
          <div className="px-6 mb-6">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-ink-600">🌼 꽃 도감</h3>
              <Link href="/flowers" className="text-sm text-ink-400 hover:text-ink-600">꽃 종류 보기 →</Link>
            </div>
            <div className="grid grid-cols-3 gap-3">
              {flowers.map(flower => {
                const collected = collectedFlowerIds.includes(flower.id);
                const poemsForFlower = myPoems.filter(p => p.flowerId === flower.id);
                return (
                  <Link key={flower.id} href={poemsForFlower.length > 0 ? `/poem/${poemsForFlower[0].id}` : `/write?flower=${flower.id}`}
                    className={`p-4 rounded-card text-center transition-all block ${collected ? 'bg-white shadow-sm hover:shadow-md' : 'bg-cream-50 opacity-50 hover:opacity-70'}`}>
                    <div className="w-12 h-12 rounded-full flex items-center justify-center text-2xl mx-auto mb-2"
                      style={{ backgroundColor: flower.color + (collected ? '33' : '11') }}>{flower.emoji}</div>
                    <p className="text-xs font-medium text-ink-600">{flower.name}</p>
                    <p className="text-[10px] text-ink-300">{flower.meaning}</p>
                    {collected ? (
                      <span className="text-[10px] text-sage-500 mt-1 block">수집 완료 ✓</span>
                    ) : (
                      <span className="text-[10px] text-ink-200 mt-1 block">시 쓰기 →</span>
                    )}
                  </Link>
                );
              })}
            </div>
          </div>

          {/* My Poems */}
          <div className="px-6 mb-6">
            <h3 className="font-bold text-ink-600 mb-3">📝 나의 시</h3>
            {myPoems.length === 0 ? (
              <div className="bg-cream-50 rounded-card p-8 text-center">
                <p className="text-ink-300 mb-3">아직 작성한 시가 없어요</p>
                <Link href="/write" className="text-sm text-ink-500 underline">시 쓰러 가기 →</Link>
              </div>
            ) : (
              <div className="space-y-3">
                {myPoems.map(poem => {
                  const flower = flowers.find(f => f.id === poem.flowerId);
                  return (
                    <Link key={poem.id} href={`/poem/${poem.id}`} className="block bg-cream-50 rounded-xl p-4 hover:bg-cream-100 transition-colors">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{flower?.emoji || '🌸'}</span>
                        <div className="flex-1">
                          <h4 className="font-medium text-ink-700 text-sm">{poem.title || '무제'}</h4>
                          <p className="text-xs text-ink-300 mt-0.5 line-clamp-1">{poem.finalPoem}</p>
                        </div>
                        <div className="text-right">
                          <span className="text-xs text-ink-300">♡ {poem.likes}</span>
                          <span className="text-xs text-ink-200 block">💬 {(poem.comments || []).length}</span>
                          <span className="text-xs text-ink-200 block">👀 {poem.views || 0}</span>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>

          {/* Blocked Users */}
          {isLoggedIn && blockedUsers.length > 0 && (
            <div className="px-6 mb-6">
              <h3 className="font-bold text-ink-600 mb-3">🚫 차단한 사용자</h3>
              <div className="space-y-2">
                {blockedUsers.map(userId => {
                  const blockedUser = allUsers.find(u => u.id === userId);
                  const blockedName = blockedUser?.name || userId.replace('sample-', '');
                  return (
                    <div key={userId} className="flex items-center justify-between bg-cream-50 rounded-xl px-4 py-3">
                      <span className="text-sm text-ink-500">{blockedName}</span>
                      <button onClick={() => unblockUser(userId)} className="text-xs text-ink-400 hover:text-ink-600 bg-white px-3 py-1 rounded-lg">
                        차단 해제
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {isLoggedIn && <div className="px-6 mb-6"><button onClick={handleLogout} className="text-sm text-ink-300 underline">로그아웃</button></div>}
        </>
      )}

      {/* ===== NOTIFICATIONS TAB ===== */}
      {tab === 'notifications' && (
        <div className="px-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-ink-600">알림</h3>
            {notifications.length > 0 && (
              <button onClick={markAllNotificationsRead} className="text-xs text-ink-300">모두 읽음</button>
            )}
          </div>
          {notifications.length === 0 ? (
            <div className="bg-cream-50 rounded-card p-8 text-center"><p className="text-ink-300">아직 알림이 없어요</p></div>
          ) : (
            <div className="space-y-2">
              {notifications.slice(0, 50).map(n => (
                <div key={n.id} onClick={() => markNotificationRead(n.id)}
                  className={`p-4 rounded-xl text-sm transition-all cursor-pointer ${n.isRead ? 'bg-cream-50 text-ink-400' : 'bg-warm-100 text-ink-600'}`}>
                  <div className="flex items-center gap-2">
                    <span>{n.type === 'like' ? '❤️' : n.type === 'view_milestone' ? '👀' : n.type === 'comment' ? '💬' : '🏆'}</span>
                    <span className="flex-1">{n.message}</span>
                    {!n.isRead && <span className="w-2 h-2 rounded-full bg-red-400" />}
                  </div>
                  <p className="text-xs text-ink-300 mt-1">{new Date(n.createdAt).toLocaleDateString('ko-KR')}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ===== STATS TAB ===== */}
      {tab === 'stats' && (
        <div className="px-6">
          <h3 className="font-bold text-ink-600 mb-4">📊 나의 통계</h3>
          <div className="grid grid-cols-2 gap-3 mb-6">
            {[
              { label: '작성한 시', value: myPoems.length, icon: '📝' },
              { label: '받은 좋아요', value: totalLikes, icon: '❤️' },
              { label: '총 조회수', value: totalViews, icon: '👀' },
              { label: '수집한 꽃', value: collectedFlowerIds.length, icon: '🌸' },
              { label: '공유 횟수', value: user?.shareCount || 0, icon: '📤' },
              { label: '보유 연필', value: user?.pencils || 0, icon: '✏️' },
              { label: '받은 댓글', value: myPoems.reduce((sum, p) => sum + (p.comments || []).length, 0), icon: '💬' },
            ].map(stat => (
              <div key={stat.label} className="bg-cream-50 rounded-card p-4 text-center">
                <div className="text-2xl mb-1">{stat.icon}</div>
                <p className="text-2xl font-bold text-ink-700">{stat.value}</p>
                <p className="text-xs text-ink-400">{stat.label}</p>
              </div>
            ))}
          </div>
          {myPoems.length > 0 && (
            <>
              <h4 className="font-medium text-ink-500 mb-3 text-sm">시별 통계</h4>
              <div className="space-y-2">
                {myPoems.map(p => {
                  const fl = flowers.find(f => f.id === p.flowerId);
                  return (
                    <div key={p.id} className="bg-cream-50 rounded-xl p-3 flex items-center gap-3">
                      <span>{fl?.emoji || '🌸'}</span>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-ink-600">{p.title || '무제'}</p>
                      </div>
                      <div className="flex gap-3 text-xs text-ink-400">
                        <span>❤️ {p.likes}</span>
                        <span>💬 {(p.comments || []).length}</span>
                        <span>👀 {p.views || 0}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      )}

      {/* ===== ACHIEVEMENTS TAB ===== */}
      {tab === 'achievements' && (
        <div className="px-6">
          <h3 className="font-bold text-ink-600 mb-4">🏆 업적</h3>
          <p className="text-sm text-ink-400 mb-4">달성: {user?.achievements.length || 0} / {ALL_ACHIEVEMENTS.length}</p>
          <div className="space-y-3">
            {ALL_ACHIEVEMENTS.map(ach => {
              const unlocked = user?.achievements.includes(ach.id);
              return (
                <div key={ach.id} className={`p-4 rounded-card flex items-center gap-4 transition-all ${unlocked ? 'bg-warm-100' : 'bg-cream-50 opacity-60'}`}>
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center text-2xl ${unlocked ? 'bg-white' : 'bg-cream-100'}`}>
                    {unlocked ? ach.emoji : '🔒'}
                  </div>
                  <div>
                    <p className={`font-medium text-sm ${unlocked ? 'text-ink-700' : 'text-ink-400'}`}>{ach.title}</p>
                    <p className="text-xs text-ink-300">{ach.description}</p>
                  </div>
                  {unlocked && <span className="ml-auto text-xs text-sage-500">달성 ✓</span>}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ===== ADMIN TAB ===== */}
      {tab === 'admin' && user?.isAdmin && <AdminPanel />}

      {/* Login Modal */}
      {showLogin && (
        <div className="fixed inset-0 z-50 modal-overlay flex items-center justify-center" onClick={() => setShowLogin(false)}>
          <div className="bg-white rounded-card w-[90%] max-w-[380px] p-6 max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <h3 className="font-bold text-ink-700 text-xl text-center mb-6">
              {loginMode === 'register' ? '회원가입' : '로그인'}
            </h3>

            <div className="flex gap-2 mb-4">
              <button onClick={() => { setLoginMode('login'); setLoginError(''); }}
                className={`flex-1 py-2 rounded-xl text-sm font-medium ${loginMode === 'login' ? 'bg-ink-700 text-white' : 'bg-cream-50 text-ink-400'}`}>로그인</button>
              <button onClick={() => { setLoginMode('register'); setLoginError(''); }}
                className={`flex-1 py-2 rounded-xl text-sm font-medium ${loginMode === 'register' ? 'bg-ink-700 text-white' : 'bg-cream-50 text-ink-400'}`}>회원가입</button>
            </div>

            {(loginMode === 'login' || loginMode === 'register') && (
              <div className="space-y-3 mb-4">
                {loginMode === 'register' && (
                  <div>
                    <label className="text-xs text-ink-400 mb-1 block">닉네임</label>
                    <input value={loginName} onChange={(e) => setLoginName(e.target.value)} placeholder="닉네임 (2자 이상)"
                      className="w-full bg-cream-50 rounded-xl px-4 py-3 text-ink-600 placeholder:text-ink-200 focus:outline-none focus:ring-2 focus:ring-warm-300" />
                  </div>
                )}
                <div>
                  <label className="text-xs text-ink-400 mb-1 block">이메일</label>
                  <input value={loginEmail} onChange={(e) => setLoginEmail(e.target.value)} placeholder={loginMode === 'login' ? '이메일' : 'example@email.com'} type="email"
                    className="w-full bg-cream-50 rounded-xl px-4 py-3 text-ink-600 placeholder:text-ink-200 focus:outline-none focus:ring-2 focus:ring-warm-300" />
                </div>
                <div>
                  <label className="text-xs text-ink-400 mb-1 block">비밀번호</label>
                  <input value={loginPassword} onChange={(e) => setLoginPassword(e.target.value)} placeholder={loginMode === 'register' ? '영문+숫자 8자 이상' : '비밀번호'} type="password"
                    className="w-full bg-cream-50 rounded-xl px-4 py-3 text-ink-600 placeholder:text-ink-200 focus:outline-none focus:ring-2 focus:ring-warm-300" />
                </div>
                {loginMode === 'register' && (
                  <>
                    <div>
                      <label className="text-xs text-ink-400 mb-1 block">비밀번호 확인</label>
                      <input value={loginPasswordConfirm} onChange={(e) => setLoginPasswordConfirm(e.target.value)} placeholder="비밀번호를 다시 입력해주세요" type="password"
                        className="w-full bg-cream-50 rounded-xl px-4 py-3 text-ink-600 placeholder:text-ink-200 focus:outline-none focus:ring-2 focus:ring-warm-300" />
                    </div>
                    <div className="bg-cream-50 rounded-xl p-3 text-xs text-ink-400 space-y-1">
                      <p className={loginPassword.length >= 8 ? 'text-sage-500' : ''}>
                        {loginPassword.length >= 8 ? '✅' : '○'} 8자 이상
                      </p>
                      <p className={/[A-Za-z]/.test(loginPassword) && /[0-9]/.test(loginPassword) ? 'text-sage-500' : ''}>
                        {/[A-Za-z]/.test(loginPassword) && /[0-9]/.test(loginPassword) ? '✅' : '○'} 영문 + 숫자 포함
                      </p>
                      <p className={loginPassword === loginPasswordConfirm && loginPasswordConfirm.length > 0 ? 'text-sage-500' : ''}>
                        {loginPassword === loginPasswordConfirm && loginPasswordConfirm.length > 0 ? '✅' : '○'} 비밀번호 일치
                      </p>
                    </div>
                    {/* Terms & Privacy checkboxes */}
                    <div className="space-y-2">
                      <label className="flex items-start gap-2 cursor-pointer">
                        <input type="checkbox" checked={agreedToTerms} onChange={(e) => setAgreedToTerms(e.target.checked)}
                          className="mt-1 w-4 h-4 rounded accent-ink-700" />
                        <span className="text-xs text-ink-400">
                          <button type="button" onClick={(e) => { e.preventDefault(); setShowTermsModal(true); }} className="text-ink-600 underline font-medium">이용약관</button>에 동의합니다
                          {agreedToTerms && <span className="text-sage-500 ml-1">✓</span>}
                        </span>
                      </label>
                      <label className="flex items-start gap-2 cursor-pointer">
                        <input type="checkbox" checked={agreedToPrivacy} onChange={(e) => setAgreedToPrivacy(e.target.checked)}
                          className="mt-1 w-4 h-4 rounded accent-ink-700" />
                        <span className="text-xs text-ink-400">
                          <button type="button" onClick={(e) => { e.preventDefault(); setShowPrivacyModal(true); }} className="text-ink-600 underline font-medium">개인정보처리방침</button>에 동의합니다
                          {agreedToPrivacy && <span className="text-sage-500 ml-1">✓</span>}
                        </span>
                      </label>
                    </div>
                  </>
                )}
                {loginError && <p className="text-red-500 text-xs">{loginError}</p>}
                <button onClick={handleLogin} className="w-full py-3.5 rounded-xl bg-ink-700 text-white font-medium">
                  {loginMode === 'register' ? '가입하기' : '로그인'}
                </button>
                {loginMode === 'register' && (
                  <p className="text-[10px] text-ink-300 text-center leading-relaxed">
                    🔒 비밀번호는 암호화되어 안전하게 저장됩니다.<br/>
                    가입 시 ✏️ 연필 3자루가 지급됩니다!
                  </p>
                )}
              </div>
            )}

            <div className="relative my-4"><div className="border-t border-cream-200" /><span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white px-3 text-xs text-ink-300">또는</span></div>

            <div className="space-y-3">
              <button onClick={() => { setLoginMode('kakao'); handleLogin(); }}
                className="w-full py-3.5 rounded-xl bg-[#FEE500] text-[#3C1E1E] font-medium flex items-center justify-center gap-2 hover:brightness-95">
                <span className="text-lg">💬</span>카카오로 로그인
              </button>
              <button onClick={() => { setLoginMode('naver'); handleLogin(); }}
                className="w-full py-3.5 rounded-xl bg-[#03C75A] text-white font-medium flex items-center justify-center gap-2 hover:brightness-95">
                <span className="text-lg font-bold">N</span>네이버로 로그인
              </button>
            </div>
            <button onClick={() => setShowLogin(false)} className="w-full mt-4 text-sm text-ink-300">닫기</button>
          </div>
        </div>
      )}

      {/* Terms of Service Modal */}
      {showTermsModal && (
        <div className="fixed inset-0 z-[60] modal-overlay flex items-center justify-center" onClick={() => setShowTermsModal(false)}>
          <div className="bg-white rounded-card w-[90%] max-w-[400px] max-h-[80vh] flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="p-5 border-b border-cream-200 flex items-center justify-between">
              <h3 className="font-bold text-ink-700 text-lg">📋 이용약관</h3>
              <button onClick={() => setShowTermsModal(false)} className="text-ink-300 hover:text-ink-500">✕</button>
            </div>
            <div className="flex-1 overflow-y-auto p-5">
              <pre className="text-xs text-ink-500 whitespace-pre-wrap leading-relaxed font-sans">{TERMS_OF_SERVICE}</pre>
            </div>
            <div className="p-4 border-t border-cream-200">
              <button onClick={() => { setAgreedToTerms(true); setShowTermsModal(false); }}
                className="w-full py-3 rounded-xl bg-ink-700 text-white font-medium text-sm">
                동의하고 닫기
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Privacy Policy Modal */}
      {showPrivacyModal && (
        <div className="fixed inset-0 z-[60] modal-overlay flex items-center justify-center" onClick={() => setShowPrivacyModal(false)}>
          <div className="bg-white rounded-card w-[90%] max-w-[400px] max-h-[80vh] flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="p-5 border-b border-cream-200 flex items-center justify-between">
              <h3 className="font-bold text-ink-700 text-lg">🔒 개인정보처리방침</h3>
              <button onClick={() => setShowPrivacyModal(false)} className="text-ink-300 hover:text-ink-500">✕</button>
            </div>
            <div className="flex-1 overflow-y-auto p-5">
              <pre className="text-xs text-ink-500 whitespace-pre-wrap leading-relaxed font-sans">{PRIVACY_POLICY}</pre>
            </div>
            <div className="p-4 border-t border-cream-200">
              <button onClick={() => { setAgreedToPrivacy(true); setShowPrivacyModal(false); }}
                className="w-full py-3 rounded-xl bg-ink-700 text-white font-medium text-sm">
                동의하고 닫기
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Email Verification Modal */}
      {showVerification && (
        <div className="fixed inset-0 z-50 modal-overlay flex items-center justify-center" onClick={() => setShowVerification(false)}>
          <div className="bg-white rounded-card w-[90%] max-w-[380px] p-6" onClick={e => e.stopPropagation()}>
            <div className="text-center mb-6">
              <div className="text-4xl mb-3">📧</div>
              <h3 className="font-bold text-ink-700 text-xl">이메일 인증</h3>
              <p className="text-sm text-ink-400 mt-2">
                {user?.email}로 전송된<br/>인증 코드 6자리를 입력해주세요
              </p>
            </div>



            <input
              value={verificationCode}
              onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder="인증 코드 6자리"
              className="w-full bg-cream-50 rounded-xl px-4 py-4 text-center text-xl font-bold tracking-[0.5em] text-ink-600 placeholder:text-ink-200 placeholder:tracking-normal placeholder:text-base placeholder:font-normal focus:outline-none focus:ring-2 focus:ring-warm-300 mb-3"
              maxLength={6}
            />
            {verifyError && <p className="text-red-500 text-xs text-center mb-3">{verifyError}</p>}
            <button
              onClick={handleVerifyEmail}
              disabled={verificationCode.length !== 6}
              className={`w-full py-3.5 rounded-xl font-medium ${
                verificationCode.length === 6
                  ? 'bg-ink-700 text-white'
                  : 'bg-ink-100 text-ink-300 cursor-not-allowed'
              }`}
            >
              인증 완료
            </button>
            <div className="flex justify-between mt-4">
              <button onClick={handleResendCode} className="text-xs text-ink-400 underline">코드 재전송</button>
              <button onClick={() => setShowVerification(false)} className="text-xs text-ink-300">나중에 하기</button>
            </div>
          </div>
        </div>
      )}

      {/* Pencil Purchase Modal */}
      {showPurchaseModal && (
        <div className="fixed inset-0 z-50 modal-overlay flex items-center justify-center" onClick={() => setShowPurchaseModal(false)}>
          <div className="bg-white rounded-card w-[90%] max-w-[380px] p-6" onClick={e => e.stopPropagation()}>
            <div className="text-center mb-6">
              <div className="text-4xl mb-3">✏️</div>
              <h3 className="font-bold text-ink-700 text-xl">연필 구매</h3>
              <p className="text-sm text-ink-400 mt-2">자동 완성에 연필 1자루가 필요해요</p>
            </div>

            <div className="space-y-3 mb-6">
              {[
                { count: 10, price: '₩1,000', label: '기본', badge: '' },
                { count: 30, price: '₩2,500', label: '인기', badge: '🔥 17% 할인' },
                { count: 60, price: '₩4,000', label: '알뜰', badge: '💎 33% 할인' },
                { count: 150, price: '₩8,000', label: '대량', badge: '🏆 47% 할인' },
              ].map(pkg => (
                <button
                  key={pkg.count}
                  onClick={() => {
                    // Navigate to payment page for real purchase
                    window.location.href = '/payment';
                    setShowPurchaseModal(false);
                  }}
                  className="w-full flex items-center gap-4 p-4 bg-cream-50 rounded-xl hover:bg-cream-100 transition-colors text-left"
                >
                  <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center">
                    <span className="text-xl">✏️</span>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-bold text-ink-700">연필 {pkg.count}자루</p>
                      {pkg.badge && <span className="text-[10px] text-amber-600 bg-amber-100 px-1.5 py-0.5 rounded-full">{pkg.badge}</span>}
                    </div>
                    <p className="text-xs text-ink-400">{pkg.label} 패키지</p>
                  </div>
                  <p className="font-bold text-ink-700">{pkg.price}</p>
                </button>
              ))}
            </div>

            <div className="bg-cream-50 rounded-xl p-3 text-xs text-ink-400 space-y-1">
              <p>📺 광고 보기: 무료로 연필 1자루</p>
              <p>🎁 추천인 코드: 서로 연필 1자루씩</p>
            </div>

            <button onClick={() => setShowPurchaseModal(false)} className="w-full mt-4 text-sm text-ink-300">닫기</button>
          </div>
        </div>
      )}

      <BottomNav active="profile" />
    </div>
  );
}

/* ===== ADMIN PANEL ===== */
function AdminPanel() {
  const { allUsers, poems, hidePoem, unhidePoem, notifications } = useAppStore();
  const [adminTab, setAdminTab] = useState<'users' | 'poems' | 'reports'>('users');

  const reportedPoems = poems.filter(p => (p.reports || []).length > 0);

  return (
    <div className="px-6">
      <h3 className="font-bold text-ink-600 mb-4">👑 관리자 대시보드</h3>
      <div className="grid grid-cols-3 gap-3 mb-4">
        <div className="bg-purple-50 rounded-xl p-3 text-center">
          <p className="text-xl font-bold text-purple-600">{allUsers.length}</p>
          <p className="text-xs text-purple-400">전체 회원</p>
        </div>
        <div className="bg-blue-50 rounded-xl p-3 text-center">
          <p className="text-xl font-bold text-blue-600">{poems.length}</p>
          <p className="text-xs text-blue-400">전체 시</p>
        </div>
        <div className="bg-red-50 rounded-xl p-3 text-center">
          <p className="text-xl font-bold text-red-600">{reportedPoems.length}</p>
          <p className="text-xs text-red-400">신고된 시</p>
        </div>
      </div>

      <div className="flex gap-2 mb-4">
        {(['users', 'poems', 'reports'] as const).map(t => (
          <button key={t} onClick={() => setAdminTab(t)}
            className={`flex-1 py-2 rounded-xl text-xs font-medium ${adminTab === t ? 'bg-ink-700 text-white' : 'bg-cream-50 text-ink-400'}`}>
            {t === 'users' ? '회원 관리' : t === 'poems' ? '시 관리' : '신고 관리'}
          </button>
        ))}
      </div>

      {adminTab === 'users' && (
        <div className="space-y-2">
          {allUsers.map(u => (
            <div key={u.id} className="bg-cream-50 rounded-xl p-3 flex items-center gap-3">
              <span className="text-xl">{u.avatar}</span>
              <div className="flex-1">
                <p className="text-sm font-medium text-ink-600">
                  {u.name} {u.isAdmin && '👑'}
                  {u.isEmailVerified ? <span className="text-[10px] text-sage-500 ml-1">✅</span> : <span className="text-[10px] text-warm-500 ml-1">⚠️</span>}
                </p>
                <p className="text-xs text-ink-300">{u.email || u.id}</p>
                <p className="text-[10px] text-ink-200">추천코드: {u.referralCode || '-'}</p>
              </div>
              <div className="text-xs text-ink-300">
                <p>시 {poems.filter(p => p.authorId === u.id).length}편</p>
                <p>✏️ {u.pencils || 0}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {adminTab === 'poems' && (
        <div className="space-y-2">
          {poems.map(p => (
            <div key={p.id} className={`rounded-xl p-3 flex items-center gap-3 ${p.isHidden ? 'bg-red-50' : 'bg-cream-50'}`}>
              <div className="flex-1">
                <p className="text-sm font-medium text-ink-600">{p.title || '무제'} <span className="text-xs text-ink-300">by {p.authorName}</span></p>
                <p className="text-xs text-ink-300 line-clamp-1">{p.finalPoem}</p>
                <p className="text-[10px] text-ink-200">❤️ {p.likes} · 💬 {(p.comments || []).length} · 👀 {p.views || 0}</p>
              </div>
              <div className="flex gap-1">
                {p.isHidden ? (
                  <button onClick={() => unhidePoem(p.id)} className="text-xs px-2 py-1 bg-sage-100 text-sage-500 rounded-lg">복원</button>
                ) : (
                  <button onClick={() => hidePoem(p.id)} className="text-xs px-2 py-1 bg-red-100 text-red-500 rounded-lg">숨기기</button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {adminTab === 'reports' && (
        <div className="space-y-3">
          {reportedPoems.length === 0 ? (
            <div className="bg-cream-50 rounded-xl p-6 text-center"><p className="text-ink-300">신고된 게시글이 없습니다.</p></div>
          ) : (
            reportedPoems.map(p => (
              <div key={p.id} className="bg-red-50 rounded-xl p-4">
                <p className="text-sm font-medium text-ink-600 mb-1">"{p.title || '무제'}" by {p.authorName}</p>
                <p className="text-xs text-ink-400 line-clamp-2 mb-2">{p.finalPoem}</p>
                <div className="space-y-1 mb-2">
                  {(p.reports || []).map((r, i) => (
                    <div key={i} className="text-xs bg-white rounded-lg p-2">
                      <span className="text-red-500">🚨 {r.reason}</span>
                      <span className="text-ink-300 ml-2">— {r.reporterName}</span>
                    </div>
                  ))}
                </div>
                <div className="flex gap-2">
                  {p.isHidden ? (
                    <button onClick={() => unhidePoem(p.id)} className="text-xs px-3 py-1.5 bg-sage-100 text-sage-500 rounded-lg">복원</button>
                  ) : (
                    <button onClick={() => hidePoem(p.id)} className="text-xs px-3 py-1.5 bg-red-100 text-red-500 rounded-lg">숨기기</button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
