import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

// GET /api/auth/naver — redirect to Naver OAuth
export async function GET(req: NextRequest) {
  const clientId = process.env.NAVER_CLIENT_ID;
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://sigeuldam.kr';
  const redirectUri = `${baseUrl}/api/auth/callback/naver`;

  if (!clientId) {
    return NextResponse.json({ error: '네이버 로그인이 아직 설정되지 않았습니다. 곧 지원 예정입니다.' }, { status: 503 });
  }

  const state = Math.random().toString(36).slice(2, 15);
  const naverAuthUrl = `https://nid.naver.com/oauth2.0/authorize?response_type=code&client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&state=${state}`;

  return NextResponse.redirect(naverAuthUrl);
}
