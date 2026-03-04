import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/supabase';

// POST /api/user/referral — apply a referral code (both users get 1 pencil)
export async function POST(req: NextRequest) {
  try {
    const supabase = createServerSupabase();
    if (!supabase) return NextResponse.json({ error: '서버 설정 오류입니다.' }, { status: 503 });

    const { userId, code } = await req.json();
    if (!userId || !code) {
      return NextResponse.json({ error: '필수 항목이 누락되었습니다.' }, { status: 400 });
    }

    const upperCode = code.trim().toUpperCase();

    // Get current user
    const { data: user } = await supabase
      .from('users')
      .select('id, referral_code, pencils, used_referral_codes')
      .eq('id', userId)
      .single();

    if (!user) return NextResponse.json({ error: '사용자를 찾을 수 없습니다.' }, { status: 404 });

    // Can't use own code
    if (user.referral_code === upperCode) {
      return NextResponse.json({ error: '자신의 추천 코드는 사용할 수 없어요.' }, { status: 400 });
    }

    // Already used this code
    const usedCodes: string[] = user.used_referral_codes || [];
    if (usedCodes.includes(upperCode)) {
      return NextResponse.json({ error: '이미 사용한 추천 코드입니다.' }, { status: 400 });
    }

    // Find the referrer by code
    const { data: referrer } = await supabase
      .from('users')
      .select('id, name, pencils')
      .eq('referral_code', upperCode)
      .single();

    if (!referrer) {
      return NextResponse.json({ error: '존재하지 않는 추천 코드입니다.' }, { status: 404 });
    }

    // Give 1 pencil to both
    const newUserPencils = (user.pencils || 0) + 1;
    const newReferrerPencils = (referrer.pencils || 0) + 1;

    // Update user: +1 pencil, add code to used list
    await supabase.from('users').update({
      pencils: newUserPencils,
      used_referral_codes: [...usedCodes, upperCode],
    }).eq('id', userId);

    // Update referrer: +1 pencil
    await supabase.from('users').update({
      pencils: newReferrerPencils,
    }).eq('id', referrer.id);

    // Notify the referrer
    await supabase.from('notifications').insert({
      user_id: referrer.id,
      type: 'achievement',
      message: `누군가 추천 코드를 입력했어요! ✏️ 연필 1자루를 받았습니다.`,
      is_read: false,
    });

    return NextResponse.json({
      success: true,
      pencils: newUserPencils,
      message: '추천 코드가 적용되었어요! 서로 연필 1자루씩 받았습니다.',
    });

  } catch (error) {
    console.error('Referral error:', error);
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 });
  }
}
