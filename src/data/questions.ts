// Part A: 꽃말 기반 질문 데이터
export interface QuestionSet {
  flowerId: string;
  start: QuestionItem[];
  middle: QuestionItem[];
  end: QuestionItem[];
}

export interface QuestionItem {
  id: string;
  text: string;
  label: string; // 대표단어 - keyword shown in B part review
}

export interface SurpriseQuestion {
  id: string;
  category: string;
  questions: QuestionItem[];
}

// A-1: 풍선초 - 어린 시절의 재미
const balloonFlowerQuestions: QuestionSet = {
  flowerId: 'balloon-flower',
  start: [
    { id: 'a1-s1', text: '[작성자]님의 어린 시절을 떠올려주세요! 가장 재미있던 일은 무엇인가요?', label: '재미있던 일' },
    { id: 'a1-s2', text: '그게 왜 가장 재미있었어요?', label: '재미의 이유' },
    { id: 'a1-s3', text: '지금 다시 한다면 어떤 기분이 들까요?', label: '지금의 기분' },
  ],
  middle: [
    { id: 'a1-m1', text: '그 재밌었던걸 왜 지금은 안하게 되었나요? 이유가 있을까요?', label: '멈춘 이유' },
    { id: 'a1-m2', text: '어렸을 때는 싫어했지만 커서 재밌다고 느낀건 뭐가 있을까요?', label: '변한 재미' },
    { id: 'a1-m3', text: '아니면 어렸을때도, 지금도 재미있어 하는게 있나요?', label: '변하지 않는 재미' },
  ],
  end: [
    { id: 'a1-e1', text: '어릴적과 비교해서 재미라는 것 자체는 어떻게 변했나요? 예전과 재미에 대해서 받아들이는 방법 달라졌나요? 혹은 재미있는 대상이 바뀌거나, 재미를 추구할 때 필요한 것이 바뀌는가요?', label: '재미의 변화' },
    { id: 'a1-e2', text: '모든걸 통틀어 재미란 무엇일까요? 설명해주셔도 좋고, 비유해주셔도 좋아요.', label: '재미란' },
  ],
};

// A-2: 라일락 - 젊은 날의 추억
const lilacQuestions: QuestionSet = {
  flowerId: 'lilac',
  start: [
    { id: 'a2-s1', text: '[작성자]님의 가장 소중한 추억은 무엇인가요?', label: '소중한 추억' },
    { id: 'a2-s2', text: '[작성자]님이 요즘 하고 있는 일 중에, 나중에 돌아보면 큰 추억이 될 만한 일은 무엇이 있을까요?', label: '미래의 추억' },
    { id: 'a2-s3', text: '왜 그게 큰 추억이 되리라 생각하세요?', label: '추억의 이유' },
  ],
  middle: [
    { id: 'a2-m1', text: '[작성자]님은 추억을 회상하면 어떤 기분이 드세요?', label: '회상의 기분' },
    { id: 'a2-m2', text: '왜 그런 기분이 드셨을까요?', label: '기분의 이유' },
  ],
  end: [
    { id: 'a2-e1', text: '추억을 되돌아보는건 참 아름다운 일이죠? 같이 추억을 산책하며 어떤 기분이 드셨어요?', label: '추억 산책' },
    { id: 'a2-e2', text: '그런 기분이 든 이유는 왜 일까요?', label: '산책의 여운' },
  ],
};

