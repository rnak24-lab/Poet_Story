'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { flowers } from '@/data/flowers';
import { BottomNav } from '@/components/BottomNav';
import { Footer } from '@/components/Footer';
import Link from 'next/link';

// ===== Onboarding slides data =====
const onboardingSlides = [
  {
    emoji: '🌸',
    bg: 'from-pink-50 to-purple-50',
    title: '꽃말로 시작하는\n나만의 시',
    description: '매일 새로운 꽃말이 글감이 되어줘요.\n질문에 답하다 보면 어느새 시가 완성돼요.',
    highlight: '누구나 시인이 될 수 있어요',
    decorEmojis: ['🌷', '🌹', '🌻', '💐'],
  },
  {
    emoji: '✏️',
    bg: 'from-amber-50 to-orange-50',
    title: '질문에 답하면\n시가 완성돼요',
    description: '어렵게 생각하지 마세요.\n당신의 이야기를 적으면 그게 곧 시가 됩니다.',
    highlight: 'AI가 다듬어주기도 해요',
    decorEmojis: ['📝', '💭', '✨', '📖'],
  },
  {
    emoji: '🎨',
    bg: 'from-blue-50 to-green-50',
    title: '쓰고, 꾸미고\n함께 나눠요',
    description: '예쁜 배경에 시를 담아 공유하고\n다른 사람의 시도 감상해보세요.',
    highlight: '꽃 도감도 모아보는 재미!',
    decorEmojis: ['🌼', '❤️', '📤', '🏆'],
  },
];

export default function Home() {
  const { isLoggedIn, user, poems, hasCompletedOnboarding, completeOnboarding, setUser, setAuthorName } = useAppStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);

    // Handle OAuth callback (kakao/naver)
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const oauth = params.get('oauth');
      const userParam = params.get('user');
      if (oauth && userParam) {
        try {
          const u = JSON.parse(decodeURIComponent(userParam));
          setUser({
            id: u.id, name: u.name, email: u.email,
            avatar: u.avatar || '🌸', pencils: u.pencils || 0,
            isAdmin: u.isAdmin || false, isEmailVerified: true,
            referralCode: u.referralCode || '',
            collectedFlowers: u.collectedFlowers || [],
            achievements: [], shareCount: 0, totalLikes: 0, totalViews: 0,
            usedReferralCodes: [], createdAt: u.createdAt,
          });
          setAuthorName(u.name);
          completeOnboarding();
          // Clean URL
          window.history.replaceState({}, '', '/');
        } catch (e) { console.error('OAuth parse error:', e); }
      }
    }
  }, []);

  if (!mounted) return <LoadingScreen />;

  // First-time user: show onboarding → login
  if (!hasCompletedOnboarding) {
    return <OnboardingFlow />;
  }

  return <HomeContent />;
}

