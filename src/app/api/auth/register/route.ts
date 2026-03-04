import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/supabase';
import { setStoredCode } from '@/lib/verification-store';
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
      return NextResponse.json({ error: 'DB 연결 실패' }, { status: 503 });
    }

    // Check duplicate email
    const { data: existing } = await supabase
      .from('users')
      .select('id')
      .eq('email', email.trim())
      .single();

    if (existing) {
      return NextResponse.json({ error: '이미 사용 중인 이메일입니다.' }, { status: 409 });
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 12);
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
    const referralCode = name.trim().slice(0, 2).toUpperCase()
      + Math.random().toString(36).slice(2, 6).toUpperCase();

    // Insert user into DB
    const { data: newUser, error: insertError } = await supabase.from('users').insert({
      email: email.trim(),
      name: name.trim(),
      password_hash: passwordHash,
      provider: 'email',
      is_email_verified: false,
      verification_code: verificationCode,
      verification_expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
      referral_code: referralCode,
      pencils: 3,
    }).select('id, email, name, avatar, pencils, referral_code, is_email_verified, is_admin, created_at, collected_flowers').single();

    if (insertError || !newUser) {
      console.error('Registration error:', insertError);
      return NextResponse.json({ error: '가입 중 문제가 발생했습니다.' }, { status: 500 });
    }

    // Also store code in memory for verify endpoint
    setStoredCode(email.trim(), verificationCode);

    // Send verification email via Resend
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
            subject: '🌸 시글담 이메일 인증 코드',
            html: `
              <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 420px; margin: 0 auto; padding: 32px; background: #FAFAF8;">
                <div style="text-align: center; margin-bottom: 24px;">
                  <span style="font-size: 48px;">🌸</span>
                  <h1 style="color: #1A1A1A; font-size: 22px; margin: 12px 0 4px;">시글담 이메일 인증</h1>
                  <p style="color: #999; font-size: 14px; margin: 0;">${name.trim()}님, 환영합니다!</p>
                </div>
                <div style="background: #FFF5E8; border-radius: 16px; padding: 28px; text-align: center; margin: 24px 0;">
                  <p style="color: #666; font-size: 13px; margin: 0 0 12px;">인증 코드</p>
                  <p style="font-size: 40px; font-weight: bold; letter-spacing: 10px; color: #1A1A1A; margin: 0;">${verificationCode}</p>
                </div>
                <p style="color: #999; font-size: 12px; text-align: center; margin-top: 16px;">이 코드는 <strong>10분간</strong> 유효합니다.</p>
              </div>
            `,
          }),
        });
        console.log('Verification email sent to:', email);
      } catch (e) {
        console.error('Email send failed:', e);
      }
    }

    return NextResponse.json({
      user: {
        id: newUser.id,
        email: newUser.email,
        name: newUser.name,
        avatar: newUser.avatar || '🌸',
        pencils: newUser.pencils || 3,
        referralCode: newUser.referral_code,
        isEmailVerified: false,
        isAdmin: false,
        collectedFlowers: newUser.collected_flowers || [],
        createdAt: newUser.created_at,
      },
      sent: true,
    });

  } catch (error) {
    console.error('Register error:', error);
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 });
  }
}
