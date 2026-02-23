import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/supabase';

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();
    if (!email) {
      return NextResponse.json({ error: '이메일을 입력해주세요.' }, { status: 400 });
    }

    const supabase = createServerSupabase();
    if (!supabase) {
      return NextResponse.json({ error: 'DB가 아직 연결되지 않았습니다.' }, { status: 503 });
    }

    const { data: user } = await supabase
      .from('users')
      .select('id, name')
      .eq('email', email)
      .single();

    if (!user) {
      return NextResponse.json({ error: '사용자를 찾을 수 없습니다.' }, { status: 404 });
    }

    const newCode = Math.floor(100000 + Math.random() * 900000).toString();

    await supabase
      .from('users')
      .update({
        verification_code: newCode,
        verification_expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
      })
      .eq('id', user.id);

    const resendKey = process.env.RESEND_API_KEY;
    if (resendKey) {
      await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${resendKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: '시글담 <noreply@sigeuldam.kr>',
          to: email,
          subject: '시글담 이메일 인증 코드 (재발송)',
          html: `
            <div style="font-family: -apple-system, sans-serif; max-width: 400px; margin: 0 auto; padding: 32px;">
              <div style="text-align: center; margin-bottom: 24px;">
                <span style="font-size: 48px;">🌸</span>
                <h1 style="color: #1A1A1A; font-size: 20px;">시글담 이메일 인증</h1>
              </div>
              <div style="background: #FFF5E8; border-radius: 16px; padding: 24px; text-align: center;">
                <p style="font-size: 36px; font-weight: bold; letter-spacing: 8px; color: #1A1A1A; margin: 0;">${newCode}</p>
              </div>
              <p style="color: #999; font-size: 12px; text-align: center; margin-top: 16px;">10분간 유효합니다.</p>
            </div>
          `,
        }),
      }).catch(() => {});
    }

    return NextResponse.json({
      sent: true,
      code: resendKey ? undefined : newCode,
    });

  } catch (error) {
    console.error('Send verification error:', error);
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 });
  }
}