// ===== ONBOARDING FLOW (3 slides → login) =====
function OnboardingFlow() {
  const { completeOnboarding, isLoggedIn } = useAppStore();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [showLogin, setShowLogin] = useState(false);
  const touchStartX = useRef(0);
  const touchEndX = useRef(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const totalSlides = onboardingSlides.length;

  const goNext = useCallback(() => {
    if (currentSlide < totalSlides - 1) {
      setCurrentSlide(prev => prev + 1);
    } else {
      setShowLogin(true);
    }
  }, [currentSlide, totalSlides]);

  const goPrev = useCallback(() => {
    if (showLogin) {
      setShowLogin(false);
    } else if (currentSlide > 0) {
      setCurrentSlide(prev => prev - 1);
    }
  }, [currentSlide, showLogin]);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = () => {
    const diff = touchStartX.current - touchEndX.current;
    if (Math.abs(diff) > 50) {
      if (diff > 0) goNext();
      else goPrev();
    }
  };

  const handleSkip = () => {
    setShowLogin(true);
  };

  // If user logs in during onboarding, auto-complete it
  useEffect(() => {
    if (isLoggedIn) {
      completeOnboarding();
    }
  }, [isLoggedIn, completeOnboarding]);

  if (showLogin) {
    return <OnboardingLoginScreen onBack={() => setShowLogin(false)} onSkip={() => completeOnboarding()} />;
  }

  const slide = onboardingSlides[currentSlide];

  return (
    <div
      ref={containerRef}
      className="min-h-screen flex flex-col relative overflow-hidden select-none"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Background gradient */}
      <div className={`absolute inset-0 bg-gradient-to-b ${slide.bg} transition-all duration-500`} />

      {/* Skip button */}
      <div className="relative z-10 px-6 pt-6 flex justify-end">
        <button onClick={handleSkip} className="text-sm text-ink-300 hover:text-ink-500 transition-colors py-1 px-2">
          건너뛰기
        </button>
      </div>

      {/* Slide content */}
      <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-8">
        {/* Floating decoration emojis */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {slide.decorEmojis.map((emoji, i) => (
            <span
              key={`${currentSlide}-${i}`}
              className="absolute text-2xl opacity-20 gentle-float"
              style={{
                left: `${15 + i * 22}%`,
                top: `${10 + (i % 2) * 60}%`,
                animationDelay: `${i * 0.5}s`,
              }}
            >
              {emoji}
            </span>
          ))}
        </div>

        {/* Main emoji */}
        <div
          className="w-28 h-28 rounded-full bg-white/60 flex items-center justify-center text-6xl mb-8 shadow-sm gentle-float"
          key={`emoji-${currentSlide}`}
        >
          {slide.emoji}
        </div>

        {/* Title */}
        <h1
          className="text-3xl font-bold text-ink-700 text-center leading-snug mb-4 whitespace-pre-line"
          key={`title-${currentSlide}`}
        >
          {slide.title}
        </h1>

        {/* Description */}
        <p
          className="text-sm text-ink-400 text-center leading-relaxed mb-4 whitespace-pre-line"
          key={`desc-${currentSlide}`}
        >
          {slide.description}
        </p>

        {/* Highlight badge */}
        <div
          className="bg-white/80 rounded-full px-5 py-2 shadow-sm"
          key={`highlight-${currentSlide}`}
        >
          <p className="text-sm font-medium text-ink-600">{slide.highlight}</p>
        </div>
      </div>

      {/* Bottom controls */}
      <div className="relative z-10 px-8 pb-10">
        {/* Dots indicator */}
        <div className="flex justify-center gap-2 mb-6">
          {onboardingSlides.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrentSlide(i)}
              className={`rounded-full transition-all duration-300 ${
                i === currentSlide
                  ? 'w-8 h-2.5 bg-ink-700'
                  : 'w-2.5 h-2.5 bg-ink-200 hover:bg-ink-300'
              }`}
            />
          ))}
        </div>

        {/* Next / Start button */}
        <button
          onClick={goNext}
          className="w-full py-4 rounded-2xl bg-ink-700 text-white font-medium text-lg hover:bg-ink-600 transition-colors active:scale-[0.98]"
        >
          {currentSlide === totalSlides - 1 ? '시작하기' : '다음'}
        </button>
      </div>
    </div>
  );
}

// ===== LOGIN SCREEN (shown after onboarding) =====
function OnboardingLoginScreen({ onBack, onSkip }: { onBack: () => void; onSkip: () => void }) {
  const { setUser, setAuthorName, registerUser, loginUser, completeOnboarding } = useAppStore();
  const [mode, setMode] = useState<'login' | 'register'>('register');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [agreedToPrivacy, setAgreedToPrivacy] = useState(false);
  const [agreedToGuidelines, setAgreedToGuidelines] = useState(false);
  const [showTerms, setShowTerms] = useState(false);
  const [showPrivacy, setShowPrivacy] = useState(false);
  const [showGuidelines, setShowGuidelines] = useState(false);
  const [showVerification, setShowVerification] = useState(false);
  const [verificationCode, setVerificationCode] = useState('');
  const [verificationEmail, setVerificationEmail] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);

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
② 연필은 추천인 코드 입력(서로 1개씩), 유료 구매 등으로 획득할 수 있습니다.
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

4. 개인정보의 제3자 제공
원칙적으로 제3자에게 제공하지 않습니다.

