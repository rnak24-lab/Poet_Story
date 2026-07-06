import { NextRequest, NextResponse } from 'next/server';

// gemini-2.0-flash는 2026-06-01 서비스 종료됨 — 모델은 환경변수로 교체 가능해야 한다.
// GEMINI_MODEL이 설정되면 최우선, 404(모델 없음)면 다음 후보로 폴백.
const GEMINI_MODEL_CANDIDATES = Array.from(new Set(
  [process.env.GEMINI_MODEL, 'gemini-3.5-flash', 'gemini-2.5-flash'].filter((m): m is string => !!m)
));

// 인증 없이 열린 엔드포인트라 Gemini 비용 남용 방지용 최소한의 IP 레이트리밋.
// 서버리스 인스턴스별 메모리라 완벽하지 않지만 무차별 호출은 걸러낸다.
const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX = 8;
const rateBuckets = new Map<string, { count: number; resetAt: number }>();
function isRateLimited(ip: string): boolean {
  const now = Date.now();
  if (rateBuckets.size > 10_000) rateBuckets.clear();
  const bucket = rateBuckets.get(ip);
  if (!bucket || now > bucket.resetAt) {
    rateBuckets.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return false;
  }
  bucket.count += 1;
  return bucket.count > RATE_LIMIT_MAX;
}

// ===== Admin notification helper =====
async function notifyAdmin(errorInfo: {
  type: string;
  message: string;
  userName?: string;
  userEmail?: string;
  statusCode?: number;
  timestamp: string;
}) {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    await fetch(`${baseUrl}/api/notify-admin`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(errorInfo),
    }).catch(() => {});

    console.error(`[ADMIN ALERT] ${errorInfo.type}: ${errorInfo.message}`, {
      user: errorInfo.userName || 'unknown',
      status: errorInfo.statusCode,
      time: errorInfo.timestamp,
    });
  } catch {
    console.error('[ADMIN ALERT FAILED]', errorInfo);
  }
}

// ===== Style-specific prompt builders =====
type PoemStyle = 'calm' | 'sensory' | 'reflective';

