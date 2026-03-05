import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

// POST /api/user/recover — 탈퇴 철회 (15일 이내)
export async function POST(req: NextRequest) {
  try {
    const { userId } = await req.json();
    if (!userId) {
      return NextResponse.json({ error: '사용자 정보가 필요합니다.' }, { status: 400 });
    }

    const supabase = createServerSupabase();
    if (!supabase) {
      return NextResponse.json({ error: '서버 설정 오류입니다.' }, { status: 503 });
    }

    // Check user exists and has pending withdrawal
    const { data: user, error: fetchError } = await supabase
      .from('users')
      .select('id, name, withdrawal_requested_at')
      .eq('id', userId)
      .single();

    if (fetchError || !user) {
      return NextResponse.json({ error: '사용자를 찾을 수 없습니다.' }, { status: 404 });
    }

    if (!user.withdrawal_requested_at) {
      return NextResponse.json({ error: '탈퇴 요청이 없는 계정입니다.' }, { status: 400 });
    }

    // Check if 15 days have passed
    const requestedAt = new Date(user.withdrawal_requested_at);
    const now = new Date();
    const daysPassed = Math.floor((now.getTime() - requestedAt.getTime()) / (1000 * 60 * 60 * 24));

    if (daysPassed >= 15) {
      return NextResponse.json({ error: '탈퇴 유예 기간(15일)이 지나 복구할 수 없습니다.' }, { status: 400 });
    }

    // Clear withdrawal request
    const { error: updateError } = await supabase
      .from('users')
      .update({ withdrawal_requested_at: null })
      .eq('id', userId);

    if (updateError) {
      console.error('Recovery update error:', updateError);
      return NextResponse.json({ error: '복구 처리 중 오류가 발생했습니다.' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: '계정이 성공적으로 복구되었습니다! 🌸',
    });
  } catch (error) {
    console.error('Recovery error:', error);
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 });
  }
}
