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

// GET /api/admin/users — 회원 목록
export async function GET(req: NextRequest) {
  const admin = await checkAdmin(req);
  if (!admin) return NextResponse.json({ error: '관리자 권한이 없습니다.' }, { status: 403 });

  const supabase = createServerSupabase()!;
  const search = req.nextUrl.searchParams.get('search') || '';
  const page = parseInt(req.nextUrl.searchParams.get('page') || '1');
  const limit = 50;
  const offset = (page - 1) * limit;

  let query = supabase
    .from('users')
    .select('id, email, name, avatar, pencils, referral_code, is_email_verified, is_admin, provider, collected_flowers, created_at, withdrawal_requested_at', { count: 'exact' });

  if (search) {
    query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%`);
  }

  const { data: users, count, error } = await query
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    return NextResponse.json({ error: '조회 실패' }, { status: 500 });
  }

  return NextResponse.json({ users: users || [], total: count || 0, page, limit });
}

// PATCH /api/admin/users — 회원 정보 수정 (연필, 관리자 등)
export async function PATCH(req: NextRequest) {
  const admin = await checkAdmin(req);
  if (!admin) return NextResponse.json({ error: '관리자 권한이 없습니다.' }, { status: 403 });

  const { userId, action, value } = await req.json();
  if (!userId || !action) {
    return NextResponse.json({ error: '필수 정보가 없습니다.' }, { status: 400 });
  }

  const supabase = createServerSupabase()!;

  if (action === 'set_pencils') {
    const { error } = await supabase.from('users').update({ pencils: value }).eq('id', userId);
    if (error) return NextResponse.json({ error: '수정 실패' }, { status: 500 });
    return NextResponse.json({ success: true, message: `연필이 ${value}자루로 변경되었습니다.` });
  }

  if (action === 'force_withdraw') {
    const { error } = await supabase.from('users').update({ withdrawal_requested_at: new Date().toISOString() }).eq('id', userId);
    if (error) return NextResponse.json({ error: '처리 실패' }, { status: 500 });
    return NextResponse.json({ success: true, message: '강제 탈퇴 처리되었습니다.' });
  }

  if (action === 'cancel_withdraw') {
    const { error } = await supabase.from('users').update({ withdrawal_requested_at: null }).eq('id', userId);
    if (error) return NextResponse.json({ error: '처리 실패' }, { status: 500 });
    return NextResponse.json({ success: true, message: '탈퇴가 취소되었습니다.' });
  }

  return NextResponse.json({ error: '알 수 없는 액션' }, { status: 400 });
}
