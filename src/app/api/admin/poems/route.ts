import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

async function checkAdmin(req: NextRequest) {
  const adminId = req.headers.get('x-admin-id');
  if (!adminId) return null;
  const supabase = createServerSupabase();
  if (!supabase) return null;
  const { data } = await supabase.from('users').select('id, is_admin').eq('id', adminId).single();
  return data?.is_admin ? data : null;
}

// GET /api/admin/poems — 게시글 목록
export async function GET(req: NextRequest) {
  const admin = await checkAdmin(req);
  if (!admin) return NextResponse.json({ error: '관리자 권한이 없습니다.' }, { status: 403 });

  const supabase = createServerSupabase()!;
  const search = req.nextUrl.searchParams.get('search') || '';
  const filter = req.nextUrl.searchParams.get('filter') || 'all'; // all, hidden, reported
  const page = parseInt(req.nextUrl.searchParams.get('page') || '1');
  const limit = 50;
  const offset = (page - 1) * limit;

  let query = supabase
    .from('poems')
    .select('id, title, content, author_id, author_name, flower_id, is_hidden, is_auto_generated, likes, views, reports, created_at', { count: 'exact' });

  if (search) {
    query = query.or(`title.ilike.%${search}%,author_name.ilike.%${search}%,content.ilike.%${search}%`);
  }

  if (filter === 'hidden') {
    query = query.eq('is_hidden', true);
  } else if (filter === 'reported') {
    query = query.not('reports', 'is', null).neq('reports', '[]');
  }

  const { data: poems, count, error } = await query
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    console.error('Admin poems error:', error);
    return NextResponse.json({ error: '조회 실패' }, { status: 500 });
  }

  return NextResponse.json({ poems: poems || [], total: count || 0, page, limit });
}

// PATCH /api/admin/poems — 게시글 숨기기/복원/삭제
export async function PATCH(req: NextRequest) {
  const admin = await checkAdmin(req);
  if (!admin) return NextResponse.json({ error: '관리자 권한이 없습니다.' }, { status: 403 });

  const { poemId, action } = await req.json();
  if (!poemId || !action) {
    return NextResponse.json({ error: '필수 정보가 없습니다.' }, { status: 400 });
  }

  const supabase = createServerSupabase()!;

  if (action === 'hide') {
    const { error } = await supabase.from('poems').update({ is_hidden: true }).eq('id', poemId);
    if (error) return NextResponse.json({ error: '처리 실패' }, { status: 500 });
    return NextResponse.json({ success: true, message: '게시글이 숨겨졌습니다.' });
  }

  if (action === 'unhide') {
    const { error } = await supabase.from('poems').update({ is_hidden: false }).eq('id', poemId);
    if (error) return NextResponse.json({ error: '처리 실패' }, { status: 500 });
    return NextResponse.json({ success: true, message: '게시글이 복원되었습니다.' });
  }

  if (action === 'delete') {
    const { error } = await supabase.from('poems').delete().eq('id', poemId);
    if (error) return NextResponse.json({ error: '삭제 실패' }, { status: 500 });
    return NextResponse.json({ success: true, message: '게시글이 삭제되었습니다.' });
  }

  return NextResponse.json({ error: '알 수 없는 액션' }, { status: 400 });
}
