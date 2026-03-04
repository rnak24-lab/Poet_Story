import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/supabase';
import bcrypt from 'bcryptjs';

// POST /api/user/change-password
export async function POST(req: NextRequest) {
  try {
    const supabase = createServerSupabase();
    if (!supabase) return NextResponse.json({ error: 'DB 연결 실패' }, { status: 503 });

    const { userId, currentPassword, newPassword } = await req.json();
    if (!userId || !currentPassword || !newPassword) {
      return NextResponse.json({ error: '모든 필드를 입력해주세요.' }, { status: 400 });
    }

    if (newPassword.length < 8) {
      return NextResponse.json({ error: '비밀번호는 8자 이상이어야 합니다.' }, { status: 400 });
    }
    if (!/[A-Za-z]/.test(newPassword) || !/[0-9]/.test(newPassword)) {
      return NextResponse.json({ error: '비밀번호에 영문과 숫자가 모두 포함되어야 합니다.' }, { status: 400 });
    }

    const { data: user } = await supabase
      .from('users')
      .select('password_hash')
      .eq('id', userId)
      .single();

    if (!user) return NextResponse.json({ error: '사용자를 찾을 수 없습니다.' }, { status: 404 });

    const isValid = await bcrypt.compare(currentPassword, user.password_hash);
    if (!isValid) {
      return NextResponse.json({ error: '현재 비밀번호가 일치하지 않습니다.' }, { status: 401 });
    }

    const newHash = await bcrypt.hash(newPassword, 12);
    await supabase.from('users').update({ password_hash: newHash }).eq('id', userId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Change password error:', error);
    return NextResponse.json({ error: '서버 오류' }, { status: 500 });
  }
}
