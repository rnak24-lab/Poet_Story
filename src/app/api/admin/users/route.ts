import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/supabase';
import { checkAdmin, logAdminAction } from '@/lib/admin-auth';

export const dynamic = 'force-dynamic';

// GET /api/admin/users — 회원 목록
export async function GET(req: NextRequest) {
  const admin = await checkAdmin(req);
  if (!admin) return NextResponse.json({ error: '관리자 권한이 없습니다.' }, { status: 403 });

  const supabase = createServerSupabase()!;
  const search = req.nextUrl.searchParams.get('search') || '';

  // Log admin access
  await logAdminAction({
    adminId: admin.id, adminName: admin.name, adminEmail: admin.email,
    action: 'view_users', targetType: 'user',
    details: search ? `검색: ${search}` : '회원 목록 조회',
    req,
  });
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
    await logAdminAction({
      adminId: admin.id, adminName: admin.name, adminEmail: admin.email,
      action: 'set_pencils', targetType: 'user', targetId: userId,
      details: `연필 ${value}자루로 변경`, req,
    });
    return NextResponse.json({ success: true, message: `연필이 ${value}자루로 변경되었습니다.` });
  }

  if (action === 'force_withdraw') {
    const { error } = await supabase.from('users').update({ withdrawal_requested_at: new Date().toISOString() }).eq('id', userId);
    if (error) return NextResponse.json({ error: '처리 실패' }, { status: 500 });
    await logAdminAction({
      adminId: admin.id, adminName: admin.name, adminEmail: admin.email,
      action: 'force_withdraw', targetType: 'user', targetId: userId,
      details: '강제 탈퇴 처리', req,
    });
    return NextResponse.json({ success: true, message: '강제 탈퇴 처리되었습니다.' });
  }

  if (action === 'cancel_withdraw') {
    const { error } = await supabase.from('users').update({ withdrawal_requested_at: null }).eq('id', userId);
    if (error) return NextResponse.json({ error: '처리 실패' }, { status: 500 });
    await logAdminAction({
      adminId: admin.id, adminName: admin.name, adminEmail: admin.email,
      action: 'cancel_withdraw', targetType: 'user', targetId: userId,
      details: '탈퇴 취소', req,
    });
    return NextResponse.json({ success: true, message: '탈퇴가 취소되었습니다.' });
  }

  return NextResponse.json({ error: '알 수 없는 액션' }, { status: 400 });
}
