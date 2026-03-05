import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

// POST /api/user/withdraw — 회원탈퇴 요청 (15일 유예)
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

    // Check user exists
    const { data: user, error: fetchError } = await supabase
      .from('users')
      .select('id, name, withdrawal_requested_at')
      .eq('id', userId)
      .single();

    if (fetchError || !user) {
      return NextResponse.json({ error: '사용자를 찾을 수 없습니다.' }, { status: 404 });
    }

    if (user.withdrawal_requested_at) {
      return NextResponse.json({ error: '이미 탈퇴가 요청된 계정입니다.' }, { status: 400 });
    }

    // Set withdrawal_requested_at to NOW — actual deletion after 15 days
    const now = new Date().toISOString();
    const { error: updateError } = await supabase
      .from('users')
      .update({ withdrawal_requested_at: now })
      .eq('id', userId);

    if (updateError) {
      console.error('Withdrawal update error:', updateError);
      return NextResponse.json({ error: '탈퇴 처리 중 오류가 발생했습니다.' }, { status: 500 });
    }

    // Calculate deletion date (15 days from now)
    const deletionDate = new Date();
    deletionDate.setDate(deletionDate.getDate() + 15);

    return NextResponse.json({
      success: true,
      message: '탈퇴가 요청되었습니다. 15일 후 계정이 영구 삭제됩니다.',
      deletionDate: deletionDate.toISOString(),
    });
  } catch (error) {
    console.error('Withdrawal error:', error);
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 });
  }
}
