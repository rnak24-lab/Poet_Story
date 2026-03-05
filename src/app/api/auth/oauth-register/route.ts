import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/supabase';

// POST /api/auth/oauth-register — complete OAuth registration after terms agreement
export async function POST(req: NextRequest) {
  try {
    const { provider, providerId, name, email, agreedToTerms, agreedToPrivacy, agreedToGuidelines } = await req.json();

    // Validate
    if (!provider || !providerId || !name || !email) {
      return NextResponse.json({ error: '필수 정보가 누락되었습니다.' }, { status: 400 });
    }
    if (!agreedToTerms || !agreedToPrivacy || !agreedToGuidelines) {
      return NextResponse.json({ error: '모든 약관에 동의해주세요.' }, { status: 400 });
    }

    const supabase = createServerSupabase();
    if (!supabase) {
      return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 });
    }

    // Double-check: user doesn't already exist
    const { data: existing } = await supabase
      .from('users')
      .select('id')
      .eq('provider', provider)
      .eq('provider_id', providerId)
      .single();

    if (existing) {
      return NextResponse.json({ error: '이미 가입된 계정입니다.' }, { status: 409 });
    }

    // Check email conflict
    const { data: emailUser } = await supabase
      .from('users')
      .select('id, provider')
      .eq('email', email)
      .single();

    if (emailUser) {
      const providerLabel = emailUser.provider === 'email' ? '이메일' : emailUser.provider === 'kakao' ? '카카오' : '네이버';
      return NextResponse.json({ error: `이미 ${providerLabel}(으)로 가입된 이메일입니다. ${providerLabel} 로그인을 이용해주세요.` }, { status: 409 });
    }

    // Create user
    const referralCode = name.slice(0, 2).toUpperCase() + Math.random().toString(36).slice(2, 6).toUpperCase();

    const { data: newUser, error: insertError } = await supabase.from('users').insert({
      email,
      name: name.trim(),
      provider,
      provider_id: providerId,
      is_email_verified: true,
      referral_code: referralCode,
      pencils: 0,
    }).select('id, email, name, avatar, pencils, referral_code, is_email_verified, is_admin, collected_flowers, created_at').single();

    if (insertError || !newUser) {
      console.error('OAuth register error:', insertError);
      return NextResponse.json({ error: '가입 중 오류가 발생했습니다.' }, { status: 500 });
    }

    // Force pencils to 0 (DB default may override)
    if (newUser.pencils !== 0) {
      await supabase.from('users').update({ pencils: 0 }).eq('id', newUser.id);
      newUser.pencils = 0;
    }

    return NextResponse.json({
      user: {
        id: newUser.id,
        email: newUser.email,
        name: newUser.name,
        avatar: newUser.avatar || '🌸',
        pencils: 0,
        referralCode: newUser.referral_code,
        isEmailVerified: true,
        isAdmin: newUser.is_admin || false,
        collectedFlowers: newUser.collected_flowers || [],
        createdAt: newUser.created_at,
      },
    });

  } catch (error) {
    console.error('OAuth register error:', error);
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 });
  }
}
