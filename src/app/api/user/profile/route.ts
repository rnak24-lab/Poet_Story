import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/supabase';

// GET /api/user/profile?userId=xxx — get user profile
export async function GET(req: NextRequest) {
  try {
    const supabase = createServerSupabase();
    if (!supabase) return NextResponse.json({ error: 'DB 연결 실패' }, { status: 503 });

    const userId = new URL(req.url).searchParams.get('userId');
    if (!userId) return NextResponse.json({ error: 'userId 필요' }, { status: 400 });

    const { data: user, error } = await supabase
      .from('users')
      .select('id, email, name, avatar, pencils, referral_code, is_email_verified, is_admin, collected_flowers, created_at, referred_by')
      .eq('id', userId)
      .single();

    if (error || !user) {
      return NextResponse.json({ error: '사용자를 찾을 수 없습니다.' }, { status: 404 });
    }

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        avatar: user.avatar || '🌸',
        pencils: user.pencils || 0,
        isAdmin: user.is_admin || false,
        isEmailVerified: user.is_email_verified || false,
        referralCode: user.referral_code,
        collectedFlowers: user.collected_flowers || [],
        createdAt: user.created_at,
      }
    });
  } catch (error) {
    return NextResponse.json({ error: '서버 오류' }, { status: 500 });
  }
}

// PATCH /api/user/profile — update user profile
export async function PATCH(req: NextRequest) {
  try {
    const supabase = createServerSupabase();
    if (!supabase) return NextResponse.json({ error: 'DB 연결 실패' }, { status: 503 });

    const { userId, name, avatar } = await req.json();
    if (!userId) return NextResponse.json({ error: 'userId 필요' }, { status: 400 });

    const updates: any = {};
    if (name !== undefined) updates.name = name;
    if (avatar !== undefined) updates.avatar = avatar;
    updates.updated_at = new Date().toISOString();

    const { error } = await supabase.from('users').update(updates).eq('id', userId);
    if (error) {
      return NextResponse.json({ error: '프로필 업데이트 실패' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: '서버 오류' }, { status: 500 });
  }
}
