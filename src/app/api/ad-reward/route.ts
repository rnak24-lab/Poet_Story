import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/supabase';

const MAX_ADS_PER_DAY = 5;

export async function POST(req: NextRequest) {
  try {
    const { userId } = await req.json();
    if (!userId) {
      return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 });
    }

    const supabase = createServerSupabase();
    if (!supabase) {
      // DB not connected - return success for local-only mode
      return NextResponse.json({ success: true, pencils: 1, remaining: MAX_ADS_PER_DAY - 1, localOnly: true });
    }

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const { count } = await supabase
      .from('ad_rewards')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .gte('created_at', todayStart.toISOString());

    if ((count || 0) >= MAX_ADS_PER_DAY) {
      return NextResponse.json({
        error: `오늘 광고 시청 한도(${MAX_ADS_PER_DAY}회)에 도달했어요. 내일 다시 시도해주세요!`,
        remaining: 0,
      }, { status: 429 });
    }

    await supabase.from('ad_rewards').insert({
      user_id: userId,
      ad_type: 'rewarded',
      pencils_earned: 1,
    });

    const { data: user } = await supabase
      .from('users')
      .select('pencils')
      .eq('id', userId)
      .single();

    const newPencils = (user?.pencils || 0) + 1;
    await supabase
      .from('users')
      .update({ pencils: newPencils })
      .eq('id', userId);

    return NextResponse.json({
      success: true,
      pencils: newPencils,
      remaining: MAX_ADS_PER_DAY - ((count || 0) + 1),
    });

  } catch (error) {
    console.error('Ad reward error:', error);
    return NextResponse.json({ error: '보상 지급 중 오류가 발생했습니다.' }, { status: 500 });
  }
}
