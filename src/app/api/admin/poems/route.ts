import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

async function checkAdmin(req: NextRequest) {
  const adminId = req.headers.get('x-admin-id');
  if (!adminId) return null;
  // Hardcoded admin shortcut (matches login API)
  if (adminId === 'admin') return { id: 'admin', is_admin: true };
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
    .select('id, title, final_poem, author_id, author_name, flower_id, is_hidden, is_auto_generated, likes, views, reports, created_at', { count: 'exact' });

  if (search) {
    query = query.or(`title.ilike.%${search}%,author_name.ilike.%${search}%,final_poem.ilike.%${search}%`);
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

// POST /api/admin/poems — 샘플 시 등록 (seed)
export async function POST(req: NextRequest) {
  const admin = await checkAdmin(req);
  if (!admin) return NextResponse.json({ error: '관리자 권한이 없습니다.' }, { status: 403 });

  const { action, poems: poemsToSeed } = await req.json();

  if (action === 'seed_samples') {
    const supabase = createServerSupabase()!;
    const samplePoems = [
      { flower_id: 'lilac', author_name: '별빛', author_id: 'sample-1', title: '봄바람에게', final_poem: '라일락 향기 흩날리는\n골목길을 걸으면\n네가 떠오른다\n\n바람이 속삭이듯\n스쳐지나간 그 봄날\n아직도 여기 머문다', background: 'bg-purple-50', is_completed: true, is_auto_generated: false, is_hidden: false, likes: 24, liked_by: [], views: 45 },
      { flower_id: 'balloon-flower', author_name: '구름', author_id: 'sample-2', title: '어린 날의 노래', final_poem: '풀밭에 누워\n구름을 세던 날\n세상은 참 넓었고\n\n하루는 참 길었다\n그때의 웃음이\n아직 귓가에 맴돈다', background: 'bg-pink-50', is_completed: true, is_auto_generated: false, is_hidden: false, likes: 18, liked_by: [], views: 32 },
      { flower_id: 'rose', author_name: '달빛', author_id: 'sample-3', title: '사랑이란', final_poem: '가시 위에 핀\n붉은 꽃잎 하나\n\n아프지만 놓을 수 없는\n그 이름을\n오늘도 부른다', background: 'bg-red-50', is_completed: true, is_auto_generated: false, is_hidden: false, likes: 31, liked_by: [], views: 67 },
      { flower_id: 'forsythia', author_name: '햇살', author_id: 'sample-4', title: '희망의 노래', final_poem: '겨울이 깊을수록\n봄은 가까이 오고\n\n어둠이 짙을수록\n별은 더 밝게 빛나니\n\n우리도 그렇게\n피어나리라', background: 'bg-yellow-50', is_completed: true, is_auto_generated: false, is_hidden: false, likes: 42, liked_by: [], views: 88 },
      { flower_id: 'portulaca', author_name: '솜사탕', author_id: 'sample-5', title: '천진난만', final_poem: '웃음이 꽃처럼\n피어나는 아이처럼\n\n거짓 없이\n있는 그대로\n아름다운 것들이\n\n세상에 가득하길', background: 'bg-cream-100', is_completed: true, is_auto_generated: false, is_hidden: false, likes: 15, liked_by: [], views: 21 },
      { flower_id: 'moss-phlox', author_name: '나무', author_id: 'sample-6', title: '묵묵한 사랑', final_poem: '말없이 내려놓은\n따뜻한 밥상 위에\n\n세상 모든 말보다\n깊은 사랑이 있다\n\n그걸 알아차린 건\n한참이 지나서였다', background: 'bg-green-50', is_completed: true, is_auto_generated: false, is_hidden: false, likes: 27, liked_by: [], views: 53 },
    ];

    // Check which samples already exist (by title + author_name)
    const { data: existing } = await supabase
      .from('poems')
      .select('title, author_name')
      .in('author_id', ['sample-1', 'sample-2', 'sample-3', 'sample-4', 'sample-5', 'sample-6']);

    const existingSet = new Set((existing || []).map(e => `${e.title}|${e.author_name}`));
    const newPoems = samplePoems.filter(p => !existingSet.has(`${p.title}|${p.author_name}`));

    if (newPoems.length === 0) {
      return NextResponse.json({ success: true, message: '이미 모든 샘플 시가 등록되어 있습니다.', inserted: 0 });
    }

    const { error } = await supabase.from('poems').insert(newPoems);
    if (error) {
      console.error('Seed poems error:', error);
      return NextResponse.json({ error: '샘플 시 등록 실패: ' + error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: `샘플 시 ${newPoems.length}개가 등록되었습니다.`, inserted: newPoems.length });
  }

  return NextResponse.json({ error: '알 수 없는 액션' }, { status: 400 });
}
