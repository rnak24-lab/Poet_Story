# 시글담 — 운영자가 해야 할 일 완전 가이드

> 현재 상태: 프론트엔드 프로토타입 완성 (데모 모드)
> 실제 서비스 런칭을 위해 아래 항목들을 순서대로 진행하세요.

---

## 목차
1. [도메인 & 호스팅 세팅](#1-도메인--호스팅-세팅)
2. [실제 이메일 인증 연결](#2-실제-이메일-인증-연결)
3. [데이터베이스 연결](#3-데이터베이스-연결)
4. [실제 광고 시스템 (Google AdMob/AdSense)](#4-실제-광고-시스템)
5. [실제 결제 시스템 (연필 구매)](#5-실제-결제-시스템-연필-구매)
6. [AI 자동완성 API 키 세팅](#6-ai-자동완성-api-키-세팅)
7. [카카오/네이버 소셜 로그인](#7-카카오네이버-소셜-로그인)
8. [보안 강화](#8-보안-강화)

---

## 1. 도메인 & 호스팅 세팅

### 왜 필요한가?
지금은 sandbox URL이라 매번 바뀜. 고정된 `sigeuldam.kr` 같은 주소가 필요함.

### 스텝 바이 스텝

#### Step 1-1. 도메인 구매
1. [가비아](https://www.gabia.com) 또는 [카페24](https://www.cafe24.com) 접속
2. "도메인 검색"에서 원하는 도메인 검색
   - 추천: `sigeuldam.kr` (약 ₩22,000/년) 또는 `sigeuldam.com` (약 ₩15,000/년)
3. 장바구니에 담고 결제
4. 도메인 소유자 정보 입력 (이름, 이메일, 전화번호)
5. 결제 완료 → 도메인 관리 페이지에서 "DNS 관리" 접근 가능 확인

#### Step 1-2. 호스팅 플랫폼 선택 & 배포
**추천: Vercel (무료, Next.js 만든 회사)**

1. [vercel.com](https://vercel.com) 접속 → GitHub 계정으로 가입
2. 시글담 코드를 GitHub에 올리기:
   ```bash
   # 터미널에서
   cd /home/user/webapp
   git init
   git add .
   git commit -m "시글담 초기 버전"
   
   # GitHub에서 새 저장소 만들고:
   git remote add origin https://github.com/내계정/sigeuldam.git
   git push -u origin main
   ```
3. Vercel 대시보드 → "New Project" → GitHub 저장소 선택
4. Framework Preset: `Next.js` (자동 감지됨)
5. "Deploy" 클릭 → 2~3분 후 `sigeuldam.vercel.app` 주소 생성

#### Step 1-3. 커스텀 도메인 연결
1. Vercel 대시보드 → 프로젝트 → Settings → Domains
2. `sigeuldam.kr` 입력 후 "Add"
3. Vercel이 알려주는 DNS 설정을 가비아에 적용:
   - 가비아 → 도메인 관리 → DNS 설정
   - A 레코드 추가: `@` → `76.76.21.21`
   - CNAME 추가: `www` → `cname.vercel-dns.com`
4. 10~30분 기다리면 `sigeuldam.kr`로 접속 가능
5. SSL(HTTPS)은 Vercel이 자동 설정해줌 → 끝!

---

## 2. 실제 이메일 인증 연결

### 왜 필요한가?
지금은 인증 코드가 화면에 표시됨 (데모). 실제로 이메일로 보내야 함.

### 추천: Resend (가장 쉬움, 무료 100통/일)

#### Step 2-1. Resend 가입 & API 키 발급
1. [resend.com](https://resend.com) 접속 → GitHub 계정으로 가입
2. 대시보드 → "API Keys" → "Create API Key"
3. 이름: `sigeuldam-email` → 생성
4. `re_xxxxxxxxxxxx` 형태의 API 키가 나옴 → **절대 공개하지 말것!** 복사해둠

#### Step 2-2. 발신 도메인 설정 (sigeuldam.kr 도메인 필요)
1. Resend 대시보드 → "Domains" → "Add Domain"
2. `sigeuldam.kr` 입력
3. Resend이 알려주는 DNS 레코드 3개를 가비아 DNS에 추가:
   - MX 레코드 1개
   - TXT 레코드 2개 (SPF, DKIM)
4. "Verify" 클릭 → 초록색 ✅ 뜨면 완료
   (도메인 없으면 `onboarding@resend.dev`로 테스트 가능)

#### Step 2-3. 패키지 설치
```bash
cd /home/user/webapp
npm install resend
```

#### Step 2-4. API 라우트 만들기
`src/app/api/send-verification/route.ts` 파일 새로 생성:

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: NextRequest) {
  try {
    const { email, code, userName } = await req.json();

    if (!email || !code) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
    }

    const { data, error } = await resend.emails.send({
      from: '시글담 <noreply@sigeuldam.kr>',
      to: email,
      subject: '[시글담] 이메일 인증 코드',
      html: `
        <div style="font-family: 'Pretendard', sans-serif; max-width: 400px; margin: 0 auto; padding: 40px 20px;">
          <h1 style="font-size: 24px; color: #2A2A2A;">🌸 시글담</h1>
          <p style="color: #666;">안녕하세요, ${userName || '시인'}님!</p>
          <p style="color: #666;">아래 인증 코드를 앱에 입력해주세요.</p>
          <div style="background: #FFF5F0; border-radius: 16px; padding: 24px; text-align: center; margin: 24px 0;">
            <p style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #2A2A2A;">${code}</p>
          </div>
          <p style="color: #999; font-size: 12px;">이 코드는 10분간 유효합니다.</p>
          <p style="color: #999; font-size: 12px;">본인이 요청하지 않았다면 이 메일을 무시하세요.</p>
        </div>
      `,
    });

    if (error) {
      console.error('Email error:', error);
      return NextResponse.json({ error: 'Failed to send email' }, { status: 500 });
    }

    return NextResponse.json({ success: true, id: data?.id });
  } catch (err) {
    console.error('Send verification error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
```

#### Step 2-5. 환경변수 설정
Vercel 대시보드 → Settings → Environment Variables:
```
RESEND_API_KEY = re_xxxxxxxxxxxx
```
로컬 개발 시 `.env.local` 파일:
```
RESEND_API_KEY=re_xxxxxxxxxxxx
```

#### Step 2-6. 프론트엔드에서 호출하도록 연결
`src/store/useAppStore.ts`의 `registerUser` 함수 끝에, 또는 프로필 페이지의 회원가입 성공 후에:

```typescript
// 회원가입 성공 후 이메일 전송
await fetch('/api/send-verification', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: newUser.email,
    code: verificationCode,
    userName: newUser.name,
  }),
});
```

그리고 `handleResendCode` 함수에서도 같은 API를 호출하면 됨.

---

## 3. 데이터베이스 연결

### 왜 필요한가?
지금은 모든 데이터가 `localStorage`에 저장됨 → 브라우저 하나에서만 보임, 기기 바꾸면 데이터 사라짐.
서버 데이터베이스에 저장해야 모든 기기에서, 모든 사용자가 공유할 수 있음.

### 추천: Supabase (무료 플랜으로 충분)

#### Step 3-1. Supabase 프로젝트 생성
1. [supabase.com](https://supabase.com) 접속 → GitHub 계정으로 가입
2. "New Project" 클릭
3. 프로젝트 이름: `sigeuldam` / 비밀번호 설정 / Region: `Northeast Asia (Seoul)`
4. 생성 완료 → Project URL과 API Key 확인

#### Step 3-2. 테이블 만들기
Supabase 대시보드 → SQL Editor에서 실행:

```sql
-- 사용자 테이블
CREATE TABLE users (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  avatar TEXT DEFAULT '🌸',
  pencils INTEGER DEFAULT 3,
  achievements TEXT[] DEFAULT '{}',
  share_count INTEGER DEFAULT 0,
  total_likes INTEGER DEFAULT 0,
  total_views INTEGER DEFAULT 0,
  is_admin BOOLEAN DEFAULT false,
  is_email_verified BOOLEAN DEFAULT false,
  verification_code TEXT,
  referral_code TEXT UNIQUE,
  referred_by TEXT,
  used_referral_codes TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 시 테이블
CREATE TABLE poems (
  id TEXT PRIMARY KEY,
  flower_id TEXT NOT NULL,
  author_name TEXT NOT NULL,
  author_id TEXT REFERENCES users(id),
  title TEXT,
  final_poem TEXT NOT NULL,
  background TEXT DEFAULT 'bg-cream-100',
  is_completed BOOLEAN DEFAULT true,
  is_auto_generated BOOLEAN DEFAULT false,
  likes INTEGER DEFAULT 0,
  liked_by TEXT[] DEFAULT '{}',
  views INTEGER DEFAULT 0,
  is_hidden BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 댓글 테이블
CREATE TABLE comments (
  id TEXT PRIMARY KEY,
  poem_id TEXT REFERENCES poems(id) ON DELETE CASCADE,
  author_id TEXT REFERENCES users(id),
  author_name TEXT NOT NULL,
  text TEXT NOT NULL,
  likes INTEGER DEFAULT 0,
  liked_by TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 신고 테이블
CREATE TABLE reports (
  id SERIAL PRIMARY KEY,
  poem_id TEXT REFERENCES poems(id) ON DELETE CASCADE,
  reporter_id TEXT REFERENCES users(id),
  reporter_name TEXT NOT NULL,
  reason TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 알림 테이블
CREATE TABLE notifications (
  id TEXT PRIMARY KEY,
  user_id TEXT REFERENCES users(id),
  type TEXT NOT NULL,
  message TEXT NOT NULL,
  poem_id TEXT,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

#### Step 3-3. 패키지 설치
```bash
npm install @supabase/supabase-js
```

#### Step 3-4. Supabase 클라이언트 설정
`src/lib/supabase.ts` 파일 새로 생성:

```typescript
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
```

#### Step 3-5. 환경변수 설정
```
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJxxxxxxxxxxxx
```

#### Step 3-6. 기존 Zustand 스토어를 DB 연동으로 교체
이 부분이 가장 큰 작업. 각 함수(registerUser, loginUser, addPoem 등)를 
`supabase.from('users').insert(...)`, `supabase.from('poems').select(...)` 등으로 교체해야 함.
→ 이건 별도로 요청하면 도와드릴 수 있음.

---

## 4. 실제 광고 시스템

### 왜 필요한가?
지금 광고는 가짜(플레이스홀더). 실제 광고를 보여줘야 수익 발생 + 연필 지급.

### 두 가지 선택지

#### 옵션 A: Google AdSense (웹 배너 광고) — 쉬움
수익: 1,000회 노출당 ₩3,000~₩8,000 (배너 광고)

#### 옵션 B: Google AdMob 리워드 광고 — 수익 높음
수익: 광고 1회 시청당 ₩3~₩15 (리워드 광고가 eCPM 높음)

### AdSense 적용 스텝 (웹사이트용)

#### Step 4-1. AdSense 가입
1. [adsense.google.com](https://adsense.google.com) 접속
2. Google 계정으로 로그인
3. "사이트 URL" 입력: `sigeuldam.kr` (**반드시 실제 도메인 필요**)
4. 전화번호, 주소, 결제 정보 입력
5. ⚠️ **심사 과정**: 보통 1~14일 소요. 콘텐츠가 충분해야 승인됨
   - 시 10편 이상 있는 상태에서 신청 권장
   - 이용약관, 개인정보처리방침 페이지 있어야 함 (✅ 이미 구현됨)

#### Step 4-2. AdSense 코드 삽입
심사 승인 후 AdSense에서 `ca-pub-XXXXXXXXXX` 코드를 받음.

`src/app/layout.tsx` 파일을 수정:
```typescript
// 기존 주석 처리된 부분을 실제 코드로 교체:
<script 
  async 
  src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-여기에실제코드" 
  crossOrigin="anonymous"
/>
```

#### Step 4-3. 리워드 광고 단위 만들기
1. AdSense 대시보드 → "광고" → "광고 단위별" → "새 광고 단위 만들기"
2. 유형: "디스플레이 광고" 선택
3. 이름: `sigeuldam-rewarded`
4. 생성된 코드를 `src/app/write/page.tsx`의 광고 모달 자리에 삽입:

```html
<!-- 기존 placeholder 대신 -->
<ins className="adsbygoogle"
  style={{ display: 'block', width: '300px', height: '250px' }}
  data-ad-client="ca-pub-여기에실제코드"
  data-ad-slot="여기에슬롯코드"
  data-ad-format="auto" />
```

#### Step 4-4. 광고 시청 완료 감지 → 연필 지급
> ⚠️ 주의: 웹 AdSense는 리워드 광고를 공식 지원하지 않음.
> 진짜 "광고 보고 보상 받기"를 하려면 **AdMob + 앱(React Native / PWA)** 이 필요함.
> 
> **현실적 대안:**
> - 웹에서는 "광고 영역 근처에 버튼 배치" → 사용자가 광고 본 후 버튼 클릭 → 연필 지급
> - 또는 5초 카운트다운 후 지급 (현재 구현된 방식 유지)
> - 장기적으로 앱 출시 시 AdMob 리워드 광고 연동

---

## 5. 실제 결제 시스템 (연필 구매)

### 왜 필요한가?
지금은 "구매" 버튼 누르면 바로 연필 지급됨 (데모). 실제 돈을 받아야 함.

### 추천: 토스페이먼츠 (한국 결제에 최적)

#### Step 5-1. 토스페이먼츠 가입
1. [developers.tosspayments.com](https://developers.tosspayments.com) 접속
2. 회원가입 → 사업자 등록 (개인사업자 또는 법인)
   - ⚠️ **사업자등록증이 필요함** (개인은 간이과세자로 시작 가능)
   - 국세청 홈택스에서 개인사업자 등록: 무료, 1~3일 소요
3. 테스트 모드 → 클라이언트 키 & 시크릿 키 확인

#### Step 5-2. 패키지 설치
```bash
npm install @tosspayments/payment-sdk
```

#### Step 5-3. 결제 페이지 만들기
`src/app/api/payment/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server';

// 결제 승인 API
export async function POST(req: NextRequest) {
  const { paymentKey, orderId, amount } = await req.json();

  // 토스페이먼츠 결제 승인 요청
  const response = await fetch('https://api.tosspayments.com/v1/payments/confirm', {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${Buffer.from(process.env.TOSS_SECRET_KEY + ':').toString('base64')}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ paymentKey, orderId, amount }),
  });

  const data = await response.json();

  if (data.status === 'DONE') {
    // 결제 성공 → DB에서 해당 사용자에게 연필 지급
    const pencilCount = getPencilCountByAmount(amount);
    // await supabase.rpc('add_pencils', { user_id, count: pencilCount });
    return NextResponse.json({ success: true, pencils: pencilCount });
  }

  return NextResponse.json({ error: data.message }, { status: 400 });
}

function getPencilCountByAmount(amount: number): number {
  switch (amount) {
    case 1000: return 10;
    case 2500: return 30;
    case 4000: return 60;
    case 8000: return 150;
    default: return 0;
  }
}
```

#### Step 5-4. 프론트에서 결제창 띄우기
연필 구매 모달에서 패키지 선택 시:

```typescript
import { loadTossPayments } from '@tosspayments/payment-sdk';

async function handlePurchase(amount: number, pencilCount: number) {
  const tossPayments = await loadTossPayments('test_ck_여기에클라이언트키');
  
  await tossPayments.requestPayment('카드', {
    amount,
    orderId: `pencil-${Date.now()}`,
    orderName: `시글담 연필 ${pencilCount}자루`,
    successUrl: `${window.location.origin}/payment/success`,
    failUrl: `${window.location.origin}/payment/fail`,
  });
}
```

#### Step 5-5. 결제 성공/실패 페이지 만들기
`src/app/payment/success/page.tsx` — URL에서 paymentKey, orderId, amount 받아서 서버에 승인 요청 → 연필 지급
`src/app/payment/fail/page.tsx` — 결제 실패 안내

#### Step 5-6. 환경변수 설정
```
TOSS_CLIENT_KEY=test_ck_xxxxxxxxxxxx
TOSS_SECRET_KEY=test_sk_xxxxxxxxxxxx
```

> 💡 **사업자 없이 하고 싶다면?**
> - 카카오페이 송금 링크 + 수동 연필 지급 (초기에 가능)
> - 또는 "인앱 결제 없이 광고만" 으로 시작

---

## 6. AI 자동완성 API 키 세팅

### 왜 필요한가?
지금은 Genspark proxy를 쓰는데, 실제 배포 시 직접 API 키가 필요함.

### 추천: OpenAI API (GPT-4o-mini 가장 저렴)

#### Step 6-1. OpenAI API 키 발급
1. [platform.openai.com](https://platform.openai.com) 접속 → 가입
2. "API Keys" → "Create new secret key"
3. `sk-xxxxxxxx` 형태의 키 → 복사 (**절대 공개 금지!**)

#### Step 6-2. 크레딧 충전
1. Billing → "Add payment method" → 카드 등록
2. "Add to credit balance" → $5~$10 충전 (약 ₩7,000~₩14,000)
3. ⚠️ $5면 약 16,000회 자동완성 가능 (GPT-4o-mini 기준)

#### Step 6-3. 환경변수 설정
```
OPENAI_API_KEY=sk-xxxxxxxxxxxxxxxx
OPENAI_BASE_URL=https://api.openai.com/v1
```

#### Step 6-4. route.ts 모델명 확인
`src/app/api/generate-poem/route.ts`에서:
```typescript
model: 'gpt-4o-mini',  // 가장 저렴. 필요시 'gpt-4o'로 업그레이드
```

#### 비용 참고
| 모델 | 1회 자동완성 비용 | ₩1,000 충전 시 |
|------|-------------------|----------------|
| GPT-4o-mini | ~₩0.4 | ~2,500회 가능 |
| GPT-4o | ~₩4 | ~250회 가능 |

---

## 7. 카카오/네이버 소셜 로그인

### 왜 필요한가?
지금은 가짜 소셜 로그인 (버튼만 있음). 실제 연동 필요.

### 카카오 로그인

#### Step 7-1. 카카오 앱 등록
1. [developers.kakao.com](https://developers.kakao.com) 접속 → 가입
2. "내 애플리케이션" → "애플리케이션 추가"
3. 앱 이름: `시글담` / 사업자명 입력
4. REST API 키 확인 & 복사

#### Step 7-2. 카카오 로그인 설정
1. 앱 설정 → "카카오 로그인" → 활성화 ON
2. Redirect URI 추가: `https://sigeuldam.kr/api/auth/kakao/callback`
3. 동의항목: 닉네임(필수), 이메일(선택)

#### Step 7-3. 구현
```bash
npm install next-auth
```
NextAuth.js의 KakaoProvider 사용하거나, 직접 OAuth 플로우 구현.

### 네이버 로그인

#### Step 7-4. 네이버 앱 등록
1. [developers.naver.com](https://developers.naver.com) → 애플리케이션 등록
2. 사용 API: "네이버 로그인" 선택
3. 서비스 URL: `https://sigeuldam.kr`
4. Callback URL: `https://sigeuldam.kr/api/auth/naver/callback`
5. Client ID & Client Secret 확인

---

## 8. 보안 강화

#### Step 8-1. bcrypt로 비밀번호 해싱 업그레이드
지금은 클라이언트에서 간단한 해시 사용. 서버사이드 bcrypt가 필요.

```bash
npm install bcryptjs
npm install -D @types/bcryptjs
```

```typescript
// 서버 API에서:
import bcrypt from 'bcryptjs';

// 가입 시
const hash = await bcrypt.hash(password, 12);

// 로그인 시
const isValid = await bcrypt.compare(password, storedHash);
```

#### Step 8-2. JWT 토큰 인증
지금은 Zustand에 로그인 상태 저장. JWT로 서버 인증 필요.

```bash
npm install jsonwebtoken
npm install -D @types/jsonwebtoken
```

#### Step 8-3. Rate Limiting
API 남용 방지:
```bash
npm install @upstash/ratelimit @upstash/redis
```

---

## 🗓 추천 실행 순서 & 타임라인

### 🟢 1주차: 기초 인프라
| 순서 | 할 일 | 예상 시간 | 비용 |
|------|--------|----------|------|
| 1 | 도메인 구매 (가비아) | 10분 | ₩15,000~22,000/년 |
| 2 | GitHub에 코드 올리기 | 15분 | 무료 |
| 3 | Vercel에 배포 | 10분 | 무료 |
| 4 | 도메인 연결 | 20분 (+ 대기 30분) | 무료 |

### 🟡 2주차: 핵심 서비스
| 순서 | 할 일 | 예상 시간 | 비용 |
|------|--------|----------|------|
| 5 | Supabase DB 세팅 | 1시간 | 무료 |
| 6 | Zustand → DB 연동 | 4~8시간 | 무료 |
| 7 | OpenAI API 키 세팅 | 15분 | $5 (~₩7,000) |
| 8 | Resend 이메일 연동 | 1시간 | 무료 |

### 🔴 3~4주차: 수익화
| 순서 | 할 일 | 예상 시간 | 비용 |
|------|--------|----------|------|
| 9 | Google AdSense 신청 | 30분 + 심사 1~14일 | 무료 |
| 10 | AdSense 코드 삽입 | 30분 | 무료 |
| 11 | 사업자 등록 (결제용) | 1~3일 | 무료 |
| 12 | 토스페이먼츠 결제 연동 | 2~4시간 | 무료 (수수료 3.3%) |

### 🔵 이후: 고도화
| 순서 | 할 일 | 예상 시간 | 비용 |
|------|--------|----------|------|
| 13 | 카카오/네이버 로그인 | 2~3시간 | 무료 |
| 14 | bcrypt + JWT 보안 | 2~3시간 | 무료 |
| 15 | 앱 출시 (PWA → 앱스토어) | 1~2주 | $99/년(Apple) |

---

## 💰 초기 비용 정리

| 항목 | 비용 | 비고 |
|------|------|------|
| 도메인 | ₩15,000~22,000/년 | 필수 |
| Vercel 호스팅 | ₩0 | 무료 플랜 충분 |
| Supabase DB | ₩0 | 무료 플랜 (500MB) |
| Resend 이메일 | ₩0 | 무료 (100통/일) |
| OpenAI API | ~₩7,000 | $5 충전, 16,000회 사용 가능 |
| AdSense | ₩0 | 무료 (광고 수익 발생) |
| **합계** | **약 ₩22,000~29,000** | **월 유지비 ₩0 (초기)** |

---

## ⚠️ 현재 코드에서 바꿔야 할 파일 목록

실제 서비스 시 수정이 필요한 파일:

1. **`src/store/useAppStore.ts`** — localStorage → DB API 호출로 교체
2. **`src/app/api/generate-poem/route.ts`** — 환경변수에 실제 OpenAI 키 설정
3. **`src/app/layout.tsx`** — AdSense 스크립트 주석 해제 + 실제 pub ID
4. **`src/app/profile/page.tsx`** — 연필 구매 시 토스페이먼츠 결제 호출
5. **`src/app/write/page.tsx`** — 광고 모달에 실제 AdSense 코드 삽입
6. **새로 만들 파일**: `src/app/api/send-verification/route.ts` (이메일 발송)
7. **새로 만들 파일**: `src/app/api/payment/route.ts` (결제 승인)
8. **새로 만들 파일**: `src/lib/supabase.ts` (DB 클라이언트)

---

> 💡 **팁**: 1주차(도메인+배포)만 하면 일단 사람들이 쓸 수 있는 상태가 됩니다.
> 나머지는 사용자가 늘어나면서 하나씩 추가하면 됩니다.
> 궁금한 스텝이 있으면 언제든 물어보세요!
