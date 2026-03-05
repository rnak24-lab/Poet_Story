import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

// GET /api/auth/callback/kakao — handle Kakao OAuth callback
export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get('code');
  const error = req.nextUrl.searchParams.get('error');
  const errorDescription = req.nextUrl.searchParams.get('error_description');
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://sigeuldam.kr';

  console.log('[Kakao Callback] Start - code:', !!code, 'error:', error, 'errorDesc:', errorDescription);

  if (error || !code) {
    console.error('[Kakao Callback] OAuth error or no code:', error, errorDescription);
    const res = NextResponse.redirect(`${baseUrl}/`);
    res.cookies.set('oauth_error', JSON.stringify({
      type: 'kakao_auth_error',
      detail: errorDescription || error || 'No authorization code received',
    }), { path: '/', maxAge: 60, httpOnly: false, sameSite: 'lax' });
    return res;
  }

  try {
    const clientId = process.env.KAKAO_REST_API_KEY;
    const clientSecret = process.env.KAKAO_CLIENT_SECRET;
    const redirectUri = `${baseUrl}/api/auth/callback/kakao`;

    console.log('[Kakao Callback] Config - clientId:', !!clientId, 'clientSecret:', !!clientSecret, 'redirectUri:', redirectUri);

    if (!clientId) {
      console.error('[Kakao Callback] KAKAO_REST_API_KEY not set');
      const res = NextResponse.redirect(`${baseUrl}/`);
      res.cookies.set('oauth_error', JSON.stringify({
        type: 'kakao_config_error',
        detail: 'KAKAO_REST_API_KEY 환경변수가 설정되지 않았습니다.',
      }), { path: '/', maxAge: 60, httpOnly: false, sameSite: 'lax' });
      return res;
    }

    // 1. Exchange code for access token
    const tokenParams: Record<string, string> = {
      grant_type: 'authorization_code',
      client_id: clientId,
      redirect_uri: redirectUri,
      code,
    };
    if (clientSecret) {
      tokenParams.client_secret = clientSecret;
    }

    console.log('[Kakao Callback] Exchanging code for token...');

    const tokenRes = await fetch('https://kauth.kakao.com/oauth/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams(tokenParams),
    });

    const tokenData = await tokenRes.json();
    console.log('[Kakao Callback] Token response status:', tokenRes.status, 'has access_token:', !!tokenData.access_token);

    if (!tokenData.access_token) {
      console.error('[Kakao Callback] Token error:', JSON.stringify(tokenData));
      const res = NextResponse.redirect(`${baseUrl}/`);
      res.cookies.set('oauth_error', JSON.stringify({
        type: 'kakao_token_error',
        detail: tokenData.error_description || tokenData.error || 'Token exchange failed',
      }), { path: '/', maxAge: 60, httpOnly: false, sameSite: 'lax' });
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

    console.log('[Kakao Callback] Profile - id:', kakaoId, 'nickname:', nickname, 'email:', email, 'has_email:', !!profile.kakao_account?.email);

    // 3. Check if user exists in Supabase
    const supabase = createServerSupabase();
    if (!supabase) {
      console.error('[Kakao Callback] Supabase client creation failed');
      const res = NextResponse.redirect(`${baseUrl}/`);
      res.cookies.set('oauth_error', JSON.stringify({
        type: 'server_error',
        detail: 'Database connection failed',
      }), { path: '/', maxAge: 60, httpOnly: false, sameSite: 'lax' });
      return res;
    }

    // Check by provider + provider_id (exact match)
    const { data: existingUser, error: dbError } = await supabase
      .from('users')
      .select('id, email, name, avatar, pencils, referral_code, is_email_verified, is_admin, collected_flowers, created_at, provider, withdrawal_requested_at')
      .eq('provider', 'kakao')
      .eq('provider_id', kakaoId)
      .single();

    console.log('[Kakao Callback] DB lookup - existingUser:', !!existingUser, 'dbError:', dbError?.code);

    if (existingUser) {
      // Check withdrawal status
      if (existingUser.withdrawal_requested_at) {
        const requestedAt = new Date(existingUser.withdrawal_requested_at);
        const now = new Date();
        const daysPassed = Math.floor((now.getTime() - requestedAt.getTime()) / (1000 * 60 * 60 * 24));
        if (daysPassed >= 15) {
          const res = NextResponse.redirect(`${baseUrl}/`);
          res.cookies.set('oauth_error', JSON.stringify({ type: 'account_deleted' }), { path: '/', maxAge: 60, httpOnly: false, sameSite: 'lax' });
          return res;
        }
        const userPayload = {
          id: existingUser.id, email: existingUser.email, name: existingUser.name,
          avatar: existingUser.avatar || '🌸', pencils: existingUser.pencils || 0,
          referralCode: existingUser.referral_code || '', isEmailVerified: true,
          isAdmin: existingUser.is_admin || false,
          collectedFlowers: existingUser.collected_flowers || [],
          createdAt: existingUser.created_at,
          withdrawalPending: true, daysLeft: 15 - daysPassed,
          withdrawalRequestedAt: existingUser.withdrawal_requested_at,
        };
        const res = NextResponse.redirect(`${baseUrl}/`);
        res.cookies.set('oauth_login', JSON.stringify({ provider: 'kakao', user: userPayload }), {
          path: '/', maxAge: 120, httpOnly: false, sameSite: 'lax',
        });
        return res;
      }

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
      console.log('[Kakao Callback] Existing user login:', existingUser.id);
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
      console.log('[Kakao Callback] Email conflict - existing provider:', emailUser.provider);
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
    console.log('[Kakao Callback] New user - setting oauth_pending cookie');
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

  } catch (err) {
    console.error('[Kakao Callback] Unexpected error:', err);
    const res = NextResponse.redirect(`${baseUrl}/`);
    res.cookies.set('oauth_error', JSON.stringify({
      type: 'kakao_exception',
      detail: err instanceof Error ? err.message : 'Unknown error',
    }), { path: '/', maxAge: 60, httpOnly: false, sameSite: 'lax' });
    return res;
  }
}
