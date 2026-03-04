import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/supabase';

// POST /api/poems/[id]/like — like/unlike toggle
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const supabase = createServerSupabase();
    if (!supabase) return NextResponse.json({ error: '서버 설정 오류입니다. 잠시 후 다시 시도해주세요.' }, { status: 503 });

    const { id } = params;
    const { userId, action } = await req.json(); // action: 'like' | 'unlike'

    if (!userId) return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 });

    const { data: poem } = await supabase.from('poems').select('likes, liked_by').eq('id', id).single();
    if (!poem) return NextResponse.json({ error: '시를 찾을 수 없습니다.' }, { status: 404 });

    const likedBy: string[] = poem.liked_by || [];
    let newLikes = poem.likes || 0;
    let newLikedBy = [...likedBy];

    if (action === 'unlike') {
      newLikedBy = newLikedBy.filter(uid => uid !== userId);
      newLikes = Math.max(0, newLikes - 1);
    } else {
      if (!newLikedBy.includes(userId)) {
        newLikedBy.push(userId);
        newLikes += 1;
      }
    }

    await supabase.from('poems').update({ likes: newLikes, liked_by: newLikedBy }).eq('id', id);

    // Create notification for poem author (if liking, not self)
    if (action !== 'unlike') {
      const { data: poemFull } = await supabase.from('poems').select('author_id, title').eq('id', id).single();
      if (poemFull && poemFull.author_id !== userId) {
        await supabase.from('notifications').insert({
          user_id: poemFull.author_id,
          type: 'like',
          message: `"${poemFull.title || '무제'}"에 좋아요가 눌렸어요!`,
          poem_id: id,
          is_read: false,
        });
      }
    }

    return NextResponse.json({ likes: newLikes, likedBy: newLikedBy });
  } catch (error) {
    console.error('Like error:', error);
    return NextResponse.json({ error: '서버 오류' }, { status: 500 });
  }
}
