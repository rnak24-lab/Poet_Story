import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

// GET /api/auth/callback/kakao — handle Kakao OAuth callback
export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get('code');
  const error = req.nextUrl.searchParams.get('error');
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://sigeuldam.kr';

  if (error || !code) {
    return NextResponse.redirect(`${baseUrl}/`);
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
      const res = NextResponse.redirect(`${baseUrl}/`);
      res.cookies.set('oauth_error', 'kakao_token', { path: '/', maxAge: 60, httpOnly: false, sameSite: 'lax' });
      return res;
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
      const res = NextResponse.redirect(`${baseUrl}/`);
      res.cookies.set('oauth_error', 'server_error', { path: '/', maxAge: 60, httpOnly: false, sameSite: 'lax' });
      return res;
    }

    // Check by provider + provider_id (exact match)
    const { data: existingUser } = await supabase
      .from('users')
      .select('id, email, name, avatar, pencils, referral_code, is_email_verified, is_admin, collected_flowers, created_at, provider')
      .eq('provider', 'kakao')
      .eq('provider_id', kakaoId)
      .single();

    if (existingUser) {
      // Existing kakao user — login directly via cookie
      const userPayload = {
        id: existingUser.id,
        email: existingUser.email,
        name: existingUser.name,
        avatar: existingUser.avatar || '🌸',
        pencils: existingUser.pencils || 0,
        referralCode: existingUser.referral_code || '',
        isEmailVerified: true,
        isAdmin: existingUser.is_admin || false,
        collectedFlowers: existingUser.collected_flowers || [],
        createdAt: existingUser.created_at,
      };
      const res = NextResponse.redirect(`${baseUrl}/`);
      res.cookies.set('oauth_login', JSON.stringify({ provider: 'kakao', user: userPayload }), {
        path: '/', maxAge: 120, httpOnly: false, sameSite: 'lax',
      });
      return res;
    }

    // Check if email already exists with different provider
    const { data: emailUser } = await supabase
      .from('users')
      .select('id, provider')
      .eq('email', email)
      .single();

    if (emailUser) {
      const existingProvider = emailUser.provider || 'email';
      const res = NextResponse.redirect(`${baseUrl}/`);
      res.cookies.set('oauth_error', JSON.stringify({
        type: 'email_exists',
        existing_provider: existingProvider,
        email: email,
      }), { path: '/', maxAge: 60, httpOnly: false, sameSite: 'lax' });
      return res;
    }

    // New user — send to frontend for terms agreement (don't insert yet)
    const pendingProfile = {
      provider: 'kakao',
      providerId: kakaoId,
      name: nickname,
      email,
    };
    const res = NextResponse.redirect(`${baseUrl}/`);
    res.cookies.set('oauth_pending', JSON.stringify(pendingProfile), {
      path: '/', maxAge: 300, httpOnly: false, sameSite: 'lax',
    });
    return res;

  } catch (error) {
    console.error('Kakao callback error:', error);
    const res = NextResponse.redirect(`${baseUrl}/`);
    res.cookies.set('oauth_error', 'kakao_error', { path: '/', maxAge: 60, httpOnly: false, sameSite: 'lax' });
    return res;
  }
}
