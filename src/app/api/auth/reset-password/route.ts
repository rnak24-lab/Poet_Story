import { NextRequest, NextResponse } from 'next/server';
import { setStoredCode } from '@/lib/verification-store';
import { createServerSupabase } from '@/lib/supabase';

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();
    if (!email) {
      return NextResponse.json({ error: '이메일을 입력해주세요.' }, { status: 400 });
    }

    // Check if user exists in DB
    const supabase = createServerSupabase();
    if (supabase) {
      const { data: user } = await supabase
        .from('users')
        .select('id, name')
        .eq('email', email.trim())
        .single();
      
      if (!user) {
        return NextResponse.json({ error: '해당 이메일로 가입된 계정이 없습니다.' }, { status: 404 });
      }
    }

    const code = Math.floor(100000 + Math.random() * 900000).toString();
    setStoredCode(`reset:${email}`, code);

    const resendKey = process.env.RESEND_API_KEY;
    if (!resendKey) {
      return NextResponse.json({ sent: true, devCode: code });
    }

    const resendResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: '시글담 <noreply@sigeuldam.kr>',
        to: email,
        subject: '🔑 시글담 비밀번호 재설정',
        html: `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 420px; margin: 0 auto; padding: 32px; background: #FAFAF8;">
            <div style="text-align: center; margin-bottom: 24px;">
              <span style="font-size: 48px;">🔑</span>
              <h1 style="color: #1A1A1A; font-size: 22px; margin: 12px 0 4px;">비밀번호 재설정</h1>
              <p style="color: #999; font-size: 14px; margin: 0;">아래 인증 코드를 입력해주세요</p>
            </div>
            <div style="background: #F0F4FF; border-radius: 16px; padding: 28px; text-align: center; margin: 24px 0;">
              <p style="color: #666; font-size: 13px; margin: 0 0 12px;">인증 코드</p>
              <p style="font-size: 40px; font-weight: bold; letter-spacing: 10px; color: #1A1A1A; margin: 0;">${code}</p>
            </div>
            <p style="color: #999; font-size: 12px; text-align: center; margin-top: 16px;">이 코드는 <strong>10분간</strong> 유효합니다.</p>
          </div>
        `,
      }),
    });

    if (!resendResponse.ok) {
      return NextResponse.json({ error: '이메일 전송에 실패했습니다.' }, { status: 500 });
    }

    return NextResponse.json({ sent: true });

  } catch (error) {
    console.error('Reset password error:', error);
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 });
  }
}
