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
    // 1) Internal API call to send admin email
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    await fetch(`${baseUrl}/api/notify-admin`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(errorInfo),
    }).catch(() => {}); // fire-and-forget, don't block user

    // 2) Always log to server console
    console.error(`[ADMIN ALERT] ${errorInfo.type}: ${errorInfo.message}`, {
      user: errorInfo.userName || 'unknown',
      status: errorInfo.statusCode,
      time: errorInfo.timestamp,
    });
  } catch {
    // notification itself failed — just log
    console.error('[ADMIN ALERT FAILED]', errorInfo);
  }
}

// ===== Main handler =====
export async function POST(req: NextRequest) {
  const timestamp = new Date().toISOString();
  let userName = '';
  let userEmail = '';

  try {
    const body = await req.json();
    const { qaItems, flowerMeaning, flowerName, authorName, userInfo, count } = body;
    userName = authorName || '';
    userEmail = userInfo?.email || '';
    const poemCount = Math.min(Math.max(count || 1, 1), 5); // 1~5 variations

    if (!qaItems || !Array.isArray(qaItems)) {
      return NextResponse.json({ error: 'Invalid input', errorCode: 'INVALID_INPUT' }, { status: 400 });
    }

    const apiKey = process.env.OPENAI_API_KEY;
    const baseUrl = process.env.OPENAI_BASE_URL || 'https://www.genspark.ai/api/llm_proxy/v1';

    // ===== No API key configured =====
    if (!apiKey) {
      await notifyAdmin({
        type: 'NO_API_KEY',
        message: 'OpenAI API 키가 설정되지 않았습니다. 환경변수를 확인하세요.',
        userName,
        userEmail,
        timestamp,
      });

      if (poemCount > 1) {
        const poems = [];
        for (let i = 0; i < poemCount; i++) {
          poems.push(generateFallbackPoem(qaItems, flowerMeaning, flowerName));
        }
        return NextResponse.json({ poems, warning: 'fallback' });
      }
      return NextResponse.json({
        poem: generateFallbackPoem(qaItems, flowerMeaning, flowerName),
        warning: 'fallback',
      });
    }

    // Build prompt
    const qaText = qaItems
      .map((qa: { questionLabel: string; answer: string }) => `[${qa.questionLabel}]: ${qa.answer}`)
      .join('\n');

    const systemPrompt = poemCount > 1
      ? `당신은 한국 현대시를 쓰는 감성적인 시인입니다.
사용자가 제공한 질문-답변 데이터를 바탕으로 아름다운 한국어 시를 ${poemCount}편 작성해주세요.

규칙:
1. 각 시는 3~5연으로 구성하세요
2. 각 연은 2~4행으로 구성하세요
3. 연과 연 사이는 빈 줄로 구분하세요
4. 사용자의 답변에 담긴 감정과 이야기를 시적으로 표현하세요
5. 은유, 비유, 의인법 등 다양한 수사법을 자연스럽게 사용하세요
6. 마지막 연은 여운이 남도록 마무리하세요
7. 각 시는 서로 다른 분위기나 표현 방식을 사용하세요
8. 시와 시 사이는 반드시 "---" 구분선으로 분리하세요
9. 시만 출력하고, 제목, 번호, 설명은 절대 포함하지 마세요`
      : `당신은 한국 현대시를 쓰는 감성적인 시인입니다. 
사용자가 제공한 질문-답변 데이터를 바탕으로 아름다운 한국어 시를 작성해주세요.

규칙:
1. 시는 3~5연으로 구성하세요
2. 각 연은 2~4행으로 구성하세요
3. 연과 연 사이는 빈 줄로 구분하세요
4. 사용자의 답변에 담긴 감정과 이야기를 시적으로 표현하세요
5. 은유, 비유, 의인법 등 다양한 수사법을 자연스럽게 사용하세요
6. 마지막 연은 여운이 남도록 마무리하세요
7. 시만 출력하고, 제목이나 설명은 포함하지 마세요`;

    const userPrompt = poemCount > 1
      ? `꽃: ${flowerName} (꽃말: ${flowerMeaning})
작성자: ${authorName}

질문과 답변:
${qaText}

위 내용을 바탕으로 서로 다른 분위기의 시를 ${poemCount}편 써주세요. 각 시는 "---"로 구분해주세요.`
      : `꽃: ${flowerName} (꽃말: ${flowerMeaning})
작성자: ${authorName}

질문과 답변:
${qaText}

위 내용을 바탕으로 시를 써주세요.`;

    // ===== Call OpenAI =====
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout

      const response = await fetch(`${baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt },
          ],
          temperature: poemCount > 1 ? 0.9 : 0.8,
          max_tokens: poemCount > 1 ? 1500 : 500,
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
          userMessage = 'API 인증 오류 — 키가 만료되었거나 잘못되었을 수 있습니다.';
        } else if (statusCode === 429) {
          errorType = 'RATE_LIMIT';
          userMessage = 'API 요청 한도 초과 — 잠시 후 다시 시도해주세요.';
        } else if (statusCode === 500 || statusCode === 502 || statusCode === 503) {
          errorType = 'SERVER_DOWN';
          userMessage = 'AI 서버에 일시적인 문제가 발생했습니다.';
        } else {
          userMessage = `API 오류 (${statusCode})`;
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
        }, { status: 200 }); // Return 200 so frontend can handle gracefully
      }

      // ===== Parse response =====
      const data = await response.json();
      const generatedPoem = data.choices?.[0]?.message?.content?.trim() || '';

      if (generatedPoem) {
        if (poemCount > 1) {
          // Split multiple poems by separator
          const poems = generatedPoem
            .split(/---+/)
            .map((p: string) => p.trim())
            .filter((p: string) => p.length > 10);
          if (poems.length > 0) {
            return NextResponse.json({ poems });
          }
          // Fallback: return as single poem
          return NextResponse.json({ poems: [generatedPoem] });
        }
        return NextResponse.json({ poem: generatedPoem });
      }

      // Empty response
      await notifyAdmin({
        type: 'EMPTY_RESPONSE',
        message: 'AI가 빈 응답을 반환했습니다.\nResponse: ' + JSON.stringify(data).slice(0, 500),
        userName,
        userEmail,
        timestamp,
      });

      return NextResponse.json({
        error: '자동 완성에 일시적인 문제가 있어요.',
        errorCode: 'EMPTY_RESPONSE',
      });

    } catch (fetchError: any) {
      // ===== Network / timeout errors =====
      let errorType = 'NETWORK_ERROR';
      let userMessage = '서버 연결에 실패했습니다.';

      if (fetchError?.name === 'AbortError') {
        errorType = 'TIMEOUT';
        userMessage = 'AI 응답 시간이 초과되었습니다. (15초)';
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
    // ===== Unexpected server error =====
    await notifyAdmin({
      type: 'CRITICAL_ERROR',
      message: `서버 내부 오류 발생!\nError: ${error?.message || String(error)}\nStack: ${error?.stack?.slice(0, 300) || 'no stack'}`,
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