// A-3: 개나리 - 희망
const forsythiaQuestions: QuestionSet = {
  flowerId: 'forsythia',
  start: [
    { id: 'a3-s1', text: '[작성자]님은 최근 힘들었던 일이 있나요?', label: '힘든 일' },
    { id: 'a3-s2', text: '우리는 왜 그런 일은 포기할 수 없을까요?', label: '포기할 수 없는 이유' },
  ],
  middle: [
    { id: 'a3-m1', text: '과거에도 힘든 일이 있었나요?', label: '과거의 어려움' },
    { id: 'a3-m2', text: '과거의 힘든 일은 [작성자]님께 어떤 의미로 남았나요?', label: '과거의 의미' },
    { id: 'a3-m3', text: '힘든 일은 언젠가 극복하리라 믿나요?', label: '극복의 믿음' },
    { id: 'a3-m4', text: '[작성자]님이 힘든 일에 둘러싸여 있을 때, 가장 희망이 되는 존재는 무엇인가요?', label: '희망의 존재' },
  ],
  end: [
    { id: 'a3-e1', text: '희망이란 무엇이라고 생각하세요?', label: '희망이란' },
    { id: 'a3-e2', text: '우리가 힘든 일이 있을 때, 희망을 계속 좇아야 한다고 생각하시나요? 혹은 희망을 버려야 한다고 생각하시나요?', label: '희망의 선택' },
  ],
};

// A-4: 채송화 - 천진난만
const portulacaQuestions: QuestionSet = {
  flowerId: 'portulaca',
  start: [
    { id: 'a4-s1', text: '사람에게 거짓말이나 꾸밈이 필요하다고 생각하시나요?', label: '꾸밈의 필요' },
    { id: 'a4-s2', text: '왜 그렇게 생각하세요?', label: '생각의 이유' },
  ],
  middle: [
    { id: 'a4-m1', text: '있는 그대로 아름다운 것엔 무엇이 있을까요?', label: '있는 그대로' },
    { id: 'a4-m2', text: '왜 그 대상은 아름답나요?', label: '아름다움의 이유' },
    { id: 'a4-m3', text: '함께 있으면 어떤 기분이 드세요?', label: '함께하는 기분' },
  ],
  end: [
    { id: 'a4-e1', text: '꾸밈 없이도 아름다운 대상에 대해 [작성자]님이 느끼는 감정은 어떤가요?', label: '꾸밈없는 아름다움' },
    { id: 'a4-e2', text: '있는 그대로 아름다운 천진난만함, 과연 우리도 가질 수 있는 것일까요? 혹은 가질 필요조차 없는 것일까요?', label: '천진난만이란' },
  ],
};

// A-5: 장미 - 사랑
const roseQuestions: QuestionSet = {
  flowerId: 'rose',
  start: [
    { id: 'a5-s1', text: '[작성자]님이 가장 사랑하는 대상은 무엇인가요?', label: '사랑하는 대상' },
    { id: 'a5-s2', text: '그 사랑은 어떤 종류의 사랑인가요?', label: '사랑의 종류' },
  ],
  middle: [
    { id: 'a5-m1', text: '다른 종류의 사랑은 무엇이 있을까요?', label: '다른 사랑' },
    { id: 'a5-m2', text: '그런 종류의 사랑과 [작성자]님이 가장 사랑하는 대상에 대한 사랑의 차이는 무엇이에요?', label: '사랑의 차이' },
  ],
  end: [
    { id: 'a5-e1', text: '사랑은 우리에게 어떤 의미일까요?', label: '사랑의 의미' },
    { id: 'a5-e2', text: '긍정적인 의미일까요, 부정적인 의미일까요?', label: '사랑의 빛과 그림자' },
    { id: 'a5-e3', text: '왜 그렇게 생각하셨죠?', label: '생각의 이유' },
    { id: 'a5-e4', text: '[작성자]님이 가장 바라는 사랑은 무엇인가요? 현재 그것과 일치하는 사랑을 하고 계신가요?', label: '바라는 사랑' },
  ],
};

