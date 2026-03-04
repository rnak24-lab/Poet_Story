import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/supabase';

// GET /api/notifications?userId=xxx
export async function GET(req: NextRequest) {
  try {
    const supabase = createServerSupabase();
    if (!supabase) return NextResponse.json({ error: '서버 설정 오류입니다. 잠시 후 다시 시도해주세요.' }, { status: 503 });

    const userId = new URL(req.url).searchParams.get('userId');
    if (!userId) return NextResponse.json({ error: 'userId 필요' }, { status: 400 });

    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(100);

    if (error) return NextResponse.json({ error: '알림 조회 실패' }, { status: 500 });

    return NextResponse.json({
      notifications: (data || []).map(n => ({
        id: n.id,
        type: n.type,
        message: n.message,
        poemId: n.poem_id,
        createdAt: n.created_at,
        isRead: n.is_read,
      })),
    });
  } catch (error) {
    return NextResponse.json({ error: '서버 오류' }, { status: 500 });
  }
}

// PATCH /api/notifications — mark read
export async function PATCH(req: NextRequest) {
  try {
    const supabase = createServerSupabase();
    if (!supabase) return NextResponse.json({ error: '서버 설정 오류입니다. 잠시 후 다시 시도해주세요.' }, { status: 503 });

    const { userId, notificationId, markAll } = await req.json();
    if (!userId) return NextResponse.json({ error: 'userId 필요' }, { status: 400 });

    if (markAll) {
      await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('user_id', userId)
        .eq('is_read', false);
    } else if (notificationId) {
      await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', notificationId);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: '서버 오류' }, { status: 500 });
  }
}
