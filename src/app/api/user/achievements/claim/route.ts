import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/supabase';
import { getSessionUserId } from '@/lib/user-auth';
import { achievementReward, ALL_ACHIEVEMENTS } from '@/data/achievements';

// POST /api/user/achievements/claim
// 서버 검증 + 멱등(idempotent) 업적 보상 지급.
// - userId는 세션 쿠키에서만 도출 (body의 id 신뢰 안 함).
// - 보상량은 서버가 소유한 고정 테이블에서만 조회 (클라가 보낸 count 무시).
// - 이미 획득한 업적이면 재지급하지 않음 → 무한증식 불가.
export async function POST(req: NextRequest) {
  try {
    const supabase = createServerSupabase();
    if (!supabase) return NextResponse.json({ error: '서버 설정 오류입니다.' }, { status: 503 });

    const userId = getSessionUserId(req);
    if (!userId) return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 });
    // 환경변수 관리자는 DB 행이 없음 — 보상 대상 아님.
    if (userId === 'admin') return NextResponse.json({ success: true, granted: 0 });

    const { achievementId } = await req.json();
    if (!achievementId || typeof achievementId !== 'string') {
      return NextResponse.json({ error: '업적 정보가 필요합니다.' }, { status: 400 });
    }
    // 존재하는 업적만 허용.
    if (!ALL_ACHIEVEMENTS.some(a => a.id === achievementId)) {
      return NextResponse.json({ error: '존재하지 않는 업적입니다.' }, { status: 400 });
    }

    const { data: user } = await supabase
      .from('users')
      .select('achievements, pencils')
      .eq('id', userId)
      .single();
    if (!user) return NextResponse.json({ error: '사용자를 찾을 수 없습니다.' }, { status: 404 });

    const achievements: string[] = user.achievements || [];
    // 이미 획득 → 멱등 응답 (재지급 없음).
    if (achievements.includes(achievementId)) {
      return NextResponse.json({ success: true, alreadyClaimed: true, granted: 0, pencils: user.pencils ?? 0 });
    }

    // 업적 기록에 추가.
    await supabase
      .from('users')
      .update({ achievements: [...achievements, achievementId] })
      .eq('id', userId);

    // 서버 소유의 고정 보상만 원자적으로 지급.
    const reward = achievementReward(achievementId);
    let newPencils = user.pencils ?? 0;
    if (reward > 0) {
      const { data: bal } = await supabase.rpc('increment_pencils', { p_user_id: userId, p_delta: reward });
      if (typeof bal === 'number') newPencils = bal;
    }

    return NextResponse.json({ success: true, granted: reward, pencils: newPencils });
  } catch (error) {
    console.error('Achievement claim error:', error);
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 });
  }
}