// A-6: 꽃잔디 - 희생
const mossPhloxQuestions: QuestionSet = {
  flowerId: 'moss-phlox',
  start: [
    { id: 'a6-s1', text: '주변에 남을 위해 묵묵히 희생하는 사람 또는 물건이 있나요?', label: '희생하는 존재' },
    { id: 'a6-s2', text: '그 대상은 어떤 희생을 했나요?', label: '희생의 내용' },
    { id: 'a6-s3', text: '비슷한 희생을 하는 다른 대상이 있을까요?', label: '비슷한 희생' },
  ],
  middle: [
    { id: 'a6-m1', text: '희생하는 대상에게 하고 싶은 말이 있나요?', label: '전하고 싶은 말' },
    { id: 'a6-m2', text: '그 말은 어떻게 전할 수 있을까요? 쉽게 전할 수 있나요?', label: '전하는 방법' },
  ],
  end: [
    { id: 'a6-e1', text: '희생은 무엇이라고 생각하나요?', label: '희생이란' },
    { id: 'a6-e2', text: '대상의 희생은 어떤 의미를 가질까요?', label: '희생의 의미' },
  ],
};

// 돌발 질문 (Surprise Questions)
export const surpriseQuestions: SurpriseQuestion[] = [
  {
    id: 'surprise-1',
    category: '비유_1',
    questions: [
      { id: 'sq1-1', text: '대상과 비슷한 것에는 무엇이 있나요? 대상 자체와 비슷해도 좋고, 내가 느끼는 감정이 비슷해도 좋아요.', label: '비슷한 것' },
      { id: 'sq1-2', text: '비슷하다고 느끼는 이유는 뭘까요?', label: '비슷한 이유' },
      { id: 'sq1-3', text: '그렇다면 둘의 차이점은 뭐가 있을까요?', label: '차이점' },
    ],
  },
  {
    id: 'surprise-2',
    category: '비유_2',
    questions: [
      { id: 'sq2-1', text: '대상을 어떤 것에 비유할 수 있을까요?', label: '비유' },
      { id: 'sq2-2', text: '그렇게 생각하신 이유는 뭐에요?', label: '비유의 이유' },
    ],
  },
  {
    id: 'surprise-3',
    category: '시각-색',
    questions: [
      { id: 'sq3-1', text: '대상, 혹은 대상과 관계된 것을 생각하면 어떤 색깔이 떠오르세요?', label: '떠오르는 색' },
      { id: 'sq3-2', text: '같은 색을 공유하는 것은 무엇이 있을까요?', label: '같은 색' },
    ],
  },
  {
    id: 'surprise-4',
    category: '촉각',
    questions: [
      { id: 'sq4-1', text: '대상에 대해 촉각적인 느낌은 어떨까요? 완전히 상상으로 적어도 됩니다. 예시: 저는 어릴 시절의 추억이 부드럽다고 생각하며, 자신이 없는 시험을 칠 때는 눅눅한 느낌이 들었어요.', label: '촉감' },
      { id: 'sq4-2', text: '왜 그런 촉감이 떠오르셨어요?', label: '촉감의 이유' },
      { id: 'sq4-3', text: '그런 촉감을 공유하는 것은 무엇이 있을까요?', label: '같은 촉감' },
      { id: 'sq4-4', text: '반대되는 촉감을 하나 떠올려주세요! 그리고 그런 촉감을 가지는 대상은 무엇이 있을까요?', label: '반대 촉감' },
      { id: 'sq4-5', text: '[작성자]님이 그 대상에 대해 가지고 있는 감정을 적어주세요.', label: '대상의 감정' },
    ],
  },
  {
    id: 'surprise-5',
    category: '연관짓기_1',
    questions: [
      { id: 'sq5-1', text: '대상을 떠올리면 자연스럽게 함께 떠오르는 것이 있나요?', label: '연상' },
      { id: 'sq5-2', text: '둘의 공통점은 무엇일까요?', label: '공통점' },
      { id: 'sq5-3', text: '그렇다면 둘의 차이점은 무엇일까요?', label: '차이점' },
      { id: 'sq5-4', text: '그 공통점이나 차이점을 공유하는 다른 대상이 더 있나요?', label: '또 다른 대상' },
    ],
  },
  {
    id: 'surprise-6',
    category: '연관짓기_2',
    questions: [
      { id: 'sq6-1', text: '대상을 떠올리면 떠오르는 날씨가 있나요?', label: '떠오르는 날씨' },
      { id: 'sq6-2', text: '왜 그런 날씨가 떠오를까요?', label: '날씨의 이유' },
      { id: 'sq6-3', text: '그 날씨! 하면 딱 떠오르는 무언가가 있나요?', label: '날씨의 연상' },
    ],
  },
  {
    id: 'surprise-7',
    category: '연관짓기_3',
    questions: [
      { id: 'sq7-1', text: '대상을 떠올릴 때면 어떤 기분이 드나요?', label: '떠오르는 기분' },
      { id: 'sq7-2', text: '최근에, 혹은 과거에, 비슷한 기분이 든 적이 있나요?', label: '비슷한 순간' },
      { id: 'sq7-3', text: '두 기분은 완전히 똑같나요? 차이점엔 뭐가 있을까요?', label: '기분의 차이' },
    ],
  },
];