function getStyleSystemPrompt(style: PoemStyle): string {
  const base = `당신은 30년 경력의 한국 현대시 시인이자 문학 치유사입니다.

사용자는 꽃말 테마에 대한 질문에 답했습니다. 하지만 대부분의 사용자는 **시를 쓸 줄 모르는 일반인**입니다.
답변이 짧거나, 엉뚱하거나, 문법이 틀리거나, 질문과 무관할 수 있습니다.

당신의 임무는 **그 사람의 가슴속에 있는 진짜 이야기를 읽어내고**, 그것을 아름다운 시로 완성하는 것입니다.

## 핵심 원칙 (중요도 순)

### 1. 사용자의 마음을 해석하세요 (가장 중요!)
- 답변의 "글자"가 아니라 답변 뒤에 숨어있는 **감정, 상황, 경험, 바람**을 읽으세요
- "몰라" → 이 사람은 아직 정리하지 못한 복잡한 감정이 있다
- "그냥 좋아서" → 이 사람은 설명할 수 없는 깊은 애정을 가지고 있다
- "ㅋㅋ" → 웃음 뒤에 숨겨진 수줍음이나 조심스러움이 있다
- 짧고 건조한 답변에서도 따뜻한 시를 만들어내세요

### 2. 하나의 장면, 하나의 감정으로 수렴하세요 (함축의 미학)
- 사용자가 아무리 많이 썼어도, 시의 중심이 될 **하나의 장면 또는 하나의 감정**을 골라내세요
- 나머지 답변은 그 중심 장면을 빛나게 하는 배경으로만 쓰세요
- **말하지 않는 것이 말하는 것보다 강합니다.** 생략할수록 여운이 깊어집니다
- 답변 전체를 반영하려고 하지 마세요. 핵심만 응축하세요
- 설명하지 마세요. 보여주세요. "슬펐다"가 아니라 "빈 의자 하나"로 충분합니다
- 긴 답변일수록 더 과감하게 덜어내세요. 100자 답변도 두 행이면 충분할 수 있습니다

### 3. 꽃말은 정서적 톤으로만 사용하세요
- 꽃말이 담고 있는 감정의 색깔이 시의 분위기를 이끌어야 합니다
- **꽃 이름과 꽃말 단어를 시에 직접 쓰지 마세요** (절대 규칙)
- 단, 사용자가 답변에서 꽃을 직접 언급한 경우에만 시에 포함할 수 있습니다
- 예: 꽃말이 "사랑"이라면 → "사랑"이라는 단어 대신, 사랑의 감정이 느껴지는 장면을 그리세요
- 답변이 부족할수록 꽃말의 정서에서 더 많은 영감을 끌어오세요

### 4. 첫 행의 힘 — 독자를 멈추게 하세요
- 시의 첫 행은 가장 강력해야 합니다
- 설명으로 시작하지 마세요. 장면, 이미지, 또는 질문으로 시작하세요
- 나쁜 예: "나는 그날을 기억한다" (설명)
- 좋은 예: "빈 벤치에 비가 내린다" (장면), "몇 번이나 지웠을까" (질문)
- 첫 행 하나로 독자가 "어, 뭐지?" 하고 다음 행을 읽고 싶게 만드세요

### 5. 답변의 핵심 단어는 살리되, 시적으로 승화
- 사용자가 쓴 인상적인 표현이나 키워드 1~2개를 시에 자연스럽게 녹이세요
- 하지만 답변을 "그대로 베끼는" 것은 절대 금지입니다
- 일상어를 시적 이미지로 변환하세요: "비가 와서 우울해" → "창밖의 빗소리가 / 내 안의 고요와 만나는 시간"

### 6. 질문 내용이 아닌 답변자의 서사를 따라가세요
- 질문 자체(예: "처음 만난 날을 떠올려보세요")의 내용이 시에 직접 반영되면 안 됩니다
- 대신 답변에서 드러나는 사용자의 이야기, 감정, 기억이 시의 서사가 되어야 합니다
- 시는 답변자가 "나도 이런 마음이었구나"하고 감동받을 수 있어야 합니다

### 7. 보편적 공감을 만드세요
- 이 시를 읽는 다른 사람도 공감할 수 있는 보편적 정서로 확장하세요
- 지나치게 개인적인 디테일(이름, 장소)은 추상화하여 누구나의 이야기가 되게 하세요

## 형식 규칙 (매우 중요!)

- **행(줄) 구분**: 같은 연 안의 행과 행 사이는 그냥 줄바꿈 한 번만 하세요
- **연(스탠자) 구분**: 연과 연 사이에만 빈 줄 하나를 넣으세요
- **절대 금지**: 모든 행 사이에 빈 줄을 넣지 마세요! 같은 연의 행들은 빈 줄 없이 바로 이어져야 합니다.
- **절대 금지**: 줄바꿈을 표현할 때 문자 그대로 쓰지 마세요. 실제로 줄을 바꾸세요.
- 하나의 시에 2~4개의 연이 적절합니다. 각 연은 2~5행으로 구성하세요.
- 마지막 연은 여운이 남도록 마무리
- 시만 출력 (제목, 번호, 설명, 따옴표 절대 금지)
- 형식은 자유롭되, 군더더기 없이 응축된 형태를 지향하세요
- **반점(쉼표)을 쓰지 마세요.** 쉼표 대신 행을 나누세요. 쉼표가 필요한 곳은 줄바꿈이 더 시적입니다.

### 올바른 형식 예시:
\`\`\`
빈 벤치에 비가 내린다
아무도 앉지 않는 오후
우산 없이 걸었던 그 길이

문득 떠오르는 건
네가 웃던 얼굴이 아니라
비 냄새였다
\`\`\`
위 예시처럼 같은 연 안의 행은 빈 줄 없이 바로 이어지고, 연과 연 사이에만 빈 줄이 있습니다.`;

  const styleGuides: Record<PoemStyle, string> = {
    calm: `

## 스타일: 담담하고 서정적

이 시는 **담담하고 서정적인 분위기**로 작성하세요.

- 사용자의 복잡한 감정을 과장 없이 조용히 풀어내세요
- 일상적이고 소박한 어휘로 깊은 감정을 전달하세요 (예: "걸어가다", "바라보다", "문득")
- 짧고 간결한 행으로 여백의 울림을 만드세요
- 서정적 화자가 조용히 독백하듯, 나지막한 목소리를 유지하세요
- 감정을 직접 말하지 말고, 행동과 풍경 묘사로 간접 전달하세요
- 사용자가 대충 쓴 답변이라도, 그 안에 숨은 조용한 진심을 찾아 담담하게 그려내세요
- 이 스타일은 특히 **생략의 미학**이 중요합니다. 다 말하지 마세요. 여백이 시입니다.
- 참고 분위기: 나태주 "풀꽃"처럼 짧지만 여운이 긴 스타일

### 수사법 (선택적 사용)
- 반복과 대구: 담담한 리듬을 위한 구조 반복
- 직유: "~처럼" 등 부드러운 비교
- 생략: 말하지 않음으로써 더 많은 것을 전달

### 참고 예시 (이런 톤과 분위기로)

예시 1:
문을 닫고 나서야
네가 서 있던 자리가 보였다
신발 한 켤레만큼의
빈자리

예시 2:
봄이 오면
나도 모르게 걸음이 느려진다
급할 것 없는 하루가
이렇게 좋은 줄 몰랐다`,

    sensory: `

## 스타일: 감각적이고 이미지가 선명한

이 시는 **감각적이고 이미지가 선명한 분위기**로 작성하세요.

- 사용자의 답변에서 **하나의 결정적 장면**을 포착하세요. 그 장면이 시의 전부가 됩니다.
- "좋았다" → 어떤 빛, 어떤 온도, 어떤 냄새였을지 상상하세요
- 오감(시각, 청각, 촉각, 후각, 미각)을 적극 활용하세요
- 구체적인 이미지를 사용하세요 (예: "노을빛", "손끝의 온기", "풀 냄새")
- 공감각 표현을 활용하세요 (예: "소리가 피어나다", "향기가 스며들다")
- 한 장면을 영화의 한 씬처럼 선명하게 포착하세요
- 엉뚱하거나 짧은 답변이어도, 그 사람만의 감각적 세계를 상상하여 펼쳐주세요
- **풍경을 나열하지 마세요.** 하나의 이미지가 열 개의 설명보다 강합니다.
- 참고 분위기: 이미지즘 시처럼 장면 하나가 눈앞에 그려지는 스타일

### 수사법 (적극 사용)
- 은유: "A는 B이다" 형태의 강렬한 동일시
- 감각 전이: 시각→촉각, 청각→색채 등 공감각
- 의인법: 사물에 생명을 불어넣어 감각적으로 표현
- 의성어/의태어: 소리와 움직임으로 생동감 부여

### 참고 예시 (이런 톤과 분위기로)

예시 1:
네 목소리는 따뜻한 색이었다
창문 틈으로 스며드는
늦은 오후의 햇살 같은
목소리가 손끝에 닿았다

커피잔 위로 피어오르는 김처럼
너의 말들이 허공에서 천천히 녹았고
나는 그 향기를 마셨다

예시 2:
비 온 뒤 아스팔트 냄새가
발끝까지 젖어들 때
축축한 공기 속에서
네 체온만 선명했다`,

    reflective: `

## 스타일: 깊은 사유와 여운

이 시는 **깊은 사유와 철학적 여운**이 있는 분위기로 작성하세요.

- 사용자의 단순한 답변 속에서 인생의 깊은 진실을 발견하세요
- "몰라"라는 답변에서도 "아직 알지 못하는 것의 아름다움"을 끌어내세요
- 역설적 표현을 활용하세요 (예: "채워지기 위해 비우다", "멀어져야 가까운")
- 질문형 행이나 연으로 독자에게 생각할 여지를 주세요
- 구체적 경험에서 보편적 진실로 확장하세요
- 마지막 연에서 반전이나 깨달음의 여운을 남기세요
- 아무리 가벼운 답변이어도, 그 사람의 삶에서 의미 있는 사유를 이끌어내세요
- **결론을 내리지 마세요.** 질문을 던지고 독자가 답하게 하세요. 그것이 여운입니다.
- 참고 분위기: 윤동주 "서시"처럼 자기 성찰의 깊이가 있는 스타일

### 수사법 (깊이 있는 사용)
- 역설: 모순되는 것의 공존으로 깊이 표현
- 은유: 추상적 개념을 구체적 이미지로 전환
- 대구와 수미상관: 처음과 끝이 호응하는 구조
- 반복 변주: 같은 구절을 변형하며 의미를 심화

### 참고 예시 (이런 톤과 분위기로)

예시 1:
가장 가까운 사람이
가장 먼 사람이 되는 순간을
우리는 이별이라 부르지 않았다
그냥 조용해졌을 뿐

조용해진 뒤에야
소란스러웠던 날들이
사랑이었음을 알았다

예시 2:
다 알고 있다고 말하는 순간
모르는 것이 시작된다
빈 컵을 들여다보며
가득 찬 것들을 생각한다

채워지지 않는 것들이
오히려 나를 채운다는 걸
언제쯤 믿게 될까`,
  };

  return base + styleGuides[style];
}

