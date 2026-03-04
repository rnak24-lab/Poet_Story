import { NextRequest, NextResponse } from 'next/server';
import { setStoredCode } from '@/lib/verification-store';
import { createServerSupabase } from '@/lib/supabase';

export async function POST(req: NextRequest) {
  try {
    const { email, name } = await req.json();
    if (!email) {
      return NextResponse.json({ error: '이메일을 입력해주세요.' }, { status: 400 });
    }

    // Generate 6-digit code
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Store in memory
    setStoredCode(email, code);

    // Also store in DB
    const supabase = createServerSupabase();
    if (supabase) {
      await supabase
        .from('users')
        .update({
          verification_code: code,
          verification_expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
        })
        .eq('email', email.trim());
    }

    // Send via Resend
    const resendKey = process.env.RESEND_API_KEY;
    if (!resendKey) {
      console.error('RESEND_API_KEY is not set');
      return NextResponse.json({
        sent: true,
        devCode: process.env.NODE_ENV === 'development' ? code : undefined,
        message: 'RESEND_API_KEY가 설정되지 않았습니다.',
      });
    }

    const displayName = name || '회원';
    
    const resendResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: '시글담 <noreply@sigeuldam.kr>',
        to: email,
        subject: '시글담 이메일 인증 코드',
        html: `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 420px; margin: 0 auto; padding: 32px; background: #FAFAF8;">
            <div style="text-align: center; margin-bottom: 24px;">
              <span style="font-size: 48px;">🌸</span>
              <h1 style="color: #1A1A1A; font-size: 22px; margin: 12px 0 4px;">시글담 이메일 인증</h1>
              <p style="color: #999; font-size: 14px; margin: 0;">${displayName}님, 환영합니다!</p>
            </div>
            <div style="background: #FFF5E8; border-radius: 16px; padding: 28px; text-align: center; margin: 24px 0;">
              <p style="color: #666; font-size: 13px; margin: 0 0 12px;">인증 코드</p>
              <p style="font-size: 40px; font-weight: bold; letter-spacing: 10px; color: #1A1A1A; margin: 0;">${code}</p>
            </div>
            <p style="color: #999; font-size: 12px; text-align: center; margin-top: 16px;">이 코드는 <strong>10분간</strong> 유효합니다.</p>
            <hr style="border: none; border-top: 1px solid #EEE; margin: 24px 0;" />
            <p style="color: #CCC; font-size: 11px; text-align: center;">
              본인이 요청하지 않았다면 이 이메일을 무시해주세요.<br/>
              시글담 — 꽃말로 쓰는 나만의 시
            </p>
          </div>
        `,
      }),
    });

    if (!resendResponse.ok) {
      const errorData = await resendResponse.json().catch(() => ({}));
      console.error('Resend API error:', resendResponse.status, errorData);
      return NextResponse.json(
        { error: '이메일 전송에 실패했습니다. 잠시 후 다시 시도해주세요.', details: errorData },
        { status: 500 }
      );
    }

    const result = await resendResponse.json();
    console.log('Verification email sent:', { email, messageId: result.id });

    return NextResponse.json({ sent: true });

  } catch (error) {
    console.error('Send verification error:', error);
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 });
  }
}