export const allQuestionSets: QuestionSet[] = [
  balloonFlowerQuestions,
  lilacQuestions,
  forsythiaQuestions,
  portulacaQuestions,
  roseQuestions,
  mossPhloxQuestions,
];

export function getQuestionSetByFlowerId(flowerId: string): QuestionSet | undefined {
  return allQuestionSets.find(qs => qs.flowerId === flowerId);
}

// 질문 순서 생성 함수
// 시작 2개 → 돌발 2-4개 → 중간 2-4개 → 돌발 2-4개 → 끝 2개
export type QuestionPhase = 'start' | 'surprise1' | 'middle' | 'surprise2' | 'end';

export interface GeneratedQuestion {
  phase: QuestionPhase;
  question: QuestionItem;
  surpriseCategory?: string;
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function pickRandom<T>(arr: T[], count: number): T[] {
  return shuffle(arr).slice(0, count);
}

export function generateQuestionFlow(
  flowerId: string,
  length: 'short' | 'medium' | 'long' = 'medium'
): GeneratedQuestion[] {
  const qs = getQuestionSetByFlowerId(flowerId);
  if (!qs) return [];

  // Determine counts based on length
  const counts = {
    short: { start: 2, surprise: 2, middle: 2, end: 2 },
    medium: { start: 2, surprise: 3, middle: 3, end: 2 },
    long: { start: 3, surprise: 4, middle: 4, end: 2 },
  }[length];

  const flow: GeneratedQuestion[] = [];

  // Start questions
  const startQs = qs.start.slice(0, counts.start);
  startQs.forEach(q => flow.push({ phase: 'start', question: q }));

  // Surprise questions round 1
  const surpriseSets1 = pickRandom(surpriseQuestions, 2);
  let surpriseCount1 = 0;
  for (const ss of surpriseSets1) {
    for (const q of ss.questions) {
      if (surpriseCount1 >= counts.surprise) break;
      flow.push({ phase: 'surprise1', question: q, surpriseCategory: ss.category });
      surpriseCount1++;
    }
    if (surpriseCount1 >= counts.surprise) break;
  }

  // Middle questions
  const middleQs = shuffle(qs.middle).slice(0, counts.middle);
  middleQs.forEach(q => flow.push({ phase: 'middle', question: q }));

  // Surprise questions round 2 (pick different ones)
  const usedIds = new Set(surpriseSets1.map(s => s.id));
  const remaining = surpriseQuestions.filter(s => !usedIds.has(s.id));
  const surpriseSets2 = pickRandom(remaining, 2);
  let surpriseCount2 = 0;
  for (const ss of surpriseSets2) {
    for (const q of ss.questions) {
      if (surpriseCount2 >= counts.surprise) break;
      flow.push({ phase: 'surprise2', question: q, surpriseCategory: ss.category });
      surpriseCount2++;
    }
    if (surpriseCount2 >= counts.surprise) break;
  }

  // End questions
  const endQs = qs.end.slice(0, counts.end);
  endQs.forEach(q => flow.push({ phase: 'end', question: q }));

  return flow;
}
