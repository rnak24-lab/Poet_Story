import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

// GET /api/auth/callback/naver — handle Naver OAuth callback
export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get('code');
  const error = req.nextUrl.searchParams.get('error');
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://sigeuldam.kr';

  if (error || !code) {
    return NextResponse.redirect(`${baseUrl}/?error=naver_denied`);
  }

  try {
    const clientId = process.env.NAVER_CLIENT_ID;
    const clientSecret = process.env.NAVER_CLIENT_SECRET;
    const state = req.nextUrl.searchParams.get('state') || '';

    if (!clientId || !clientSecret) {
      return NextResponse.redirect(`${baseUrl}/?error=naver_not_configured`);
    }

    // 1. Exchange code for access token
    const tokenRes = await fetch(`https://nid.naver.com/oauth2.0/token?grant_type=authorization_code&client_id=${clientId}&client_secret=${clientSecret}&code=${code}&state=${state}`);
    const tokenData = await tokenRes.json();

    if (!tokenData.access_token) {
      console.error('Naver token error:', tokenData);
      return NextResponse.redirect(`${baseUrl}/?error=naver_token`);
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

    // 3. Check if user exists in Supabase
    const supabase = createServerSupabase();
    if (!supabase) {
      return NextResponse.redirect(`${baseUrl}/?error=server_error`);
    }

    // Check by provider + provider_id (exact match)
    const { data: existingUser } = await supabase
      .from('users')
      .select('id, email, name, avatar, pencils, referral_code, is_email_verified, is_admin, collected_flowers, created_at, provider')
      .eq('provider', 'naver')
      .eq('provider_id', naverId)
      .single();

    if (existingUser) {
      // Existing naver user — login directly
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
      const encodedUser = encodeURIComponent(JSON.stringify(userPayload));
      return NextResponse.redirect(`${baseUrl}/?oauth=naver&user=${encodedUser}`);
    }

    // Check if email already exists with different provider
    const { data: emailUser } = await supabase
      .from('users')
      .select('id, provider')
      .eq('email', email)
      .single();

    if (emailUser) {
      const existingProvider = emailUser.provider || 'email';
      return NextResponse.redirect(`${baseUrl}/?oauth_error=email_exists&existing_provider=${existingProvider}&email=${encodeURIComponent(email)}`);
    }

    // New user — send to frontend for terms agreement (don't insert yet)
    const pendingProfile = {
      provider: 'naver',
      providerId: naverId,
      name: nickname,
      email,
    };
    const encodedProfile = encodeURIComponent(JSON.stringify(pendingProfile));
    return NextResponse.redirect(`${baseUrl}/?oauth_pending=naver&profile=${encodedProfile}`);

  } catch (error) {
    console.error('Naver callback error:', error);
    return NextResponse.redirect(`${baseUrl}/?error=naver_error`);
  }
}
