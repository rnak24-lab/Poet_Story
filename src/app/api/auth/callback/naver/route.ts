import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

// GET /api/auth/callback/naver — handle Naver OAuth callback
export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get('code');
  const error = req.nextUrl.searchParams.get('error');
  const errorDescription = req.nextUrl.searchParams.get('error_description');
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://sigeuldam.kr';

  console.log('[Naver Callback] Start - code:', !!code, 'error:', error);

  if (error || !code) {
    console.error('[Naver Callback] OAuth error or no code:', error, errorDescription);
    const res = NextResponse.redirect(`${baseUrl}/`);
    res.cookies.set('oauth_error', JSON.stringify({
      type: 'naver_auth_error',
      detail: errorDescription || error || 'No authorization code received',
    }), { path: '/', maxAge: 60, httpOnly: false, sameSite: 'lax' });
    return res;
  }

  try {
    const clientId = process.env.NAVER_CLIENT_ID;
    const clientSecret = process.env.NAVER_CLIENT_SECRET;
    const state = req.nextUrl.searchParams.get('state') || '';

    console.log('[Naver Callback] Config - clientId:', !!clientId, 'clientSecret:', !!clientSecret);

    if (!clientId || !clientSecret) {
      console.error('[Naver Callback] NAVER_CLIENT_ID or NAVER_CLIENT_SECRET not set');
      const res = NextResponse.redirect(`${baseUrl}/`);
      res.cookies.set('oauth_error', JSON.stringify({
        type: 'naver_config_error',
        detail: '네이버 로그인 설정이 완료되지 않았습니다.',
      }), { path: '/', maxAge: 60, httpOnly: false, sameSite: 'lax' });
      return res;
    }

    // 1. Exchange code for access token
    console.log('[Naver Callback] Exchanging code for token...');
    const tokenRes = await fetch(`https://nid.naver.com/oauth2.0/token?grant_type=authorization_code&client_id=${clientId}&client_secret=${clientSecret}&code=${code}&state=${state}`);
    const tokenData = await tokenRes.json();

    console.log('[Naver Callback] Token response - has access_token:', !!tokenData.access_token);

    if (!tokenData.access_token) {
      console.error('[Naver Callback] Token error:', JSON.stringify(tokenData));
      const res = NextResponse.redirect(`${baseUrl}/`);
      res.cookies.set('oauth_error', JSON.stringify({
        type: 'naver_token_error',
        detail: tokenData.error_description || tokenData.error || 'Token exchange failed',
      }), { path: '/', maxAge: 60, httpOnly: false, sameSite: 'lax' });
      return res;
    }

    // 2. Get user profile from Naver
    const profileRes = await fetch('https://openapi.naver.com/v1/nid/me', {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });
    const profileData = await profileRes.json();
    const profile = profileData.response;

    const naverId = profile.id;
    const nickname = profile.nickname || profile.name || '네이버 사용자';
    const email = profile.email || `naver_${naverId}@sigeuldam.kr`;

    console.log('[Naver Callback] Profile - id:', naverId, 'nickname:', nickname, 'email:', email);

    // 3. Check if user exists in Supabase
    const supabase = createServerSupabase();
    if (!supabase) {
      console.error('[Naver Callback] Supabase client creation failed');
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
      .eq('provider', 'naver')
      .eq('provider_id', naverId)
      .single();

    console.log('[Naver Callback] DB lookup - existingUser:', !!existingUser, 'dbError:', dbError?.code);

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
        res.cookies.set('oauth_login', JSON.stringify({ provider: 'naver', user: userPayload }), {
          path: '/', maxAge: 120, httpOnly: false, sameSite: 'lax',
        });
        return res;
      }

      // Existing naver user — login directly via cookie
      console.log('[Naver Callback] Existing user login:', existingUser.id);
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
      res.cookies.set('oauth_login', JSON.stringify({ provider: 'naver', user: userPayload }), {
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
      console.log('[Naver Callback] Email conflict - existing provider:', emailUser.provider);
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
    console.log('[Naver Callback] New user - setting oauth_pending cookie');
    const pendingProfile = {
      provider: 'naver',
      providerId: naverId,
      name: nickname,
      email,
    };
    const res = NextResponse.redirect(`${baseUrl}/`);
    res.cookies.set('oauth_pending', JSON.stringify(pendingProfile), {
      path: '/', maxAge: 300, httpOnly: false, sameSite: 'lax',
    });
    return res;

  } catch (err) {
    console.error('[Naver Callback] Unexpected error:', err);
    const res = NextResponse.redirect(`${baseUrl}/`);
    res.cookies.set('oauth_error', JSON.stringify({
      type: 'naver_exception',
      detail: err instanceof Error ? err.message : 'Unknown error',
    }), { path: '/', maxAge: 60, httpOnly: false, sameSite: 'lax' });
    return res;
  }
}
