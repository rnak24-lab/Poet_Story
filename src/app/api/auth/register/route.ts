import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/supabase';
import bcrypt from 'bcryptjs';

export async function POST(req: NextRequest) {
  try {
    const { name, email, password } = await req.json();

    if (!name?.trim() || !email?.trim() || !password) {
      return NextResponse.json({ error: '모든 항목을 입력해주세요.' }, { status: 400 });
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: '올바른 이메일 형식이 아닙니다.' }, { status: 400 });
    }

    if (password.length < 8) {
      return NextResponse.json({ error: '비밀번호는 8자 이상이어야 합니다.' }, { status: 400 });
    }
    if (!/[A-Za-z]/.test(password) || !/[0-9]/.test(password)) {
      return NextResponse.json({ error: '비밀번호에 영문과 숫자가 모두 포함되어야 합니다.' }, { status: 400 });
    }

    const supabase = createServerSupabase();
    if (!supabase) {
      return NextResponse.json({ error: 'DB가 아직 연결되지 않았습니다. 관리자에게 문의하세요.' }, { status: 503 });
    }

    // 이메일 중복 확인
    const { data: existing } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .single();

    if (existing) {
      return NextResponse.json({ error: '이미 사용 중인 이메일입니다.' }, { status: 409 });
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
    const referralCode = name.trim().slice(0, 2).toUpperCase()
      + Math.random().toString(36).slice(2, 6).toUpperCase();

    const { data: newUser, error } = await supabase.from('users').insert({
      email: email.trim(),
      name: name.trim(),
      password_hash: passwordHash,
      provider: 'email',
      is_email_verified: false,
      verification_code: verificationCode,
      verification_expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
      referral_code: referralCode,
      pencils: 3,
    }).select('id, email, name, avatar, pencils, referral_code').single();

    if (error || !newUser) {
      console.error('Registration error:', error);
      return NextResponse.json({ error: '가입 중 문제가 발생했습니다.' }, { status: 500 });
    }

    // 인증 이메일 발송 (Resend)
    const resendKey = process.env.RESEND_API_KEY;
    if (resendKey) {
      try {
        await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${resendKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: '시글담 <noreply@sigeuldam.kr>',
            to: email.trim(),
            subject: '시글담 이메일 인증 코드',
            html: `
              <div style="font-family: -apple-system, sans-serif; max-width: 400px; margin: 0 auto; padding: 32px;">
                <div style="text-align: center; margin-bottom: 24px;">
                  <span style="font-size: 48px;">🌸</span>
                  <h1 style="color: #1A1A1A; font-size: 20px; margin: 12px 0 4px;">시글담 이메일 인증</h1>
                  <p style="color: #999; font-size: 14px;">아래 인증 코드를 입력해주세요</p>
                </div>
                <div style="background: #FFF5E8; border-radius: 16px; padding: 24px; text-align: center; margin: 24px 0;">
                  <p style="font-size: 36px; font-weight: bold; letter-spacing: 8px; color: #1A1A1A; margin: 0;">${verificationCode}</p>
                </div>
                <p style="color: #999; font-size: 12px; text-align: center;">이 코드는 10분간 유효합니다.</p>
              </div>
            `,
          }),
        });
      } catch (e) {
        console.error('Verification email send failed:', e);
      }
    }

    return NextResponse.json({
      user: newUser,
      verificationCode: resendKey ? undefined : verificationCode,
    });

  } catch (error) {
    console.error('Register route error:', error);
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 });
  }
}
