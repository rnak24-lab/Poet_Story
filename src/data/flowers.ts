// 꽃 데이터 - Flower data with meanings
export interface Flower {
  id: string;
  name: string;
  meaning: string;
  emoji: string;
  color: string;
  description: string;
  image: string; // emoji or url
}

export const flowers: Flower[] = [
  {
    id: 'balloon-flower',
    name: '풍선초',
    meaning: '어린 시절의 재미',
    emoji: '🎈',
    color: '#FF9AA2',
    description: '어린 시절의 순수한 재미와 즐거움을 담은 꽃입니다. 풍선처럼 부풀어 오르는 기쁨을 떠올리게 합니다.',
    image: '🎈',
  },
  {
    id: 'lilac',
    name: '라일락',
    meaning: '젊은 날의 추억',
    emoji: '💜',
    color: '#C3AED6',
    description: '봄바람에 흩날리는 라일락처럼, 젊은 날의 소중한 추억을 간직한 꽃입니다.',
    image: '💜',
  },
  {
    id: 'forsythia',
    name: '개나리',
    meaning: '희망',
    emoji: '💛',
    color: '#FFD93D',
    description: '봄의 시작을 알리는 개나리처럼, 어둠 속에서도 빛나는 희망을 상징합니다.',
    image: '💛',
  },
  {
    id: 'portulaca',
    name: '채송화',
    meaning: '천진난만',
    emoji: '🌸',
    color: '#FF6B6B',
    description: '작지만 알록달록 아름다운 채송화처럼, 꾸밈없는 천진난만함을 담고 있습니다.',
    image: '🌸',
  },
  {
    id: 'rose',
    name: '장미',
    meaning: '사랑',
    emoji: '🌹',
    color: '#E8505B',
    description: '가시가 있어도 아름다운 장미처럼, 사랑의 다양한 면을 품고 있는 꽃입니다.',
    image: '🌹',
  },
  {
    id: 'moss-phlox',
    name: '꽃잔디',
    meaning: '희생',
    emoji: '🌿',
    color: '#95E1D3',
    description: '땅을 덮으며 묵묵히 피어나는 꽃잔디처럼, 조용한 희생과 헌신을 상징합니다.',
    image: '🌿',
  },
];

export function getFlowerById(id: string): Flower | undefined {
  return flowers.find(f => f.id === id);
}