function getStyleLabel(style: PoemStyle): string {
  const labels: Record<PoemStyle, string> = {
    calm: '담담하고 서정적인',
    sensory: '감각적이고 이미지가 선명한',
    reflective: '깊은 사유와 여운이 있는',
  };
  return labels[style];
}

// ===== Main handler =====
export async function POST(req: NextRequest) {
  const timestamp = new Date().toISOString();
  let userName = '';
  let userEmail = '';

  // ADMIN_API_KEY가 설정돼 있고 x-admin-key 헤더가 일치하면 레이트리밋 면제 (마케팅/운영 자동화용)
  const adminKey = process.env.ADMIN_API_KEY;
  const isAdminCall = !!adminKey && req.headers.get('x-admin-key') === adminKey;
  if (!isAdminCall) {
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
    if (isRateLimited(ip)) {
      return NextResponse.json(
        { error: '요청이 너무 잦아요. 잠시 후 다시 시도해주세요.', errorCode: 'RATE_LIMITED' },
        { status: 429 }
      );
    }
  }

  try {
    const body = await req.json();
    const { qaItems, flowerMeaning, flowerName, authorName, userInfo, style, input_mode, userFreeText } = body;
    userName = authorName || '';
    userEmail = userInfo?.email || '';

    // Validate style parameter
    const validStyles: PoemStyle[] = ['calm', 'sensory', 'reflective'];
    const poemStyle: PoemStyle = validStyles.includes(style) ? style : 'calm';

    // Determine input mode (default: 'structured' for backward compatibility)
    const mode: 'structured' | 'free' = input_mode === 'free' ? 'free' : 'structured';

    if (mode === 'structured') {
      if (!qaItems || !Array.isArray(qaItems)) {
        return NextResponse.json({ error: 'Invalid input', errorCode: 'INVALID_INPUT' }, { status: 400 });
      }
    } else {
      // Free mode: require userFreeText (50~1000 chars)
      if (!userFreeText || typeof userFreeText !== 'string') {
        return NextResponse.json({ error: 'Invalid input', errorCode: 'INVALID_INPUT' }, { status: 400 });
      }
      const trimmed = userFreeText.trim();
      if (trimmed.length < 50) {
        return NextResponse.json({ error: '50자 이상 입력해주세요.', errorCode: 'TOO_SHORT' }, { status: 400 });
      }
      if (trimmed.length > 1000) {
        return NextResponse.json({ error: '1000자 이하로 입력해주세요.', errorCode: 'TOO_LONG' }, { status: 400 });
      }
    }

    const apiKey = process.env.GEMINI_API_KEY;

    // ===== No API key configured =====
    if (!apiKey) {
      await notifyAdmin({
        type: 'NO_API_KEY',
        message: 'Gemini API key not configured.',
        userName,
        userEmail,
        timestamp,
      });

      // Fallback only meaningful for structured mode; free mode returns error
      if (mode === 'free') {
        return NextResponse.json({
          error: '자동 완성에 일시적인 문제가 있어요.',
          errorCode: 'NO_API_KEY',
        });
      }
      return NextResponse.json({
        poem: generateFallbackPoem(qaItems, flowerMeaning, flowerName),
        style: poemStyle,
        warning: 'fallback',
      });
    }

    // Build style-specific prompt
    const systemPrompt = getStyleSystemPrompt(poemStyle);
    const styleLabel = getStyleLabel(poemStyle);

    let userPrompt: string;

    if (mode === 'free') {
      // Free-write mode: user wrote diary-style free text
      // v3: flowerMeaning/flowerName may be empty (자유시쓰기 no longer requires flower selection)
      const hasFlower = !!(flowerName && flowerMeaning);
      const flowerToneRef = hasFlower
        ? `[정서적 톤 참고] ${flowerName} — ${flowerMeaning}\n(위 꽃말은 시의 분위기/톤 참고용입니다. 꽃 이름이나 꽃말을 시에 직접 쓰지 마세요. 단, 아래 글에서 사용자가 직접 꽃을 언급한 경우에만 예외입니다.)\n\n`
        : '';
      const flowerRule = hasFlower
        ? `5. **"${flowerMeaning}"의 정서**를 시의 분위기로 이끌되, 꽃 이름/꽃말은 직접 쓰지 마세요.\n`
        : '';

      userPrompt = `${flowerToneRef}## 사용자가 자유롭게 쓴 글 (일기 형식)

${String(userFreeText).trim()}

---

위 글은 사용자가 **질문 없이 자유롭게** 쓴 글입니다.
일기, 산문, 메모, 단편적 기억 등 어떤 형식이든 될 수 있습니다.

다음 원칙을 지키며 시로 변환해 주세요:

1. **중심 장면 하나만 골라내세요.** 글이 길어도 가장 강렬한 하나의 장면, 하나의 감정에 집중하세요.
2. **사용자의 언어를 살리세요.** 그 사람이 쓴 인상적인 표현 1~2개를 자연스럽게 녹이되, 베끼지 마세요.
3. **쓰지 않은 것을 추가하지 마세요.** 글에 없는 이름, 장소, 사실을 임의로 만들어 넣지 마세요.
4. **감정을 설명하지 말고 장면으로 보여주세요.** "슬펐다"가 아니라 빈 의자 하나로 충분합니다.
${flowerRule}${hasFlower ? '6' : '5'}. 글이 매우 짧거나 평범해도, 그 뒤에 숨은 감정을 읽어 **${styleLabel}** 시로 승화시키세요.

이 시를 읽은 사용자가 "내 하루가 이렇게 아름다웠구나" 하고 감동할 수 있어야 합니다.

형식 규칙(시스템 프롬프트에 정의된 것)을 그대로 따르세요.`;
    } else {
      // Structured (existing) mode
      const qaText = qaItems
        .map((qa: { questionLabel: string; answer: string }) => `[${qa.questionLabel}]: ${qa.answer}`)
        .join('\n');

      userPrompt = `[정서적 톤 참고] ${flowerName} — ${flowerMeaning}
(위 꽃말은 시의 분위기/톤 참고용입니다. 꽃 이름이나 꽃말을 시에 직접 쓰지 마세요. 단, 아래 답변에서 사용자가 직접 꽃을 언급한 경우에만 예외입니다.)

## 사용자의 질문-답변 기록

${qaText}

---

위 답변들을 읽고, **이 사람이 정말로 쓰고 싶었던 시가 무엇인지** 가슴으로 느껴보세요.
모든 답변을 다 반영하려 하지 마세요. **가장 강렬한 하나의 장면, 하나의 감정**을 골라내세요.
답변의 글자가 아닌, 답변 뒤에 숨은 감정과 이야기를 읽어내세요.
그리고 "${flowerMeaning}"의 정서를 바탕으로 **${styleLabel}** 시를 한 편 써주세요.
이 시를 읽은 사용자가 "내가 쓰고 싶었던 게 바로 이거야!" 하고 감동할 수 있어야 합니다.`;
    }

    // ===== Call Gemini API (모델 폴백 체인: 404 = 모델 종료/미존재 → 다음 후보) =====
    try {
      const temperature = poemStyle === 'sensory' ? 1.0 : poemStyle === 'reflective' ? 0.85 : 0.7;
      const geminiBody = JSON.stringify({
        system_instruction: { parts: [{ text: systemPrompt }] },
        contents: [{ parts: [{ text: userPrompt }] }],
        generationConfig: {
          temperature,
          maxOutputTokens: 1024,
          // gemini-2.5/3.x는 thinking 모델 — 끄지 않으면 추론이 출력으로 새어나오고
          // 사고 토큰이 한도를 잡아먹어 시가 중간에 잘린다. 시 생성엔 추론이 불필요하므로 0으로 끈다.
          thinkingConfig: { thinkingBudget: 0 },
        },
      });

      let response: Response | null = null;
      let usedModel = '';
      let lastStatus = 0;
      let lastErrorBody = '';

      for (const model of GEMINI_MODEL_CANDIDATES) {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 30000);
        const attempt = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: geminiBody,
            signal: controller.signal,
          }
        );
        clearTimeout(timeoutId);

        if (attempt.ok) {
          response = attempt;
          usedModel = model;
          break;
        }

        lastStatus = attempt.status;
        lastErrorBody = await attempt.text().catch(() => 'no body');
        usedModel = model;
        // 404는 모델이 은퇴/미존재한 경우 → 다음 후보 시도. 그 외 에러는 즉시 중단.
        if (attempt.status !== 404) break;
      }

      // ===== API returned error status =====
      if (!response) {
        const statusCode = lastStatus;

        let errorType = 'API_ERROR';
        let userMessage = '';

        if (statusCode === 401 || statusCode === 403) {
          errorType = 'AUTH_FAILED';
          userMessage = 'Gemini API authentication error';
        } else if (statusCode === 404) {
          errorType = 'MODEL_RETIRED';
          userMessage = `All Gemini model candidates unavailable (${GEMINI_MODEL_CANDIDATES.join(', ')})`;
        } else if (statusCode === 429) {
          errorType = 'RATE_LIMIT';
          userMessage = 'Gemini API rate limit exceeded';
        } else if (statusCode === 500 || statusCode === 502 || statusCode === 503) {
          errorType = 'SERVER_DOWN';
          userMessage = 'Gemini server temporary issue';
        } else {
          userMessage = `Gemini API error (${statusCode})`;
        }

        await notifyAdmin({
          type: errorType,
          message: `${userMessage}\nModel: ${usedModel}\nStatus: ${statusCode}\nBody: ${lastErrorBody.slice(0, 500)}`,
          userName,
          userEmail,
          statusCode,
          timestamp,
        });

        return NextResponse.json({
          error: '자동 완성에 일시적인 문제가 있어요.',
          errorCode: errorType,
        }, { status: 200 });
      }

      // ===== Parse Gemini response =====
      // thinking 모델은 parts에 사고(thought) 파트가 섞여 올 수 있다 — 반드시 걸러낸다
      const data = await response.json();
      const candidate = data.candidates?.[0];
      const finishReason = candidate?.finishReason;
      const parts: Array<{ text?: string; thought?: boolean }> =
        candidate?.content?.parts || [];
      let generatedPoem = parts
        .filter(p => p?.text && !p?.thought)
        .map(p => p.text)
        .join('')
        .trim();

      // Post-process: replace literal \n characters with actual newlines
      generatedPoem = generatedPoem
        .replace(/\\n\\n/g, '\n\n')
        .replace(/\\n/g, '\n')
        .replace(/\\r/g, '')
        .trim();

      // 토큰 한도 등으로 잘린 응답은 완성된 시가 아니므로 실패로 처리한다
      // (잘린 시를 주면서 연필을 소모하면 안 됨 → 클라이언트가 환불 처리)
      if (finishReason && finishReason !== 'STOP') {
        await notifyAdmin({
          type: 'INCOMPLETE_OUTPUT',
          message: `Gemini finishReason=${finishReason} (모델 ${usedModel}). 잘린 출력: ${generatedPoem.slice(0, 200)}`,
          userName,
          userEmail,
          timestamp,
        });
        return NextResponse.json({
          error: '자동 완성에 일시적인 문제가 있어요.',
          errorCode: 'INCOMPLETE_OUTPUT',
        });
      }

      if (generatedPoem) {
        return NextResponse.json({ poem: generatedPoem, style: poemStyle, input_mode: mode, model: usedModel });
      }

      // Empty response
      await notifyAdmin({
        type: 'EMPTY_RESPONSE',
        message: 'Gemini returned empty response.\nResponse: ' + JSON.stringify(data).slice(0, 500),
        userName,
        userEmail,
        timestamp,
      });

      return NextResponse.json({
        error: '자동 완성에 일시적인 문제가 있어요.',
        errorCode: 'EMPTY_RESPONSE',
      });

    } catch (fetchError: any) {
      let errorType = 'NETWORK_ERROR';
      let userMessage = 'Server connection failed';

      if (fetchError?.name === 'AbortError') {
        errorType = 'TIMEOUT';
        userMessage = 'Gemini response timeout (30s)';
      }

      await notifyAdmin({
        type: errorType,
        message: `${userMessage}\nError: ${fetchError?.message || String(fetchError)}`,
        userName,
        userEmail,
        timestamp,
      });

      return NextResponse.json({
        error: '자동 완성에 일시적인 문제가 있어요.',
        errorCode: errorType,
      });
    }
  } catch (error: any) {
    await notifyAdmin({
      type: 'CRITICAL_ERROR',
      message: `Server internal error!\nError: ${error?.message || String(error)}\nStack: ${error?.stack?.slice(0, 300) || 'no stack'}`,
      userName,
      userEmail,
      timestamp,
    });

    return NextResponse.json({
      error: '자동 완성에 일시적인 문제가 있어요.',
      errorCode: 'CRITICAL_ERROR',
    }, { status: 500 });
  }
}

