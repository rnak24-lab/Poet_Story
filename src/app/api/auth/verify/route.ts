import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/supabase';

export async function POST(req: NextRequest) {
  try {
    const { email, code } = await req.json();
    if (!email || !code) {
      return NextResponse.json({ error: '이메일과 인증 코드를 입력해주세요.' }, { status: 400 });
    }

    const supabase = createServerSupabase();
    if (!supabase) {
      return NextResponse.json({ error: 'DB가 아직 연결되지 않았습니다.' }, { status: 503 });
    }

    const { data: user } = await supabase
      .from('users')
      .select('id, verification_code, verification_expires_at')
      .eq('email', email)
      .single();

    if (!user) {
      return NextResponse.json({ error: '사용자를 찾을 수 없습니다.' }, { status: 404 });
    }

    if (user.verification_code !== code) {
      return NextResponse.json({ error: '인증 코드가 일치하지 않습니다.' }, { status: 400 });
    }

    if (user.verification_expires_at && new Date(user.verification_expires_at) < new Date()) {
      return NextResponse.json({ error: '인증 코드가 만료되었습니다. 재발송해주세요.' }, { status: 400 });
    }

    await supabase
      .from('users')
      .update({ is_email_verified: true, verification_code: null })
      .eq('id', user.id);

    return NextResponse.json({ verified: true });

  } catch (error) {
    console.error('Verify error:', error);
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 });
  }
}
