import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/supabase';

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

    let { data: existingUser } = await supabase
      .from('users')
      .select('id, email, name, avatar, pencils, referral_code, is_email_verified, is_admin, collected_flowers, created_at')
      .eq('provider', 'naver')
      .eq('provider_id', naverId)
      .single();

    if (!existingUser) {
      const { data: emailUser } = await supabase
        .from('users')
        .select('id, email, name, avatar, pencils, referral_code, is_email_verified, is_admin, collected_flowers, created_at')
        .eq('email', email)
        .single();

      if (emailUser) {
        await supabase.from('users').update({
          provider: 'naver',
          provider_id: naverId,
          is_email_verified: true,
        }).eq('id', emailUser.id);
        existingUser = emailUser;
      }
    }

    let userData;

    if (existingUser) {
      userData = existingUser;
    } else {
      const referralCode = nickname.slice(0, 2).toUpperCase() + Math.random().toString(36).slice(2, 6).toUpperCase();

      const { data: newUser, error: insertError } = await supabase.from('users').insert({
        email,
        name: nickname,
        provider: 'naver',
        provider_id: naverId,
        is_email_verified: true,
        referral_code: referralCode,
        pencils: 0,
      }).select('id, email, name, avatar, pencils, referral_code, is_email_verified, is_admin, collected_flowers, created_at').single();

      if (insertError || !newUser) {
        console.error('Naver register error:', insertError);
        return NextResponse.redirect(`${baseUrl}/?error=register_failed`);
      }

      if (newUser.pencils !== 0) {
        await supabase.from('users').update({ pencils: 0 }).eq('id', newUser.id);
        newUser.pencils = 0;
      }

      userData = newUser;
    }

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
    return NextResponse.redirect(`${baseUrl}/?oauth=naver&user=${encodedUser}`);

  } catch (error) {
    console.error('Naver callback error:', error);
    return NextResponse.redirect(`${baseUrl}/?error=naver_error`);
  }
}
