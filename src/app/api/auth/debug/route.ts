import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

// GET /api/auth/debug — check OAuth environment variables (no secrets exposed)
export async function GET(req: NextRequest) {
  return NextResponse.json({
    kakao: {
      KAKAO_REST_API_KEY: process.env.KAKAO_REST_API_KEY ? `SET (${process.env.KAKAO_REST_API_KEY.slice(0, 4)}...)` : 'NOT SET',
      KAKAO_CLIENT_SECRET: process.env.KAKAO_CLIENT_SECRET ? `SET (${process.env.KAKAO_CLIENT_SECRET.slice(0, 4)}...)` : 'NOT SET',
    },
    naver: {
      NAVER_CLIENT_ID: process.env.NAVER_CLIENT_ID ? `SET (${process.env.NAVER_CLIENT_ID.slice(0, 4)}...)` : 'NOT SET',
      NAVER_CLIENT_SECRET: process.env.NAVER_CLIENT_SECRET ? 'SET' : 'NOT SET',
    },
    supabase: {
      NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL ? 'SET' : 'NOT SET',
      SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY ? 'SET' : 'NOT SET',
    },
    base_url: process.env.NEXT_PUBLIC_BASE_URL || 'https://sigeuldam.kr (default)',
    timestamp: new Date().toISOString(),
  });
}
