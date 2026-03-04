'use client';

import { useState, useEffect } from 'react';
import { useAppStore, ALL_ACHIEVEMENTS, type ActivityLog, type ActivityType } from '@/store/useAppStore';
import { flowers } from '@/data/flowers';
import { BottomNav } from '@/components/BottomNav';
import { Footer } from '@/components/Footer';
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
② 연필은 추천인 코드 입력(서로 1개씩), 유료 구매, 광고 시청 등으로 획득할 수 있습니다.
③ 구매한 연필은 환불이 불가능합니다.

제5조 (콘텐츠의 권리)
① 사용자가 작성한 시의 저작권은 작성자에게 있습니다.
② 서비스는 시 공유 기능을 위해 작성된 콘텐츠를 플랫폼 내에서 표시할 수 있습니다.

제6조 (금지 행위 및 계정 차단)
아래에 해당하는 콘텐츠를 게시할 경우 경고 없이 계정이 영구 차단될 수 있습니다.

① 성적 콘텐츠: 음란물, 노골적 성적 묘사, 미성년자 관련 성적 표현
② 폭력/위협: 특정인 살해 협박, 자해·자살 조장, 테러 미화
③ 차별/혐오 표현: 인종·성별·종교·장애·성적지향 비하 및 혐오 선동
④ 불법 콘텐츠: 마약·도박 홍보, 사기·피싱 유도, 개인정보 유출
⑤ 저작권 침해: 타인의 시·가사를 무단 도용하여 자신의 작품으로 게시
⑥ 스팸/악용: 광고성 게시물, 도배, 추천 코드 악용(다중 계정 생성)

위반 시 조치:
- 경미한 위반: 1차 경고 → 2차 게시물 삭제 → 3차 영구 차단
- 심각한 위반(성범죄·테러 관련 등): 즉시 영구 차단 및 관련 기관 신고

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

const COMMUNITY_GUIDELINES = `시글담 커뮤니티 가이드라인

시글담은 모든 이용자가 안전하고 건강한 환경에서 시를 쓰고 나눌 수 있도록 아래 규칙을 운영합니다. 위반 시 경고 없이 계정이 영구 차단될 수 있습니다.

🚫 금지 콘텐츠

1. 성적 콘텐츠
   - 음란물, 노골적 성적 묘사
   - 미성년자 관련 성적 표현

2. 폭력 및 위협
   - 특정인에 대한 살해 협박
   - 자해·자살 조장 또는 미화
   - 테러 미화 또는 선동

3. 차별 및 혐오 표현
   - 인종, 성별, 종교, 장애, 성적지향 등에 대한 비하
   - 특정 집단에 대한 혐오 선동

4. 불법 콘텐츠
   - 마약, 도박 홍보
   - 사기, 피싱 유도
   - 타인의 개인정보 유출

5. 저작권 침해
   - 타인의 시, 가사 등을 무단 도용하여 자신의 작품으로 게시

6. 스팸 및 악용
   - 광고성 게시물, 도배
   - 추천 코드 악용 (다중 계정 생성)

⚠️ 위반 시 조치

- 경미한 위반: 1차 경고 → 2차 게시물 삭제 → 3차 영구 차단
- 심각한 위반 (성범죄, 테러 관련 등): 즉시 영구 차단 및 관련 기관 신고

위 가이드라인에 동의하지 않는 경우 서비스를 이용할 수 없습니다.`;

