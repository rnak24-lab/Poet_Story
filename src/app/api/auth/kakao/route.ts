import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

// GET /api/auth/kakao — redirect to Kakao OAuth
export async function GET(req: NextRequest) {
  const clientId = process.env.KAKAO_REST_API_KEY;
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://sigeuldam.kr';
  const redirectUri = `${baseUrl}/api/auth/callback/kakao`;

  if (!clientId) {
    return NextResponse.json({ error: '카카오 로그인이 설정되지 않았습니다.' }, { status: 503 });
  }

  const kakaoAuthUrl = `https://kauth.kakao.com/oauth/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=profile_nickname,account_email`;

  return NextResponse.redirect(kakaoAuthUrl);
}