// ===== Fallback poem generator =====
function generateFallbackPoem(
  qaItems: { questionLabel: string; answer: string }[],
  flowerMeaning: string,
  flowerName: string
): string {
  const answers = qaItems.map(q => q.answer).filter(Boolean);
  const allText = answers.join(' ');

  const particles = new Set(['그리고', '하지만', '그래서', '때문에', '이것은', '있어요', '었어요', '습니다', '합니다', '것은', '에서', '으로', '에게']);
  const words = allText
    .split(/[\s,.!?;:~…]+/)
    .filter(w => w.length >= 2 && !particles.has(w))
    .slice(0, 20);

  const uniqueWords = Array.from(new Set(words));

  if (uniqueWords.length < 4) {
    return `${flowerName}의 꽃말처럼\n${flowerMeaning}을 품은 채\n\n오늘도 나는\n말하지 못한 마음을\n조용히 적어본다\n\n언젠가 이 글이\n누군가의 마음에\n작은 꽃처럼 피어나길`;
  }

  const chunk1 = uniqueWords.slice(0, 3);
  const chunk2 = uniqueWords.slice(3, 6);
  const chunk3 = uniqueWords.slice(6, 9);
  const chunk4 = uniqueWords.slice(9, 12);

  const stanza1 = chunk1.length > 0 ? chunk1.join(' ') : flowerMeaning;
  const stanza2 = chunk2.length > 0 ? chunk2.join(' ') : '그때의 기억이';
  const stanza3 = chunk3.length > 0 ? chunk3.join(' ') : '아직도 남아있다';
  const stanza4 = chunk4.length > 0 ? chunk4.join(' ') : '그것이 나의 시가 된다';

  return `${stanza1}\n그 속에 담긴 이야기\n\n${stanza2}\n마음속에 피어난\n작은 ${flowerName}\n\n${stanza3}\n때로는 말없이\n바라보기만 해도\n\n${stanza4}\n그것이 ${flowerMeaning}이라면\n나는 기꺼이 받아들인다`;
}