5. 개인정보 보호 조치
① 비밀번호는 단방향 암호화(해시)하여 저장합니다.
② SSL 통신을 통해 데이터를 보호합니다.

6. 이용자의 권리
① 개인정보 열람, 수정, 삭제를 요청할 수 있습니다.
② 개인정보 처리에 대한 동의를 철회할 수 있습니다.

7. 개인정보의 국외 이전
서비스 제공을 위해 아래와 같이 개인정보 처리를 국외 업체에 위탁합니다.

① Supabase Inc. (미국)
 - 위탁 업무: 데이터베이스 호스팅 및 저장
 - 이전 항목: 이메일, 닉네임, 암호화된 비밀번호, 서비스 이용 기록
 - 연락처: support@supabase.io

② Vercel Inc. (미국)
 - 위탁 업무: 웹 애플리케이션 호스팅
 - 이전 항목: 접속 로그, 서버 요청 기록
 - 연락처: privacy@vercel.com

③ Resend Inc. (미국)
 - 위탁 업무: 이메일 발송 (인증, 알림)
 - 이전 항목: 이메일 주소
 - 연락처: support@resend.com

④ Google LLC (미국)
 - 위탁 업무: AI 시 자동완성 기능 제공
 - 이전 항목: 시 작성 시 입력 텍스트
 - 연락처: privacy@google.com

※ 이전 목적: 서비스 인프라 운영 및 기능 제공
※ 보유 기간: 회원 탈퇴 시 또는 위탁 계약 종료 시 지체 없이 파기

8. 문의
개인정보 관련 문의: support@sigeuldam.kr

