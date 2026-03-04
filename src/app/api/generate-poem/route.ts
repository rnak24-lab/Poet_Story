import { NextRequest, NextResponse } from 'next/server';

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

### 2. 꽃말을 시의 정서적 나침반으로
- 사용자의 답변이 아무리 엉뚱해도, 꽃말의 정서가 시 전체를 관통해야 합니다
- 꽃 이름을 직접 쓸 필요는 없지만, 꽃말이 담고 있는 감정의 색깔이 시에 스며들어야 합니다
- 답변이 부족할수록 꽃말에서 더 많은 영감을 끌어오세요

### 3. 답변의 핵심 단어는 살리되, 시적으로 승화
- 사용자가 쓴 인상적인 표현이나 키워드 2~3개를 시에 자연스럽게 녹이세요
- 하지만 답변을 "그대로 베끼는" 것은 절대 금지입니다
- 일상어를 시적 이미지로 변환하세요: "비가 와서 우울해" → "창밖의 빗소리가 / 내 안의 고요와 만나는 시간"

### 4. 질문 내용이 아닌 답변자의 서사를 따라가세요
- 질문 자체(예: "처음 만난 날을 떠올려보세요")의 내용이 시에 직접 반영되면 안 됩니다
- 대신 답변에서 드러나는 사용자의 이야기, 감정, 기억이 시의 서사가 되어야 합니다
- 시는 답변자가 "나도 이런 마음이었구나"하고 감동받을 수 있어야 합니다

### 5. 보편적 공감을 만드세요
- 이 시를 읽는 다른 사람도 공감할 수 있는 보편적 정서로 확장하세요
- 지나치게 개인적인 디테일(이름, 장소)은 추상화하여 누구나의 이야기가 되게 하세요

## 형식 규칙

- 3~5연으로 구성
- 각 연은 2~4행
- 연과 연 사이는 빈 줄 하나로 구분
- 마지막 연은 여운이 남도록 마무리
- 시만 출력 (제목, 번호, 설명, 따옴표 절대 금지)`;

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
- 참고 분위기: 나태주 "풀꽃"처럼 짧지만 여운이 긴 스타일

### 수사법 (선택적 사용)
- 반복과 대구: 담담한 리듬을 위한 구조 반복
- 직유: "~처럼" 등 부드러운 비교
- 생략: 말하지 않음으로써 더 많은 것을 전달`,

    sensory: `

## 스타일: 감각적이고 이미지가 선명한

이 시는 **감각적이고 이미지가 선명한 분위기**로 작성하세요.

- 사용자의 답변에서 장면과 감각을 끌어내세요. "좋았다" → 어떤 빛, 어떤 온도, 어떤 냄새였을지 상상하세요
- 오감(시각, 청각, 촉각, 후각, 미각)을 적극 활용하세요
- 구체적인 이미지를 사용하세요 (예: "노을빛", "손끝의 온기", "풀 냄새")
- 색채감 있는 표현을 사용하세요 (예: "보랏빛 저녁", "회색빛 골목")
- 공감각 표현을 활용하세요 (예: "소리가 피어나다", "향기가 스며들다")
- 한 장면을 영화의 한 씬처럼 선명하게 포착하세요
- 엉뚱하거나 짧은 답변이어도, 그 사람만의 감각적 세계를 상상하여 펼쳐주세요
- 참고 분위기: 이미지즘 시처럼 장면 하나가 눈앞에 그려지는 스타일

### 수사법 (적극 사용)
- 은유: "A는 B이다" 형태의 강렬한 동일시
- 감각 전이: 시각→촉각, 청각→색채 등 공감각
- 의인법: 사물에 생명을 불어넣어 감각적으로 표현
- 의성어/의태어: 소리와 움직임으로 생동감 부여`,

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
- 참고 분위기: 윤동주 "서시"처럼 자기 성찰의 깊이가 있는 스타일

### 수사법 (깊이 있는 사용)
- 역설: 모순되는 것의 공존으로 깊이 표현
- 은유: 추상적 개념을 구체적 이미지로 전환
- 대구와 수미상관: 처음과 끝이 호응하는 구조
- 반복 변주: 같은 구절을 변형하며 의미를 심화`,
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

  try {
    const body = await req.json();
    const { qaItems, flowerMeaning, flowerName, authorName, userInfo, style } = body;
    userName = authorName || '';
    userEmail = userInfo?.email || '';

    // Validate style parameter
    const validStyles: PoemStyle[] = ['calm', 'sensory', 'reflective'];
    const poemStyle: PoemStyle = validStyles.includes(style) ? style : 'calm';

    if (!qaItems || !Array.isArray(qaItems)) {
      return NextResponse.json({ error: 'Invalid input', errorCode: 'INVALID_INPUT' }, { status: 400 });
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

      return NextResponse.json({
        poem: generateFallbackPoem(qaItems, flowerMeaning, flowerName),
        style: poemStyle,
        warning: 'fallback',
      });
    }

    // Build QA text
    const qaText = qaItems
      .map((qa: { questionLabel: string; answer: string }) => `[${qa.questionLabel}]: ${qa.answer}`)
      .join('\n');

    // Build style-specific prompt
    const systemPrompt = getStyleSystemPrompt(poemStyle);
    const styleLabel = getStyleLabel(poemStyle);

    const userPrompt = `꽃: ${flowerName} (꽃말: ${flowerMeaning})

## 사용자의 질문-답변 기록

${qaText}

---

위 답변들을 읽고, **이 사람이 정말로 쓰고 싶었던 시가 무엇인지** 가슴으로 느껴보세요.
답변의 글자가 아닌, 답변 뒤에 숨은 감정과 이야기를 읽어내세요.
그리고 꽃말 "${flowerMeaning}"의 정서를 바탕으로 **${styleLabel}** 시를 한 편 써주세요.
이 시를 읽은 사용자가 "내가 쓰고 싶었던 게 바로 이거야!" 하고 감동할 수 있어야 합니다.`;

    // ===== Call Gemini API =====
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000);

      const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;
      const temperature = poemStyle === 'sensory' ? 0.9 : poemStyle === 'reflective' ? 0.85 : 0.8;

      const response = await fetch(geminiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          system_instruction: { parts: [{ text: systemPrompt }] },
          contents: [{ parts: [{ text: userPrompt }] }],
          generationConfig: {
            temperature,
            maxOutputTokens: 600,
          },
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      // ===== API returned error status =====
      if (!response.ok) {
        const errorBody = await response.text().catch(() => 'no body');
        const statusCode = response.status;

        let errorType = 'API_ERROR';
        let userMessage = '';

        if (statusCode === 401 || statusCode === 403) {
          errorType = 'AUTH_FAILED';
          userMessage = 'Gemini API authentication error';
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
          message: `${userMessage}\nStatus: ${statusCode}\nBody: ${errorBody.slice(0, 500)}`,
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
      const data = await response.json();
      const generatedPoem = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || '';

      if (generatedPoem) {
        return NextResponse.json({ poem: generatedPoem, style: poemStyle });
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
