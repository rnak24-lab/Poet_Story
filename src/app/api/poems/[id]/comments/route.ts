import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/supabase';

// GET /api/poems/[id]/comments — get comments
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const supabase = createServerSupabase();
    if (!supabase) return NextResponse.json({ error: 'DB 연결 실패' }, { status: 503 });

    const { data: comments, error } = await supabase
      .from('comments')
      .select('*')
      .eq('poem_id', params.id)
      .order('created_at', { ascending: true });

    if (error) return NextResponse.json({ error: '댓글 조회 실패' }, { status: 500 });

    return NextResponse.json({
      comments: (comments || []).map(c => ({
        id: c.id,
        poemId: c.poem_id,
        authorId: c.author_id,
        authorName: c.author_name,
        authorAvatar: c.author_avatar || '🌸',
        text: c.text,
        createdAt: c.created_at,
        likes: c.likes || 0,
        likedBy: c.liked_by || [],
      })),
    });
  } catch (error) {
    return NextResponse.json({ error: '서버 오류' }, { status: 500 });
  }
}

// POST /api/poems/[id]/comments — add comment
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const supabase = createServerSupabase();
    if (!supabase) return NextResponse.json({ error: 'DB 연결 실패' }, { status: 503 });

    const { authorId, authorName, authorAvatar, text } = await req.json();
    if (!authorId || !text?.trim()) {
      return NextResponse.json({ error: '댓글 내용을 입력해주세요.' }, { status: 400 });
    }

    const { data: comment, error } = await supabase.from('comments').insert({
      poem_id: params.id,
      author_id: authorId,
      author_name: authorName || '익명',
      author_avatar: authorAvatar || '🌸',
      text: text.trim(),
      likes: 0,
      liked_by: [],
    }).select().single();

    if (error || !comment) {
      console.error('Comment insert error:', error);
      return NextResponse.json({ error: '댓글 작성 실패' }, { status: 500 });
    }

    // Notify poem author
    const { data: poem } = await supabase.from('poems').select('author_id, title').eq('id', params.id).single();
    if (poem && poem.author_id !== authorId) {
      await supabase.from('notifications').insert({
        user_id: poem.author_id,
        type: 'comment',
        message: `"${poem.title || '무제'}"에 ${authorName}님이 댓글을 달았어요: "${text.slice(0, 30)}${text.length > 30 ? '...' : ''}"`,
        poem_id: params.id,
        is_read: false,
      });
    }

    return NextResponse.json({
      comment: {
        id: comment.id,
        poemId: comment.poem_id,
        authorId: comment.author_id,
        authorName: comment.author_name,
        authorAvatar: comment.author_avatar || '🌸',
        text: comment.text,
        createdAt: comment.created_at,
        likes: 0,
        likedBy: [],
      }
    });
  } catch (error) {
    console.error('Comment POST error:', error);
    return NextResponse.json({ error: '서버 오류' }, { status: 500 });
  }
}

// DELETE /api/poems/[id]/comments — delete comment
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const supabase = createServerSupabase();
    if (!supabase) return NextResponse.json({ error: 'DB 연결 실패' }, { status: 503 });

    const { commentId, userId } = await req.json();
    if (!commentId) return NextResponse.json({ error: '댓글 ID 필요' }, { status: 400 });

    // Verify ownership
    const { data: comment } = await supabase.from('comments').select('author_id').eq('id', commentId).single();
    if (!comment) return NextResponse.json({ error: '댓글을 찾을 수 없습니다.' }, { status: 404 });
    if (comment.author_id !== userId) {
      return NextResponse.json({ error: '삭제 권한이 없습니다.' }, { status: 403 });
    }

    await supabase.from('comments').delete().eq('id', commentId);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: '서버 오류' }, { status: 500 });
  }
}
