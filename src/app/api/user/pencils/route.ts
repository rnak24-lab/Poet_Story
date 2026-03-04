import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/supabase';

// POST /api/user/pencils — update pencils (buy, ad, referral)
export async function POST(req: NextRequest) {
  try {
    const supabase = createServerSupabase();
    if (!supabase) return NextResponse.json({ error: 'DB 연결 실패' }, { status: 503 });

    const { userId, action, count } = await req.json();
    // action: 'add' | 'use' | 'buy'
    if (!userId) return NextResponse.json({ error: 'userId 필요' }, { status: 400 });

    const { data: user } = await supabase.from('users').select('pencils, is_admin').eq('id', userId).single();
    if (!user) return NextResponse.json({ error: '사용자를 찾을 수 없습니다.' }, { status: 404 });

    let newPencils = user.pencils || 0;

    if (action === 'use') {
      if (user.is_admin) {
        return NextResponse.json({ pencils: newPencils, success: true });
      }
      if (newPencils <= 0) {
        return NextResponse.json({ error: '연필이 부족합니다.' }, { status: 400 });
      }
      newPencils -= 1;
    } else if (action === 'add' || action === 'buy') {
      newPencils += (count || 1);
    }

    await supabase.from('users').update({ pencils: newPencils }).eq('id', userId);

    return NextResponse.json({ pencils: newPencils, success: true });
  } catch (error) {
    return NextResponse.json({ error: '서버 오류' }, { status: 500 });
  }
}