export default function ProfilePage() {
  const store = useAppStore();
  const { user, setUser, isLoggedIn, poems, authorName, setAuthorName, notifications, markAllNotificationsRead, markNotificationRead, allUsers, loginAsAdmin, registerUser, loginUser, verifyEmail, completeEmailVerification, resendVerification, resetUserPassword, applyReferralCode, buyPencils, watchAd, blockedUsers, unblockUser, activityLogs, changePassword, deletePoem } = store;
  const [mounted, setMounted] = useState(false);
  const [tab, setTab] = useState<'profile' | 'notifications' | 'stats' | 'achievements' | 'activity' | 'settings' | 'admin'>('profile');
  const [showLogin, setShowLogin] = useState(false);
  const [loginMode, setLoginMode] = useState<'login' | 'register' | 'forgot' | 'kakao' | 'naver'>('login');
  // Password reset states
  const [resetStep, setResetStep] = useState<'email' | 'code' | 'newpw'>('email');
  const [resetEmail, setResetEmail] = useState('');
  const [resetCode, setResetCode] = useState('');
  const [resetNewPw, setResetNewPw] = useState('');
  const [resetNewPwConfirm, setResetNewPwConfirm] = useState('');
  const [resetError, setResetError] = useState('');
  const [resetLoading, setResetLoading] = useState(false);
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginPasswordConfirm, setLoginPasswordConfirm] = useState('');
  const [loginName, setLoginName] = useState('');
  const [loginError, setLoginError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [showVerification, setShowVerification] = useState(false);
  const [verificationCode, setVerificationCode] = useState('');
  const [verifyError, setVerifyError] = useState('');
  const [verificationEmail, setVerificationEmail] = useState(''); // 인증 대상 이메일
  const [isEmailSending, setIsEmailSending] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [agreedToPrivacy, setAgreedToPrivacy] = useState(false);
  const [agreedToGuidelines, setAgreedToGuidelines] = useState(false);

  // Terms / Privacy / Guidelines modals
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const [showGuidelinesModal, setShowGuidelinesModal] = useState(false);

  // Referral code input
  const [referralInput, setReferralInput] = useState('');
  const [referralMsg, setReferralMsg] = useState('');
  const [showReferralInput, setShowReferralInput] = useState(false);

  // Pencil purchase modal
  const [showPurchaseModal, setShowPurchaseModal] = useState(false);

  // Password change
  const [currentPw, setCurrentPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [newPwConfirm, setNewPwConfirm] = useState('');
  const [pwMsg, setPwMsg] = useState('');
  const [pwSuccess, setPwSuccess] = useState(false);

  // Activity log filter
  const [logFilter, setLogFilter] = useState<'all' | ActivityType>('all');

  // DB poems & notifications
  const [dbPoems, setDbPoems] = useState<any[]>([]);
  const [dbNotifications, setDbNotifications] = useState<any[]>([]);

  useEffect(() => { setMounted(true); }, []);

  // Fetch user's poems and notifications from DB
  useEffect(() => {
    if (!user?.id) return;
    // Fetch poems
    fetch(`/api/poems?authorId=${user.id}&limit=100`)
      .then(r => r.ok ? r.json() : null)
      .then(data => { if (data?.poems) setDbPoems(data.poems); })
      .catch(() => {});
    // Fetch notifications
    fetch(`/api/notifications?userId=${user.id}`)
      .then(r => r.ok ? r.json() : null)
      .then(data => { if (data?.notifications) setDbNotifications(data.notifications); })
      .catch(() => {});
  }, [user?.id]);

  if (!mounted) return null;

  // Merge local + DB poems (DB takes priority, dedup by id)
  const dbPoemIds = new Set(dbPoems.map(p => p.id));
  const mergedMyPoems = [
    ...dbPoems.filter(p => p.authorId === user?.id),
    ...poems.filter(p => p.authorId === user?.id && !dbPoemIds.has(p.id)),
  ];
  const myPoems = mergedMyPoems;

  // Merge notifications
  const dbNotifIds = new Set(dbNotifications.map(n => n.id));
  const mergedNotifications = [
    ...dbNotifications,
    ...notifications.filter(n => !dbNotifIds.has(n.id)),
  ];

  const collectedFlowerIds = Array.from(new Set(myPoems.map(p => p.flowerId)));
  const totalLikes = myPoems.reduce((sum, p) => sum + (p.likes || 0), 0);
  const totalViews = myPoems.reduce((sum, p) => sum + (p.views || 0), 0);
  const unreadNotifs = mergedNotifications.filter(n => !n.isRead).length;

  const handleLogin = async () => {
    setLoginError('');
    setSuccessMsg('');
    if (loginMode === 'login') {
      // Server-based login
      try {
        const res = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: loginEmail.trim(), password: loginPassword }),
        });
        const data = await res.json();

        if (res.status === 403 && data.needsVerification) {
          // Email not verified — show verification modal
          setVerificationEmail(loginEmail.trim());
          if (data.user) {
            setUser({ ...data.user, usedReferralCodes: [], achievements: [], shareCount: 0, totalLikes: 0, totalViews: 0 });
          }
          setShowLogin(false);
          setShowVerification(true);
          // Re-send verification email
          setIsEmailSending(true);
          try {
            await fetch('/api/auth/send-verification', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ email: loginEmail.trim(), name: data.user?.name || '' }),
            });
          } catch {} finally { setIsEmailSending(false); }
          return;
        }

        if (!res.ok) {
          setLoginError(data.error || '로그인에 실패했습니다.');
          return;
        }

        // Login success
        const u = data.user;
        setUser({
          id: u.id,
          name: u.name,
          email: u.email,
          avatar: u.avatar || '🌸',
          pencils: u.pencils || 0,
          isAdmin: u.isAdmin || false,
          isEmailVerified: true,
          referralCode: u.referralCode || '',
          collectedFlowers: u.collectedFlowers || [],
          achievements: [],
          shareCount: 0,
          totalLikes: 0,
          totalViews: 0,
          usedReferralCodes: [],
          createdAt: u.createdAt,
        });
        setAuthorName(u.name);
        setShowLogin(false);
      } catch (e: any) {
        console.error('Login fetch error:', e);
        setLoginError('서버 연결에 실패했습니다. 네트워크 상태를 확인해주세요.');
      }
    } else if (loginMode === 'register') {
      if (!loginName.trim() || !loginEmail.trim() || !loginPassword.trim()) {
        setLoginError('모든 필드를 채워주세요.');
        return;
      }
      if (!agreedToTerms || !agreedToPrivacy || !agreedToGuidelines) {
        setLoginError('모든 약관에 동의해주세요.');
        return;
      }
      if (loginPassword !== loginPasswordConfirm) {
        setLoginError('비밀번호가 일치하지 않습니다.');
        return;
      }

      // Server-based registration
      setIsEmailSending(true);
      try {
        const res = await fetch('/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: loginName.trim(),
            email: loginEmail.trim(),
            password: loginPassword,
          }),
        });
        const data = await res.json();
        if (!res.ok) {
          setLoginError(data.error || '가입에 실패했습니다.');
          return;
        }
        // Registration success — show verification modal
        if (data.user) {
          setUser({ ...data.user, usedReferralCodes: [], achievements: [], shareCount: 0, totalLikes: 0, totalViews: 0 });
        }
        setVerificationEmail(loginEmail.trim());
        setShowLogin(false);
        setShowVerification(true);
        // If register didn't send email, try send-verification as fallback
        if (!data.sent) {
          try {
            await fetch('/api/auth/send-verification', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ email: loginEmail.trim(), name: loginName.trim() }),
            });
          } catch {}
        }
      } catch (e: any) {
        console.error('Registration fetch error:', e);
        setLoginError('서버 연결에 실패했습니다. 네트워크 상태를 확인해주세요.');
      } finally {
        setIsEmailSending(false);
      }
    } else if (loginMode !== 'forgot') {
      // OAuth simulation
      const name = loginName || `${loginMode === 'kakao' ? '카카오' : '네이버'} 사용자`;
      const referralCode = name.slice(0, 2).toUpperCase() + Math.random().toString(36).slice(2, 6).toUpperCase();
      setUser({
        id: `user-${Date.now()}`,
        name,
        email: `${loginMode}@sigeuldam.kr`,
        avatar: '🌸',
        collectedFlowers: [],
        pencils: 0,
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

  const handleVerifyEmail = async () => {
    const targetEmail = verificationEmail || user?.email;
    if (!targetEmail) return;
    setVerifyError('');
    setIsEmailSending(true);
    try {
      const res = await fetch('/api/auth/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: targetEmail, code: verificationCode }),
      });
      const data = await res.json();
      if (res.ok && data.verified) {
        // Server verified — update local user state
        if (data.user) {
          setUser({
            ...data.user,
            usedReferralCodes: [],
            achievements: [],
            shareCount: 0,
            totalLikes: 0,
            totalViews: 0,
          });
          setAuthorName(data.user.name);
        } else if (user) {
          setUser({ ...user, isEmailVerified: true });
        }
        setShowVerification(false);
        setVerifyError('');
        setVerificationCode('');
        setSuccessMsg('이메일 인증이 완료되었습니다! 🎉');
        setTimeout(() => setSuccessMsg(''), 4000);
      } else {
        setVerifyError(data.error || '인증 코드가 올바르지 않습니다.');
      }
    } catch (e) {
      setVerifyError('서버 오류가 발생했습니다. 다시 시도해주세요.');
    } finally {
      setIsEmailSending(false);
    }
  };

  const handleResendCode = async () => {
    const targetEmail = verificationEmail || user?.email;
    if (!targetEmail) return;
    setIsEmailSending(true);
    setVerifyError('');
    try {
      const res = await fetch('/api/auth/send-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: targetEmail, name: user?.name || '' }),
      });
      const data = await res.json();
      if (res.ok && data.sent) {
        setVerifyError('');
        setSuccessMsg('새 인증 코드가 이메일로 전송되었어요! 📬');
        setTimeout(() => setSuccessMsg(''), 3000);
      } else {
        setVerifyError(data.error || '이메일 전송에 실패했습니다.');
      }
    } catch {
      setVerifyError('이메일 전송에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setIsEmailSending(false);
    }
  };

  const handleApplyReferral = async () => {
    if (!user?.id || !referralInput.trim()) return;
    try {
      const res = await fetch('/api/user/referral', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, code: referralInput.trim() }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setReferralMsg('✅ 추천 코드가 적용되었어요! 서로 ✏️ 연필 1자루씩 받았습니다.');
        setReferralInput('');
        // Update local pencil count
        setUser({ ...user, pencils: data.pencils, usedReferralCodes: [...(user.usedReferralCodes || []), referralInput.trim().toUpperCase()] });
        setTimeout(() => setReferralMsg(''), 4000);
      } else {
        setReferralMsg(`❌ ${data.error}`);
        setTimeout(() => setReferralMsg(''), 3000);
      }
    } catch {
      setReferralMsg('❌ 서버 연결에 실패했습니다.');
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
          <div className="bg-red-50 rounded-xl p-4 border border-red-200">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-lg">🚫</span>
              <p className="text-sm font-bold text-red-600">이메일 인증이 필요합니다</p>
            </div>
            <p className="text-xs text-red-500 mb-3">이메일 인증을 완료해야 서비스를 이용할 수 있어요.</p>
            <button onClick={() => { setVerificationEmail(user.email || ''); setShowVerification(true); handleResendCode(); }}
              className="px-4 py-2 bg-red-500 text-white text-xs rounded-lg font-medium hover:bg-red-600 transition-colors">
              인증하기
            </button>
          </div>
        </div>
      )}

      {/* Tab nav */}
      {isLoggedIn && (
        <div className="px-6 mb-4 overflow-x-auto">
          <div className="flex gap-1 pb-2">
            {(['profile', 'activity', 'settings', 'notifications', 'stats', 'achievements', ...(user?.isAdmin ? ['admin'] as const : [])] as const).map(t => (
              <button key={t} onClick={() => setTab(t as any)}
                className={`flex-shrink-0 px-4 py-2 rounded-full text-xs font-medium transition-all ${tab === t ? 'bg-ink-700 text-white' : 'bg-cream-50 text-ink-400'}`}>
                {t === 'profile' ? '프로필' : t === 'activity' ? '활동 로그' : t === 'settings' ? '계정 설정' : t === 'notifications' ? `알림${unreadNotifs > 0 ? ` (${unreadNotifs})` : ''}` : t === 'stats' ? '통계' : t === 'achievements' ? '업적' : '관리자'}
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
                        const shareText = `🌸 시글담 - 꽃말로 쓰는 나만의 시\n\n질문에 답하다 보면 어느새 시가 완성돼요.\nAI가 다듬어주기도 하고, 쓴 시를 친구에게 공유할 수도 있어요!\n\n🎁 추천 코드: ${user.referralCode}\n위 코드를 입력하면 서로 연필 1자루씩 받아요 ✏️\n\n👉 https://sigeuldam.kr`;
                        navigator.clipboard.writeText(shareText);
                        setSuccessMsg('추천 메시지가 복사되었어요! 친구에게 붙여넣기 하세요 📋');
                        setTimeout(() => setSuccessMsg(''), 3000);
                      }}
                      className="px-3 py-1.5 bg-purple-100 text-purple-600 rounded-lg text-xs font-medium hover:bg-purple-200">
                      공유 복사
                    </button>
                  </div>
                  <p className="text-[10px] text-ink-300 mt-1">친구가 이 코드를 입력하면 서로 연필 1자루씩!</p>
                  <div className="mt-2 bg-purple-50 rounded-lg p-2.5 text-[10px] text-ink-400 leading-relaxed">
                    <p className="font-medium text-ink-500 mb-0.5">복사되는 내용 미리보기:</p>
                    <p>🌸 시글담 - 꽃말로 쓰는 나만의 시</p>
                    <p>🎁 추천 코드: <span className="font-bold text-purple-600">{user.referralCode}</span></p>
                    <p>👉 sigeuldam.kr</p>
                  </div>
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
                    <div key={poem.id} className="bg-cream-50 rounded-xl p-4 hover:bg-cream-100 transition-colors">
                      <Link href={`/poem/${poem.id}`} className="block">
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
                      <div className="flex justify-end mt-2 pt-2 border-t border-cream-200">
                        <button
                          onClick={async () => {
                            if (confirm(`"${poem.title || '무제'}" 시를 삭제하시겠어요? 삭제하면 되돌릴 수 없어요.`)) {
                              deletePoem(poem.id);
                              setDbPoems(prev => prev.filter(p => p.id !== poem.id));
                              try { await fetch(`/api/poems/${poem.id}`, { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userId: user?.id }) }); } catch {}
                              setSuccessMsg('시가 삭제되었어요.');
                              setTimeout(() => setSuccessMsg(''), 3000);
                            }
                          }}
                          className="text-xs text-red-400 hover:text-red-600 bg-red-50 hover:bg-red-100 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1"
                        >
                          🗑️ 삭제
                        </button>
                      </div>
                    </div>
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
            {mergedNotifications.length > 0 && (
              <button onClick={() => {
                markAllNotificationsRead();
                if (user?.id) fetch('/api/notifications', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userId: user.id, markAll: true }) }).catch(() => {});
                setDbNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
              }} className="text-xs text-ink-300">모두 읽음</button>
            )}
          </div>
          {mergedNotifications.length === 0 ? (
            <div className="bg-cream-50 rounded-card p-8 text-center"><p className="text-ink-300">아직 알림이 없어요</p></div>
          ) : (
            <div className="space-y-2">
              {mergedNotifications.slice(0, 50).map(n => (
                <div key={n.id} onClick={() => {
                  markNotificationRead(n.id);
                  if (user?.id) fetch('/api/notifications', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userId: user.id, notificationId: n.id }) }).catch(() => {});
                  setDbNotifications(prev => prev.map(nn => nn.id === n.id ? { ...nn, isRead: true } : nn));
                }}
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

      {/* ===== ACTIVITY LOG TAB ===== */}
      {tab === 'activity' && (
        <ActivityLogTab
          activityLogs={activityLogs}
          logFilter={logFilter}
          setLogFilter={setLogFilter}
        />
      )}

      {/* ===== SETTINGS TAB ===== */}
      {tab === 'settings' && (
        <SettingsTab
          user={user}
          currentPw={currentPw}
          setCurrentPw={setCurrentPw}
          newPw={newPw}
          setNewPw={setNewPw}
          newPwConfirm={newPwConfirm}
          setNewPwConfirm={setNewPwConfirm}
          pwMsg={pwMsg}
          setPwMsg={setPwMsg}
          pwSuccess={pwSuccess}
          setPwSuccess={setPwSuccess}
          changePassword={changePassword}
        />
      )}

      {/* ===== ADMIN TAB ===== */}
      {tab === 'admin' && user?.isAdmin && <AdminPanel />}

      {/* Login Modal */}
      {showLogin && (
        <div className="fixed inset-0 z-50 modal-overlay flex items-center justify-center" onClick={() => setShowLogin(false)}>
          <div className="bg-white rounded-card w-[90%] max-w-[380px] p-6 max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <h3 className="font-bold text-ink-700 text-xl text-center mb-6">
              {loginMode === 'register' ? '회원가입' : loginMode === 'forgot' ? '비밀번호 찾기' : '로그인'}
            </h3>

            {loginMode !== 'forgot' && (
            <div className="flex gap-2 mb-4">
              <button onClick={() => { setLoginMode('login'); setLoginError(''); }}
                className={`flex-1 py-2 rounded-xl text-sm font-medium ${loginMode === 'login' ? 'bg-ink-700 text-white' : 'bg-cream-50 text-ink-400'}`}>로그인</button>
              <button onClick={() => { setLoginMode('register'); setLoginError(''); }}
                className={`flex-1 py-2 rounded-xl text-sm font-medium ${loginMode === 'register' ? 'bg-ink-700 text-white' : 'bg-cream-50 text-ink-400'}`}>회원가입</button>
            </div>
            )}

            {/* === Forgot Password Flow === */}
            {loginMode === 'forgot' && (
              <div className="space-y-3 mb-4">
                {resetStep === 'email' && (
                  <>
                    <p className="text-sm text-ink-400 text-center mb-2">가입한 이메일을 입력하면<br/>인증 코드를 보내드려요</p>
                    <input value={resetEmail} onChange={(e) => setResetEmail(e.target.value)} placeholder="가입한 이메일" type="email"
                      className="w-full bg-cream-50 rounded-xl px-4 py-3 text-ink-600 placeholder:text-ink-200 focus:outline-none focus:ring-2 focus:ring-warm-300" />
                    {resetError && <p className="text-red-500 text-xs">{resetError}</p>}
                    <button disabled={!resetEmail.trim() || resetLoading}
                      onClick={async () => {
                        setResetError('');
                        setResetLoading(true);
                        try {
                          const res = await fetch('/api/auth/reset-password', {
                            method: 'POST', headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ email: resetEmail.trim() }),
                          });
                          const data = await res.json();
                          if (res.ok && data.sent) { setResetStep('code'); }
                          else { setResetError(data.error || '이메일 전송 실패'); }
                        } catch { setResetError('서버 오류'); } finally { setResetLoading(false); }
                      }}
                      className={`w-full py-3.5 rounded-xl font-medium ${resetEmail.trim() && !resetLoading ? 'bg-ink-700 text-white' : 'bg-ink-100 text-ink-300 cursor-not-allowed'}`}>
                      {resetLoading ? '전송 중...' : '인증 코드 받기'}
                    </button>
                  </>
                )}
                {resetStep === 'code' && (
                  <>
                    <p className="text-sm text-ink-400 text-center mb-2"><span className="font-medium text-ink-600">{resetEmail}</span><br/>으로 전송된 코드를 입력해주세요</p>
                    <input value={resetCode} onChange={(e) => setResetCode(e.target.value.replace(/\D/g, '').slice(0, 6))} placeholder="인증 코드 6자리"
                      className="w-full bg-cream-50 rounded-xl px-4 py-4 text-center text-xl font-bold tracking-[0.5em] text-ink-600 placeholder:text-ink-200 placeholder:tracking-normal placeholder:text-base placeholder:font-normal focus:outline-none focus:ring-2 focus:ring-warm-300" maxLength={6} />
                    {resetError && <p className="text-red-500 text-xs text-center">{resetError}</p>}
                    <button disabled={resetCode.length !== 6 || resetLoading}
                      onClick={async () => {
                        setResetError('');
                        setResetLoading(true);
                        try {
                          const res = await fetch('/api/auth/verify-reset', {
                            method: 'POST', headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ email: resetEmail.trim(), code: resetCode }),
                          });
                          const data = await res.json();
                          if (res.ok && data.verified) { setResetStep('newpw'); }
                          else { setResetError(data.error || '인증 실패'); }
                        } catch { setResetError('서버 오류'); } finally { setResetLoading(false); }
                      }}
                      className={`w-full py-3.5 rounded-xl font-medium ${resetCode.length === 6 && !resetLoading ? 'bg-ink-700 text-white' : 'bg-ink-100 text-ink-300 cursor-not-allowed'}`}>
                      {resetLoading ? '확인 중...' : '확인'}
                    </button>
                  </>
                )}
                {resetStep === 'newpw' && (
                  <>
                    <p className="text-sm text-ink-400 text-center mb-2">새 비밀번호를 설정해주세요</p>
                    <input value={resetNewPw} onChange={(e) => setResetNewPw(e.target.value)} placeholder="새 비밀번호 (영문+숫자 8자 이상)" type="password"
                      className="w-full bg-cream-50 rounded-xl px-4 py-3 text-ink-600 placeholder:text-ink-200 focus:outline-none focus:ring-2 focus:ring-warm-300" />
                    <input value={resetNewPwConfirm} onChange={(e) => setResetNewPwConfirm(e.target.value)} placeholder="새 비밀번호 확인" type="password"
                      className="w-full bg-cream-50 rounded-xl px-4 py-3 text-ink-600 placeholder:text-ink-200 focus:outline-none focus:ring-2 focus:ring-warm-300" />
                    <div className="bg-cream-50 rounded-xl p-3 text-xs text-ink-400 space-y-1">
                      <p className={resetNewPw.length >= 8 ? 'text-sage-500' : ''}>{resetNewPw.length >= 8 ? '✅' : '○'} 8자 이상</p>
                      <p className={/[A-Za-z]/.test(resetNewPw) && /[0-9]/.test(resetNewPw) ? 'text-sage-500' : ''}>{/[A-Za-z]/.test(resetNewPw) && /[0-9]/.test(resetNewPw) ? '✅' : '○'} 영문 + 숫자 포함</p>
                      <p className={resetNewPw === resetNewPwConfirm && resetNewPwConfirm.length > 0 ? 'text-sage-500' : ''}>{resetNewPw === resetNewPwConfirm && resetNewPwConfirm.length > 0 ? '✅' : '○'} 비밀번호 일치</p>
                    </div>
                    {resetError && <p className="text-red-500 text-xs text-center">{resetError}</p>}
                    <button disabled={!resetNewPw || resetNewPw !== resetNewPwConfirm || resetNewPw.length < 8 || resetLoading}
                      onClick={async () => {
                        setResetError('');
                        setResetLoading(true);
                        try {
                          const res = await fetch('/api/auth/verify-reset', {
                            method: 'POST', headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ email: resetEmail.trim(), code: resetCode, newPassword: resetNewPw }),
                          });
                          const data = await res.json();
                          if (res.ok && data.success) {
                            setShowLogin(false);
                            setLoginMode('login');
                            setResetStep('email');
                            setResetEmail(''); setResetCode(''); setResetNewPw(''); setResetNewPwConfirm('');
                            setSuccessMsg('비밀번호가 재설정되었어요! 새 비밀번호로 로그인하세요.');
                            setTimeout(() => setSuccessMsg(''), 4000);
                          } else { setResetError(data.error || '비밀번호 변경 실패'); }
                        } catch { setResetError('서버 오류'); } finally { setResetLoading(false); }
                      }}
                      className={`w-full py-3.5 rounded-xl font-medium ${resetNewPw && resetNewPw === resetNewPwConfirm && resetNewPw.length >= 8 ? 'bg-ink-700 text-white' : 'bg-ink-100 text-ink-300 cursor-not-allowed'}`}>
                      비밀번호 변경
                    </button>
                  </>
                )}
                <button onClick={() => { setLoginMode('login'); setResetStep('email'); setResetError(''); }} className="w-full text-sm text-ink-400 mt-2">
                  ← 로그인으로 돌아가기
                </button>
              </div>
            )}

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
                      <label className="flex items-start gap-2 cursor-pointer">
                        <input type="checkbox" checked={agreedToGuidelines} onChange={(e) => setAgreedToGuidelines(e.target.checked)}
                          className="mt-1 w-4 h-4 rounded accent-ink-700" />
                        <span className="text-xs text-ink-400">
                          <button type="button" onClick={(e) => { e.preventDefault(); setShowGuidelinesModal(true); }} className="text-ink-600 underline font-medium">커뮤니티 가이드라인</button>에 동의합니다
                          {agreedToGuidelines && <span className="text-sage-500 ml-1">✓</span>}
                        </span>
                      </label>
                    </div>
                  </>
                )}
                {loginError && <p className="text-red-500 text-xs">{loginError}</p>}
                <button onClick={handleLogin} className="w-full py-3.5 rounded-xl bg-ink-700 text-white font-medium">
                  {loginMode === 'register' ? '가입하기' : '로그인'}
                </button>
                {loginMode === 'login' && (
                  <button onClick={() => { setLoginMode('forgot'); setResetStep('email'); setResetError(''); setLoginError(''); }}
                    className="w-full text-xs text-ink-400 mt-1 hover:text-ink-600">
                    비밀번호를 잊으셨나요?
                  </button>
                )}
                {loginMode === 'register' && (
                  <p className="text-[10px] text-ink-300 text-center leading-relaxed">
                    🔒 비밀번호는 암호화되어 안전하게 저장됩니다.<br/>
                    🎁 추천인 코드를 입력하면 서로 연필 1자루씩!
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

      {/* Community Guidelines Modal */}
      {showGuidelinesModal && (
        <div className="fixed inset-0 z-[60] modal-overlay flex items-center justify-center" onClick={() => setShowGuidelinesModal(false)}>
          <div className="bg-white rounded-card w-[90%] max-w-[400px] max-h-[80vh] flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="p-5 border-b border-cream-200 flex items-center justify-between">
              <h3 className="font-bold text-ink-700 text-lg">🛡️ 커뮤니티 가이드라인</h3>
              <button onClick={() => setShowGuidelinesModal(false)} className="text-ink-300 hover:text-ink-500">✕</button>
            </div>
            <div className="flex-1 overflow-y-auto p-5">
              <pre className="text-xs text-ink-500 whitespace-pre-wrap leading-relaxed font-sans">{COMMUNITY_GUIDELINES}</pre>
            </div>
            <div className="p-4 border-t border-cream-200">
              <button onClick={() => { setAgreedToGuidelines(true); setShowGuidelinesModal(false); }}
                className="w-full py-3 rounded-xl bg-ink-700 text-white font-medium text-sm">
                동의하고 닫기
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Email Verification Modal */}
      {showVerification && (
        <div className="fixed inset-0 z-50 modal-overlay flex items-center justify-center" onClick={() => {}}>
          <div className="bg-white rounded-card w-[90%] max-w-[380px] p-6" onClick={e => e.stopPropagation()}>
            <div className="text-center mb-6">
              <div className="text-4xl mb-3">📧</div>
              <h3 className="font-bold text-ink-700 text-xl">이메일 인증</h3>
              <p className="text-sm text-ink-400 mt-2">
                <span className="font-medium text-ink-600">{verificationEmail || user?.email}</span>
                <br/>으로 전송된 인증 코드 6자리를 입력해주세요
              </p>
              {isEmailSending && (
                <p className="text-xs text-warm-500 mt-2 animate-pulse">📨 이메일 전송 중...</p>
              )}
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
              disabled={verificationCode.length !== 6 || isEmailSending}
              className={`w-full py-3.5 rounded-xl font-medium ${
                verificationCode.length === 6 && !isEmailSending
                  ? 'bg-ink-700 text-white'
                  : 'bg-ink-100 text-ink-300 cursor-not-allowed'
              }`}
            >
              {isEmailSending ? '확인 중...' : '인증 완료'}
            </button>

            <p className="text-xs text-ink-300 text-center mt-4 leading-relaxed">
              인증을 완료해야 로그인할 수 있어요.<br/>
              이메일이 오지 않으면 스팸함을 확인해주세요.
            </p>

            <div className="flex justify-between mt-4">
              <button onClick={handleResendCode} disabled={isEmailSending}
                className={`text-xs underline ${isEmailSending ? 'text-ink-200' : 'text-ink-400 hover:text-ink-600'}`}>
                코드 재전송
              </button>
              <button onClick={() => { setShowVerification(false); setVerificationCode(''); setVerifyError(''); }} className="text-xs text-ink-300">
                닫기
              </button>
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
              <p>🎁 추천인 코드: 서로 연필 1자루씩</p>
              <p>📺 광고 보기: 무료로 연필 1자루</p>
            </div>

            <button onClick={() => setShowPurchaseModal(false)} className="w-full mt-4 text-sm text-ink-300">닫기</button>
          </div>
        </div>
      )}

      {/* Footer */}
      <Footer />

      <BottomNav active="profile" />
    </div>
  );
}

/* ===== ACTIVITY LOG TAB ===== */
function ActivityLogTab({ activityLogs, logFilter, setLogFilter }: {
  activityLogs: ActivityLog[];
  logFilter: 'all' | ActivityType;
  setLogFilter: (f: 'all' | ActivityType) => void;
}) {
  const filteredLogs = logFilter === 'all' ? activityLogs : activityLogs.filter(l => l.type === logFilter);

  const typeEmoji: Record<ActivityType, string> = {
    ai_usage: '✨',
    poem_upload: '📝',
    pencil_purchase: '💰',
    pencil_ad: '📺',
    pencil_referral: '🎁',
    password_change: '🔒',
    login: '🔑',
    register: '🌱',
  };

  const typeLabel: Record<ActivityType, string> = {
    ai_usage: 'AI 사용',
    poem_upload: '시 업로드',
    pencil_purchase: '연필 구매',
    pencil_ad: '광고 시청',
    pencil_referral: '추천 코드',
    password_change: '비밀번호 변경',
    login: '로그인',
    register: '회원가입',
  };

  const filterOptions: { value: 'all' | ActivityType; label: string }[] = [
    { value: 'all', label: '전체' },
    { value: 'ai_usage', label: 'AI' },
    { value: 'poem_upload', label: '업로드' },
    { value: 'pencil_purchase', label: '구매' },
    { value: 'pencil_ad', label: '광고' },
  ];

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMin = Math.floor(diffMs / 60000);
    if (diffMin < 1) return '방금 전';
    if (diffMin < 60) return `${diffMin}분 전`;
    const diffHr = Math.floor(diffMin / 60);
    if (diffHr < 24) return `${diffHr}시간 전`;
    return d.toLocaleDateString('ko-KR', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="px-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-ink-600">📋 활동 로그</h3>
        <span className="text-xs text-ink-300">{activityLogs.length}건</span>
      </div>

      {/* Filters */}
      <div className="flex gap-1.5 mb-4 overflow-x-auto pb-1">
        {filterOptions.map(opt => (
          <button key={opt.value} onClick={() => setLogFilter(opt.value)}
            className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
              logFilter === opt.value ? 'bg-ink-700 text-white' : 'bg-cream-50 text-ink-400'
            }`}>
            {opt.label}
          </button>
        ))}
      </div>

      {filteredLogs.length === 0 ? (
        <div className="bg-cream-50 rounded-card p-8 text-center">
          <p className="text-ink-300">아직 활동 기록이 없어요</p>
          <p className="text-xs text-ink-200 mt-1">AI 사용, 시 업로드 등의 활동이 여기에 기록됩니다</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filteredLogs.map(log => (
            <div key={log.id} className="bg-cream-50 rounded-xl p-3.5 flex items-start gap-3">
              <div className="w-9 h-9 rounded-full bg-white flex items-center justify-center text-lg flex-shrink-0">
                {typeEmoji[log.type]}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-cream-200 text-ink-400">{typeLabel[log.type]}</span>
                  <span className="text-[10px] text-ink-200">{formatDate(log.createdAt)}</span>
                </div>
                <p className="text-sm text-ink-600 mt-0.5">{log.message}</p>
                {log.details && <p className="text-xs text-ink-300 mt-0.5">{log.details}</p>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ===== SETTINGS TAB ===== */
function SettingsTab({ user, currentPw, setCurrentPw, newPw, setNewPw, newPwConfirm, setNewPwConfirm, pwMsg, setPwMsg, pwSuccess, setPwSuccess, changePassword }: {
  user: any;
  currentPw: string; setCurrentPw: (s: string) => void;
  newPw: string; setNewPw: (s: string) => void;
  newPwConfirm: string; setNewPwConfirm: (s: string) => void;
  pwMsg: string; setPwMsg: (s: string) => void;
  pwSuccess: boolean; setPwSuccess: (b: boolean) => void;
  changePassword: (email: string, currentPw: string, newPw: string) => { success: boolean; error: string };
}) {
  const [pwLoading, setPwLoading] = useState(false);

  const handleChangePassword = async () => {
    setPwMsg('');
    setPwSuccess(false);

    if (!currentPw || !newPw || !newPwConfirm) {
      setPwMsg('모든 필드를 입력해주세요.');
      return;
    }
    if (newPw !== newPwConfirm) {
      setPwMsg('새 비밀번호가 일치하지 않습니다.');
      return;
    }
    if (!user?.id) {
      setPwMsg('로그인이 필요합니다.');
      return;
    }

    setPwLoading(true);
    try {
      const res = await fetch('/api/user/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, currentPassword: currentPw, newPassword: newPw }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setPwSuccess(true);
        setPwMsg('비밀번호가 변경되었습니다! 🎉');
        setCurrentPw('');
        setNewPw('');
        setNewPwConfirm('');
        setTimeout(() => { setPwMsg(''); setPwSuccess(false); }, 4000);
      } else {
        setPwMsg(data.error || '비밀번호 변경에 실패했습니다.');
      }
    } catch {
      setPwMsg('서버 연결에 실패했습니다. 네트워크 상태를 확인해주세요.');
    } finally {
      setPwLoading(false);
    }
  };

  return (
    <div className="px-6">
      <h3 className="font-bold text-ink-600 mb-4">⚙️ 계정 설정</h3>

      {/* Account Info */}
      <div className="bg-cream-50 rounded-card p-5 mb-6">
        <h4 className="font-medium text-ink-600 text-sm mb-3">계정 정보</h4>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-ink-400">닉네임</span>
            <span className="text-sm text-ink-600 font-medium">{user?.name || '-'}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs text-ink-400">이메일</span>
            <span className="text-sm text-ink-600">{user?.email || '-'}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs text-ink-400">가입일</span>
            <span className="text-sm text-ink-600">{user?.createdAt ? new Date(user.createdAt).toLocaleDateString('ko-KR') : '-'}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs text-ink-400">이메일 인증</span>
            <span className={`text-sm font-medium ${user?.isEmailVerified ? 'text-sage-500' : 'text-warm-500'}`}>
              {user?.isEmailVerified ? '인증 완료 ✅' : '미인증 ⚠️'}
            </span>
          </div>
        </div>
      </div>

      {/* Password Change */}
      {user?.email && !user.email.includes('@sigeuldam.kr') && (
        <div className="bg-cream-50 rounded-card p-5 mb-6">
          <h4 className="font-medium text-ink-600 text-sm mb-3">🔒 비밀번호 변경</h4>
          <div className="space-y-3">
            <div>
              <label className="text-xs text-ink-400 mb-1 block">현재 비밀번호</label>
              <input type="password" value={currentPw} onChange={(e) => setCurrentPw(e.target.value)}
                placeholder="현재 비밀번호"
                className="w-full bg-white rounded-xl px-4 py-2.5 text-ink-600 placeholder:text-ink-200 focus:outline-none focus:ring-2 focus:ring-warm-300 text-sm" />
            </div>
            <div>
              <label className="text-xs text-ink-400 mb-1 block">새 비밀번호</label>
              <input type="password" value={newPw} onChange={(e) => setNewPw(e.target.value)}
                placeholder="영문+숫자 8자 이상"
                className="w-full bg-white rounded-xl px-4 py-2.5 text-ink-600 placeholder:text-ink-200 focus:outline-none focus:ring-2 focus:ring-warm-300 text-sm" />
            </div>
            <div>
              <label className="text-xs text-ink-400 mb-1 block">새 비밀번호 확인</label>
              <input type="password" value={newPwConfirm} onChange={(e) => setNewPwConfirm(e.target.value)}
                placeholder="새 비밀번호를 다시 입력"
                className="w-full bg-white rounded-xl px-4 py-2.5 text-ink-600 placeholder:text-ink-200 focus:outline-none focus:ring-2 focus:ring-warm-300 text-sm" />
            </div>

            {/* Validation indicators */}
            <div className="bg-white rounded-xl p-3 text-xs text-ink-400 space-y-1">
              <p className={newPw.length >= 8 ? 'text-sage-500' : ''}>
                {newPw.length >= 8 ? '✅' : '○'} 8자 이상
              </p>
              <p className={/[A-Za-z]/.test(newPw) && /[0-9]/.test(newPw) ? 'text-sage-500' : ''}>
                {/[A-Za-z]/.test(newPw) && /[0-9]/.test(newPw) ? '✅' : '○'} 영문 + 숫자 포함
              </p>
              <p className={newPw === newPwConfirm && newPwConfirm.length > 0 ? 'text-sage-500' : ''}>
                {newPw === newPwConfirm && newPwConfirm.length > 0 ? '✅' : '○'} 비밀번호 일치
              </p>
            </div>

            {pwMsg && (
              <p className={`text-xs text-center ${pwSuccess ? 'text-sage-500' : 'text-red-500'}`}>{pwMsg}</p>
            )}

            <button onClick={handleChangePassword}
              disabled={!currentPw || !newPw || !newPwConfirm || newPw !== newPwConfirm || pwLoading}
              className={`w-full py-3 rounded-xl font-medium text-sm ${
                currentPw && newPw && newPwConfirm && newPw === newPwConfirm && !pwLoading
                  ? 'bg-ink-700 text-white hover:bg-ink-600'
                  : 'bg-ink-100 text-ink-300 cursor-not-allowed'
              }`}>
              {pwLoading ? '변경 중...' : '비밀번호 변경'}
            </button>
          </div>
        </div>
      )}

      {/* Other settings info */}
      <div className="bg-cream-50 rounded-card p-5">
        <h4 className="font-medium text-ink-600 text-sm mb-3">기타</h4>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs text-ink-400">추천 코드</span>
            <span className="text-sm text-purple-600 font-bold tracking-wider">{user?.referralCode || '-'}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs text-ink-400">보유 연필</span>
            <span className="text-sm text-amber-600 font-bold">✏️ {user?.pencils || 0}자루</span>
          </div>
        </div>
      </div>
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
