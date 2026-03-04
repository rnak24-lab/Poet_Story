import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/supabase';

// POST /api/poems/[id]/view — increment view count
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const supabase = createServerSupabase();
    if (!supabase) return NextResponse.json({ error: '서버 설정 오류입니다. 잠시 후 다시 시도해주세요.' }, { status: 503 });

    const { id } = params;

    const { data: poem } = await supabase.from('poems').select('views, author_id, title').eq('id', id).single();
    if (!poem) return NextResponse.json({ error: '시를 찾을 수 없습니다.' }, { status: 404 });

    const newViews = (poem.views || 0) + 1;
    await supabase.from('poems').update({ views: newViews }).eq('id', id);

    // View milestone notifications
    if (newViews === 10 || newViews === 50 || newViews === 100) {
      await supabase.from('notifications').insert({
        user_id: poem.author_id,
        type: 'view_milestone',
        message: `"${poem.title || '무제'}"을 ${newViews}명이 읽었어요!`,
        poem_id: id,
        is_read: false,
      });
    }

    return NextResponse.json({ views: newViews });
  } catch (error) {
    console.error('View error:', error);
    return NextResponse.json({ error: '서버 오류' }, { status: 500 });
  }
}