시행일: 2026년 3월 4일`;

  const handleVerify = async () => {
    if (verificationCode.length !== 6) { setError('6자리 인증 코드를 입력해주세요.'); return; }
    setIsVerifying(true); setError('');
    try {
      const res = await fetch('/api/auth/verify', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: verificationEmail, code: verificationCode }),
      });
      const data = await res.json();
      if (data.verified && data.user) {
        setUser({ ...data.user, usedReferralCodes: [], achievements: [], shareCount: 0, totalLikes: 0, totalViews: 0 });
        setAuthorName(data.user.name);
        completeOnboarding();
      } else { setError(data.error || '인증에 실패했습니다.'); }
    } catch { setError('서버 연결에 실패했습니다.'); }
    finally { setIsVerifying(false); }
  };

  const handleResendCode = async () => {
    setIsResending(true);
    try {
      await fetch('/api/auth/send-verification', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: verificationEmail, name: name.trim() }),
      });
      setError(''); alert('인증 코드를 재발송했습니다.');
    } catch {} finally { setIsResending(false); }
  };

  const handleSubmit = async () => {
    setError('');
    if (mode === 'login') {
      if (!email.trim() || !password.trim()) { setError('이메일과 비밀번호를 입력해주세요.'); return; }
      setIsLoading(true);
      try {
        const res = await fetch('/api/auth/login', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: email.trim(), password }),
        });
        const data = await res.json();
        if (res.status === 403 && data.needsVerification) {
          if (data.user) setUser({ ...data.user, usedReferralCodes: [], achievements: [], shareCount: 0, totalLikes: 0, totalViews: 0 });
          setVerificationEmail(email.trim());
          setShowVerification(true);
          try { await fetch('/api/auth/send-verification', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: email.trim(), name: data.user?.name || '' }) }); } catch {}
          return;
        }
        if (!res.ok) { setError(data.error || '로그인에 실패했습니다.'); return; }
        const u = data.user;
        setUser({ id: u.id, name: u.name, email: u.email, avatar: u.avatar || '🌸', pencils: u.pencils || 0, isAdmin: u.isAdmin || false, isEmailVerified: true, referralCode: u.referralCode || '', collectedFlowers: u.collectedFlowers || [], achievements: [], shareCount: 0, totalLikes: 0, totalViews: 0, usedReferralCodes: [], createdAt: u.createdAt });
        setAuthorName(u.name);
        completeOnboarding();
      } catch { setError('서버 연결에 실패했습니다.'); }
      finally { setIsLoading(false); }
    } else {
      if (!name.trim() || !email.trim() || !password.trim()) { setError('모든 항목을 채워주세요.'); return; }
      if (!agreedToTerms || !agreedToPrivacy || !agreedToGuidelines) { setError('모든 약관에 동의해주세요.'); return; }
      if (password !== passwordConfirm) { setError('비밀번호가 일치하지 않습니다.'); return; }
      if (password.length < 8) { setError('비밀번호는 8자 이상이어야 합니다.'); return; }
      if (!/[A-Za-z]/.test(password) || !/[0-9]/.test(password)) { setError('비밀번호에 영문과 숫자가 모두 포함되어야 합니다.'); return; }
      setIsLoading(true);
      try {
        const res = await fetch('/api/auth/register', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: name.trim(), email: email.trim(), password }),
        });
        const data = await res.json();
        if (!res.ok) { setError(data.error || '가입에 실패했습니다.'); return; }
        if (data.user) setUser({ ...data.user, usedReferralCodes: [], achievements: [], shareCount: 0, totalLikes: 0, totalViews: 0 });
        setVerificationEmail(email.trim());
        setShowVerification(true);
        if (!data.sent) {
          try { await fetch('/api/auth/send-verification', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: email.trim(), name: name.trim() }) }); } catch {}
        }
      } catch { setError('서버 연결에 실패했습니다.'); }
      finally { setIsLoading(false); }
    }
  };

  const handleOAuth = (provider: 'kakao' | 'naver') => {
    // Redirect to server-side OAuth flow
    window.location.href = `/api/auth/${provider}`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-cream-50 to-white flex flex-col">
      {/* Header */}
      <div className="px-6 pt-6 flex items-center justify-between">
        <button onClick={onBack} className="text-sm text-ink-300 hover:text-ink-500 py-1 px-2">
          ← 뒤로
        </button>
        <button onClick={onSkip} className="text-sm text-ink-300 hover:text-ink-500 py-1 px-2">
          둘러보기
        </button>
      </div>

      {/* Welcome header */}
      <div className="px-8 pt-6 pb-4 text-center">
        <div className="text-4xl mb-3">🌸</div>
        <h1 className="text-2xl font-bold text-ink-700">시글담에 오신 걸 환영해요</h1>
        <p className="text-sm text-ink-400 mt-2">로그인하고 나만의 시를 시작하세요</p>
      </div>

      {/* Mode switch */}
      <div className="px-8 mb-4">
        <div className="flex bg-cream-100 rounded-xl p-1">
          <button
            onClick={() => { setMode('register'); setError(''); }}
            className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all ${mode === 'register' ? 'bg-white text-ink-700 shadow-sm' : 'text-ink-400'}`}
          >
            회원가입
          </button>
          <button
            onClick={() => { setMode('login'); setError(''); }}
            className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all ${mode === 'login' ? 'bg-white text-ink-700 shadow-sm' : 'text-ink-400'}`}
          >
            로그인
          </button>
        </div>
      </div>

      {/* Form */}
      <div className="flex-1 px-8 overflow-y-auto pb-8">
        <div className="space-y-3">
          {mode === 'register' && (
            <div>
              <label className="text-xs text-ink-400 mb-1 block">닉네임</label>
              <input
                value={name} onChange={(e) => setName(e.target.value)}
                placeholder="닉네임 (2자 이상)"
                className="w-full bg-white rounded-xl px-4 py-3 text-ink-600 placeholder:text-ink-200 focus:outline-none focus:ring-2 focus:ring-warm-300 border border-cream-200"
              />
            </div>
          )}
          <div>
            <label className="text-xs text-ink-400 mb-1 block">이메일</label>
            <input
              value={email} onChange={(e) => setEmail(e.target.value)}
              placeholder={mode === 'login' ? '이메일' : 'example@email.com'}
              type="email"
              className="w-full bg-white rounded-xl px-4 py-3 text-ink-600 placeholder:text-ink-200 focus:outline-none focus:ring-2 focus:ring-warm-300 border border-cream-200"
            />
          </div>
          <div>
            <label className="text-xs text-ink-400 mb-1 block">비밀번호</label>
            <input
              value={password} onChange={(e) => setPassword(e.target.value)}
              placeholder={mode === 'register' ? '영문+숫자 8자 이상' : '비밀번호'}
              type="password"
              className="w-full bg-white rounded-xl px-4 py-3 text-ink-600 placeholder:text-ink-200 focus:outline-none focus:ring-2 focus:ring-warm-300 border border-cream-200"
            />
          </div>
          {mode === 'register' && (
            <>
              <div>
                <label className="text-xs text-ink-400 mb-1 block">비밀번호 확인</label>
                <input
                  value={passwordConfirm} onChange={(e) => setPasswordConfirm(e.target.value)}
                  placeholder="비밀번호를 다시 입력해주세요"
                  type="password"
                  className="w-full bg-white rounded-xl px-4 py-3 text-ink-600 placeholder:text-ink-200 focus:outline-none focus:ring-2 focus:ring-warm-300 border border-cream-200"
                />
              </div>

              {/* Password strength */}
              <div className="bg-cream-50 rounded-xl p-3 text-xs text-ink-400 space-y-1">
                <p className={password.length >= 8 ? 'text-sage-500' : ''}>
                  {password.length >= 8 ? '✅' : '○'} 8자 이상
                </p>
                <p className={/[A-Za-z]/.test(password) && /[0-9]/.test(password) ? 'text-sage-500' : ''}>
                  {/[A-Za-z]/.test(password) && /[0-9]/.test(password) ? '✅' : '○'} 영문 + 숫자 포함
                </p>
                <p className={password === passwordConfirm && passwordConfirm.length > 0 ? 'text-sage-500' : ''}>
                  {password === passwordConfirm && passwordConfirm.length > 0 ? '✅' : '○'} 비밀번호 일치
                </p>
              </div>

              {/* Terms & Privacy */}
              <div className="space-y-2">
                <label className="flex items-start gap-2 cursor-pointer">
                  <input type="checkbox" checked={agreedToTerms} onChange={(e) => setAgreedToTerms(e.target.checked)}
                    className="mt-1 w-4 h-4 rounded accent-ink-700" />
                  <span className="text-xs text-ink-400">
                    <button type="button" onClick={() => setShowTerms(true)} className="text-ink-600 underline font-medium">이용약관</button>에 동의합니다
                    {agreedToTerms && <span className="text-sage-500 ml-1">✓</span>}
                  </span>
                </label>
                <label className="flex items-start gap-2 cursor-pointer">
                  <input type="checkbox" checked={agreedToPrivacy} onChange={(e) => setAgreedToPrivacy(e.target.checked)}
                    className="mt-1 w-4 h-4 rounded accent-ink-700" />
                  <span className="text-xs text-ink-400">
                    <button type="button" onClick={() => setShowPrivacy(true)} className="text-ink-600 underline font-medium">개인정보처리방침</button>에 동의합니다
                    {agreedToPrivacy && <span className="text-sage-500 ml-1">✓</span>}
                  </span>
                </label>
                <label className="flex items-start gap-2 cursor-pointer">
                  <input type="checkbox" checked={agreedToGuidelines} onChange={(e) => setAgreedToGuidelines(e.target.checked)}
                    className="mt-1 w-4 h-4 rounded accent-ink-700" />
                  <span className="text-xs text-ink-400">
                    <button type="button" onClick={() => setShowGuidelines(true)} className="text-ink-600 underline font-medium">커뮤니티 가이드라인</button>에 동의합니다
                    {agreedToGuidelines && <span className="text-sage-500 ml-1">✓</span>}
                  </span>
                </label>
              </div>
            </>
          )}

          {error && <p className="text-red-500 text-xs text-center">{error}</p>}

          <button onClick={handleSubmit} disabled={isLoading}
            className="w-full py-3.5 rounded-xl bg-ink-700 text-white font-medium hover:bg-ink-600 transition-colors disabled:opacity-50">
            {isLoading ? '처리 중...' : mode === 'register' ? '가입하기' : '로그인'}
          </button>

          {mode === 'register' && (
            <p className="text-[10px] text-ink-300 text-center leading-relaxed">
              🔒 비밀번호는 암호화되어 안전하게 저장됩니다.<br/>
              🎁 추천인 코드를 입력하면 서로 연필 1자루씩!
            </p>
          )}
        </div>

        {/* Divider */}
        <div className="relative my-5">
          <div className="border-t border-cream-200" />
          <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-gradient-to-b from-cream-50 to-white px-3 text-xs text-ink-300">또는</span>
        </div>

        {/* OAuth */}
        <div className="space-y-3">
          <button onClick={() => handleOAuth('kakao')}
            className="w-full py-3.5 rounded-xl bg-[#FEE500] text-[#3C1E1E] font-medium flex items-center justify-center gap-2 hover:brightness-95 transition-all">
            <span className="text-lg">💬</span>카카오로 시작하기
          </button>
          <button onClick={() => handleOAuth('naver')}
            className="w-full py-3.5 rounded-xl bg-[#03C75A] text-white font-medium flex items-center justify-center gap-2 hover:brightness-95 transition-all">
            <span className="text-lg font-bold">N</span>네이버로 시작하기
          </button>
        </div>
      </div>

      {/* Verification Modal */}
      {showVerification && (
        <div className="fixed inset-0 z-[70] bg-black/50 flex items-center justify-center" onClick={() => {}}>
          <div className="bg-white rounded-2xl w-[90%] max-w-[380px] p-6 mx-4" onClick={e => e.stopPropagation()}>
            <div className="text-center mb-5">
              <div className="text-4xl mb-3">📧</div>
              <h3 className="text-lg font-bold text-ink-700">이메일 인증</h3>
              <p className="text-sm text-ink-400 mt-1">{verificationEmail}로<br/>인증 코드를 보냈어요</p>
            </div>
            <input
              value={verificationCode}
              onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder="6자리 인증 코드"
              className="w-full bg-cream-50 rounded-xl px-4 py-3.5 text-center text-2xl font-bold tracking-[0.5em] text-ink-700 placeholder:text-ink-200 placeholder:text-base placeholder:tracking-normal focus:outline-none focus:ring-2 focus:ring-warm-300 border border-cream-200 mb-3"
              maxLength={6}
              inputMode="numeric"
              autoFocus
            />
            {error && <p className="text-red-500 text-xs text-center mb-3">{error}</p>}
            <button onClick={handleVerify} disabled={isVerifying || verificationCode.length !== 6}
              className="w-full py-3.5 rounded-xl bg-ink-700 text-white font-medium disabled:opacity-50 mb-2">
              {isVerifying ? '확인 중...' : '인증 완료'}
            </button>
            <button onClick={handleResendCode} disabled={isResending}
              className="w-full py-2.5 text-sm text-ink-400 hover:text-ink-600 disabled:opacity-50">
              {isResending ? '발송 중...' : '인증 코드 재발송'}
            </button>
          </div>
        </div>
      )}

      {/* Terms Modal */}
      {showTerms && (
        <div className="fixed inset-0 z-[60] modal-overlay flex items-center justify-center" onClick={() => setShowTerms(false)}>
          <div className="bg-white rounded-card w-[90%] max-w-[400px] max-h-[80vh] flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="p-5 border-b border-cream-200 flex items-center justify-between">
              <h3 className="font-bold text-ink-700 text-lg">📋 이용약관</h3>
              <button onClick={() => setShowTerms(false)} className="text-ink-300 hover:text-ink-500">✕</button>
            </div>
            <div className="flex-1 overflow-y-auto p-5">
              <pre className="text-xs text-ink-500 whitespace-pre-wrap leading-relaxed font-sans">{TERMS_OF_SERVICE}</pre>
            </div>
            <div className="p-4 border-t border-cream-200">
              <button onClick={() => { setAgreedToTerms(true); setShowTerms(false); }}
                className="w-full py-3 rounded-xl bg-ink-700 text-white font-medium text-sm">
                동의하고 닫기
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Privacy Modal */}
      {showPrivacy && (
        <div className="fixed inset-0 z-[60] modal-overlay flex items-center justify-center" onClick={() => setShowPrivacy(false)}>
          <div className="bg-white rounded-card w-[90%] max-w-[400px] max-h-[80vh] flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="p-5 border-b border-cream-200 flex items-center justify-between">
              <h3 className="font-bold text-ink-700 text-lg">🔒 개인정보처리방침</h3>
              <button onClick={() => setShowPrivacy(false)} className="text-ink-300 hover:text-ink-500">✕</button>
            </div>
            <div className="flex-1 overflow-y-auto p-5">
              <pre className="text-xs text-ink-500 whitespace-pre-wrap leading-relaxed font-sans">{PRIVACY_POLICY}</pre>
            </div>
            <div className="p-4 border-t border-cream-200">
              <button onClick={() => { setAgreedToPrivacy(true); setShowPrivacy(false); }}
                className="w-full py-3 rounded-xl bg-ink-700 text-white font-medium text-sm">
                동의하고 닫기
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Community Guidelines Modal */}
      {showGuidelines && (
        <div className="fixed inset-0 z-[60] modal-overlay flex items-center justify-center" onClick={() => setShowGuidelines(false)}>
          <div className="bg-white rounded-card w-[90%] max-w-[400px] max-h-[80vh] flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="p-5 border-b border-cream-200 flex items-center justify-between">
              <h3 className="font-bold text-ink-700 text-lg">🛡️ 커뮤니티 가이드라인</h3>
              <button onClick={() => setShowGuidelines(false)} className="text-ink-300 hover:text-ink-500">✕</button>
            </div>
            <div className="flex-1 overflow-y-auto p-5">
              <pre className="text-xs text-ink-500 whitespace-pre-wrap leading-relaxed font-sans">{COMMUNITY_GUIDELINES}</pre>
            </div>
            <div className="p-4 border-t border-cream-200">
              <button onClick={() => { setAgreedToGuidelines(true); setShowGuidelines(false); }}
                className="w-full py-3 rounded-xl bg-ink-700 text-white font-medium text-sm">
                동의하고 닫기
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
function HomeContent() {
  const { isLoggedIn, user, poems, blockedUsers } = useAppStore();
  const [dbPoems, setDbPoems] = useState<any[]>([]);

  useEffect(() => {
    fetch('/api/poems?limit=10')
      .then(r => r.ok ? r.json() : null)
      .then(data => { if (data?.poems) setDbPoems(data.poems); })
      .catch(() => {});
  }, []);

  // DB poems first, then local fallback (dedup)
  const dbPoemIds = new Set(dbPoems.map(p => p.id));
  const recentPoems = [
    ...dbPoems,
    ...poems.filter(p => !dbPoemIds.has(p.id) && p.isCompleted),
  ].filter(p => !p.isHidden && !blockedUsers.includes(p.authorId)).slice(0, 6);

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="px-6 pt-8 pb-4 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-ink-700 leading-tight">시글담</h1>
          <p className="text-sm text-ink-300 mt-1">나만의 시를 담다</p>
        </div>
        <Link href="/profile" className="w-10 h-10 rounded-full bg-cream-100 flex items-center justify-center">
          {isLoggedIn ? (
            <span className="text-lg">{user?.avatar || '🌸'}</span>
          ) : (
            <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
          )}
        </Link>
      </header>

      {/* Today's Writing Prompt */}
      <section className="px-6 mb-6">
        <TodayPromptCard />
      </section>

      {/* Quick Actions */}
      <section className="px-6 mb-6">
        <div className="flex gap-3">
          <Link href="/write" className="flex-1 bg-ink-700 text-white rounded-2xl py-4 px-5 text-center font-medium hover:bg-ink-600 transition-colors">
            ✏️ 시 쓰러 가기
          </Link>
          <Link href="/feed" className="flex-1 bg-cream-100 text-ink-600 rounded-2xl py-4 px-5 text-center font-medium hover:bg-cream-200 transition-colors">
            📖 다른 시 보기
          </Link>
        </div>
      </section>

      {/* Flower Collection Preview */}
      <section className="px-6 mb-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-bold text-ink-600">꽃 도감</h2>
          <Link href="/flowers" className="text-sm text-ink-400 hover:text-ink-600">꽃 종류 보기 →</Link>
        </div>
        <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
          {flowers.map(flower => (
            <Link key={flower.id} href={`/write?flower=${flower.id}`} className="flex-shrink-0 flex flex-col items-center gap-1 group">
              <div
                className="w-14 h-14 rounded-full flex items-center justify-center text-2xl opacity-60 group-hover:opacity-100 group-hover:scale-110 transition-all"
                style={{ backgroundColor: flower.color + '22' }}
              >
                {flower.emoji}
              </div>
              <span className="text-xs text-ink-400 group-hover:text-ink-600">{flower.name}</span>
            </Link>
          ))}
        </div>
      </section>

      {/* Recent Poems Feed */}
      <section className="px-6 pb-24">
        <h2 className="text-lg font-bold text-ink-600 mb-3">최근 올라온 시</h2>
        <div className="space-y-4">
          {recentPoems.map(poem => (
            <PoemCard key={poem.id} poem={poem} />
          ))}
          {recentPoems.length === 0 && (
            <div className="bg-cream-50 rounded-xl p-6 text-center">
              <p className="text-ink-300 text-sm">아직 시가 없어요</p>
              <Link href="/write" className="text-ink-600 underline text-sm mt-1 inline-block">첫 번째 시를 써보세요!</Link>
            </div>
          )}
        </div>
      </section>

      {/* Footer */}
      <Footer />

      {/* Bottom Navigation */}
      <BottomNav active="home" />
    </div>
  );
}

function TodayPromptCard() {
  const todayFlower = flowers[Math.floor(Date.now() / 86400000) % flowers.length];

  return (
    <div className="bg-cream-100 rounded-card p-6 relative">
      <div className="flex flex-col items-center text-center">
        <div
          className="w-20 h-20 rounded-full flex items-center justify-center text-4xl mb-4 gentle-float"
          style={{ backgroundColor: todayFlower.color + '33' }}
        >
          {todayFlower.emoji}
        </div>
        <p className="text-ink-500 text-sm leading-relaxed mb-2">
          오늘의 글감
        </p>
        <h3 className="text-xl font-bold text-ink-700 mb-1">{todayFlower.name}</h3>
        <p className="text-ink-400 text-xs">{todayFlower.meaning}</p>
        <p className="text-ink-400 text-sm mt-3 leading-relaxed">
          {todayFlower.description}
        </p>
      </div>
      <Link href="/write" className="absolute bottom-4 right-4 w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm hover:shadow-md transition-shadow">
        <span className="text-ink-500">✏️</span>
      </Link>
    </div>
  );
}

function PoemCard({ poem }: { poem: any }) {
  const flower = flowers.find(f => f.id === poem.flower || f.id === poem.flowerId);
  return (
    <Link href={`/poem/${poem.id}`} className="block">
      <div className="bg-cream-50 rounded-2xl p-5 hover:shadow-sm transition-shadow">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-lg">{flower?.emoji || '🌸'}</span>
          <span className="text-sm font-medium text-ink-500">{poem.author || poem.authorName || '익명'}</span>
          <span className="text-xs text-ink-300 ml-auto">{flower?.name}</span>
        </div>
        <h3 className="font-bold text-ink-700 mb-2">{poem.title || '무제'}</h3>
        <p className="text-sm text-ink-400 leading-relaxed line-clamp-3 whitespace-pre-wrap">
          {poem.text || poem.finalPoem}
        </p>
        <div className="flex items-center gap-3 mt-3 text-ink-300 text-sm">
          <span className="flex items-center gap-1">♡ {poem.likes}</span>
          <span className="flex items-center gap-1">💬 {(poem.comments || []).length}</span>
          <span className="flex items-center gap-1">👀 {poem.views || 0}</span>
        </div>
      </div>
    </Link>
  );
}

function LoadingScreen() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-warm-50">
      <div className="text-center">
        <div className="text-5xl mb-4 gentle-float">🌸</div>
        <h1 className="text-2xl font-bold text-ink-700">시글담</h1>
        <p className="text-sm text-ink-300 mt-2">나만의 시를 담다</p>
      </div>
    </div>
  );
}
