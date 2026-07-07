// Shared achievement catalog.
//
// This is the single source of truth for achievement rewards, imported by
// BOTH the client store (src/store/useAppStore.ts) and the server-verified
// claim endpoint (src/app/api/user/achievements/claim/route.ts).
//
// SECURITY: the server reads the reward `count` from this table — never from
// the client request — so a caller cannot mint arbitrary pencils.

export interface Achievement {
  id: string;
  title: string;
  description: string;
  emoji: string;
  condition: string;
  reward?: { type: 'pencil'; count: number };
  unlockedAt?: string;
}

export const ALL_ACHIEVEMENTS: Achievement[] = [
  { id: 'first-poem', title: '첫 발자국', description: '첫 번째 시를 완성했어요', emoji: '🌱', condition: 'poems >= 1' },
  { id: 'three-poems', title: '꾸준한 시인', description: '시를 3편 완성했어요', emoji: '🌿', condition: 'poems >= 3' },
  { id: 'five-poems', title: '열정의 시인', description: '시를 5편 완성했어요', emoji: '🌳', condition: 'poems >= 5' },
  { id: 'ten-poems', title: '시의 숲', description: '시를 10편 완성했어요', emoji: '🏔️', condition: 'poems >= 10' },
  { id: 'first-like', title: '첫 공감', description: '처음으로 좋아요를 받았어요', emoji: '💕', condition: 'likes >= 1' },
  { id: 'ten-likes', title: '공감의 물결', description: '좋아요를 10개 받았어요', emoji: '🌊', condition: 'likes >= 10' },
  { id: 'fifty-likes', title: '마음을 울리다', description: '좋아요를 50개 받았어요', emoji: '🎵', condition: 'likes >= 50' },
  { id: 'all-flowers', title: '꽃 도감 완성', description: '모든 꽃으로 시를 써봤어요', emoji: '🌺', condition: 'flowers >= 6' },
  { id: 'ten-views', title: '작은 독자', description: '내 시를 10명이 읽었어요', emoji: '👀', condition: 'views >= 10' },
  { id: 'fifty-views', title: '떠오르는 시인', description: '내 시를 50명이 읽었어요', emoji: '⭐', condition: 'views >= 50' },
  { id: 'share-first', title: '나눔의 시작', description: '처음으로 시를 공유했어요', emoji: '🤝', condition: 'shares >= 1', reward: { type: 'pencil', count: 1 } },
  { id: 'auto-complete', title: '영감의 도움', description: '자동 완성 기능을 사용했어요', emoji: '✨', condition: 'auto >= 1' },
];

/** Server-side reward lookup: fixed pencil reward for an achievement id (0 if none). */
export function achievementReward(achievementId: string): number {
  const ach = ALL_ACHIEVEMENTS.find(a => a.id === achievementId);
  return ach?.reward?.type === 'pencil' ? ach.reward.count : 0;
}
