import { NextRequest, NextResponse } from 'next/server';
import { getStoredCode, deleteStoredCode } from '@/lib/verification-store';
import { createServerSupabase } from '@/lib/supabase';
import bcrypt from 'bcryptjs';

export async function POST(req: NextRequest) {
  try {
    const { email, code, newPassword } = await req.json();
    if (!email || !code || !newPassword) {
      return NextResponse.json({ error: '모든 항목을 입력해주세요.' }, { status: 400 });
    }

    if (newPassword.length < 8) {
      return NextResponse.json({ error: '비밀번호는 8자 이상이어야 합니다.' }, { status: 400 });
    }
    if (!/[A-Za-z]/.test(newPassword) || !/[0-9]/.test(newPassword)) {
      return NextResponse.json({ error: '비밀번호에 영문과 숫자가 모두 포함되어야 합니다.' }, { status: 400 });
    }

    // Verify reset code
    const storedCode = getStoredCode(`reset:${email}`);
    if (!storedCode || storedCode !== code) {
      return NextResponse.json({ error: '인증 코드가 유효하지 않습니다. 다시 시도해주세요.' }, { status: 400 });
    }

    // Update password in DB
    const supabase = createServerSupabase();
    if (!supabase) {
      return NextResponse.json({ error: 'DB 연결 실패' }, { status: 503 });
    }

    const passwordHash = await bcrypt.hash(newPassword, 12);
    const { error } = await supabase
      .from('users')
      .update({ password_hash: passwordHash })
      .eq('email', email.trim());

    if (error) {
      console.error('Password update error:', error);
      return NextResponse.json({ error: '비밀번호 변경에 실패했습니다.' }, { status: 500 });
    }

    deleteStoredCode(`reset:${email}`);

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Verify reset error:', error);
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 });
  }
}
