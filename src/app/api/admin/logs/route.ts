import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/supabase';
import { checkAdmin } from '@/lib/admin-auth';

export const dynamic = 'force-dynamic';

// GET /api/admin/logs — view admin access logs
export async function GET(req: NextRequest) {
  const admin = await checkAdmin(req);
  if (!admin) return NextResponse.json({ error: '관리자 권한이 없습니다.' }, { status: 403 });

  const supabase = createServerSupabase()!;
  const page = parseInt(req.nextUrl.searchParams.get('page') || '1');
  const limit = 50;
  const offset = (page - 1) * limit;
  const actionFilter = req.nextUrl.searchParams.get('action') || '';

  let query = supabase
    .from('admin_logs')
    .select('id, admin_id, admin_name, admin_email, action, target_type, target_id, details, ip_address, created_at', { count: 'exact' });

  if (actionFilter) {
    query = query.eq('action', actionFilter);
  }

  const { data: logs, count, error } = await query
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    console.error('Admin logs error:', error);
    return NextResponse.json({ error: '로그 조회 실패' }, { status: 500 });
  }

  return NextResponse.json({ logs: logs || [], total: count || 0, page, limit });
}
