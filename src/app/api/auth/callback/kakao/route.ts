import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/supabase';

// GET /api/auth/callback/kakao — handle Kakao OAuth callback
export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get('code');
  const error = req.nextUrl.searchParams.get('error');
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://sigeuldam.kr';

  if (error || !code) {
    return NextResponse.redirect(`${baseUrl}/?error=kakao_denied`);
  }

  try {
    const clientId = process.env.KAKAO_REST_API_KEY;
    const redirectUri = `${baseUrl}/api/auth/callback/kakao`;

    // 1. Exchange code for access token
    const tokenRes = await fetch('https://kauth.kakao.com/oauth/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        client_id: clientId!,
        redirect_uri: redirectUri,
        code,
      }),
    });

    const tokenData = await tokenRes.json();
    if (!tokenData.access_token) {
      console.error('Kakao token error:', tokenData);
      return NextResponse.redirect(`${baseUrl}/?error=kakao_token`);
    }

    // 2. Get user profile from Kakao
    const profileRes = await fetch('https://kapi.kakao.com/v2/user/me', {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });

    const profile = await profileRes.json();
    const kakaoId = String(profile.id);
    const nickname = profile.kakao_account?.profile?.nickname || profile.properties?.nickname || '카카오 사용자';
    const email = profile.kakao_account?.email || `kakao_${kakaoId}@sigeuldam.kr`;

    // 3. Check if user exists in Supabase
    const supabase = createServerSupabase();
    if (!supabase) {
      return NextResponse.redirect(`${baseUrl}/?error=server_error`);
    }

    // Check by provider_id first, then by email
    let { data: existingUser } = await supabase
      .from('users')
      .select('id, email, name, avatar, pencils, referral_code, is_email_verified, is_admin, collected_flowers, created_at')
      .eq('provider', 'kakao')
      .eq('provider_id', kakaoId)
      .single();

    if (!existingUser) {
      // Check by email (might have registered with email first)
      const { data: emailUser } = await supabase
        .from('users')
        .select('id, email, name, avatar, pencils, referral_code, is_email_verified, is_admin, collected_flowers, created_at')
        .eq('email', email)
        .single();

      if (emailUser) {
        // Link existing account to kakao
        await supabase.from('users').update({
          provider: 'kakao',
          provider_id: kakaoId,
          is_email_verified: true,
        }).eq('id', emailUser.id);
        existingUser = emailUser;
      }
    }

    let userData;

    if (existingUser) {
      // Existing user — login
      userData = existingUser;
    } else {
      // New user — register
      const referralCode = nickname.slice(0, 2).toUpperCase() + Math.random().toString(36).slice(2, 6).toUpperCase();

      const { data: newUser, error: insertError } = await supabase.from('users').insert({
        email,
        name: nickname,
        provider: 'kakao',
        provider_id: kakaoId,
        is_email_verified: true,
        referral_code: referralCode,
        pencils: 0,
      }).select('id, email, name, avatar, pencils, referral_code, is_email_verified, is_admin, collected_flowers, created_at').single();

      if (insertError || !newUser) {
        console.error('Kakao register error:', insertError);
        return NextResponse.redirect(`${baseUrl}/?error=register_failed`);
      }

      // Force pencils to 0 (DB default may override)
      if (newUser.pencils !== 0) {
        await supabase.from('users').update({ pencils: 0 }).eq('id', newUser.id);
        newUser.pencils = 0;
      }

      userData = newUser;
    }

    // 4. Redirect with user data as query params (encoded)
    const userPayload = {
      id: userData.id,
      email: userData.email,
      name: userData.name,
      avatar: userData.avatar || '🌸',
      pencils: userData.pencils || 0,
      referralCode: userData.referral_code || '',
      isEmailVerified: true,
      isAdmin: userData.is_admin || false,
      collectedFlowers: userData.collected_flowers || [],
      createdAt: userData.created_at,
    };

    const encodedUser = encodeURIComponent(JSON.stringify(userPayload));
    return NextResponse.redirect(`${baseUrl}/?oauth=kakao&user=${encodedUser}`);

  } catch (error) {
    console.error('Kakao callback error:', error);
    return NextResponse.redirect(`${baseUrl}/?error=kakao_error`);
  }
}
