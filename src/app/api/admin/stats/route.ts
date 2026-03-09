import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/supabase';
import { checkAdmin, logAdminAction } from '@/lib/admin-auth';

export const dynamic = 'force-dynamic';

// GET /api/admin/stats — dashboard overview
export async function GET(req: NextRequest) {
  const admin = await checkAdmin(req);
  if (!admin) return NextResponse.json({ error: '관리자 권한이 없습니다.' }, { status: 403 });

  // Log admin access
  await logAdminAction({
    adminId: admin.id, adminName: admin.name, adminEmail: admin.email,
    action: 'view_stats', targetType: 'stats',
    details: '대시보드 개요 조회',
    req,
  });

  const supabase = createServerSupabase()!;

  const { count: userCount } = await supabase.from('users').select('*', { count: 'exact', head: true });
  const { count: verifiedCount } = await supabase.from('users').select('*', { count: 'exact', head: true }).eq('is_email_verified', true);
  const { count: withdrawalCount } = await supabase.from('users').select('*', { count: 'exact', head: true }).not('withdrawal_requested_at', 'is', null);
  const { count: poemCount } = await supabase.from('poems').select('*', { count: 'exact', head: true });
  const { count: hiddenCount } = await supabase.from('poems').select('*', { count: 'exact', head: true }).eq('is_hidden', true);

  // Recent 7 days poem counts
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const { data: recentPoems } = await supabase
    .from('poems')
    .select('created_at')
    .gte('created_at', sevenDaysAgo.toISOString());

  const dailyCounts: Record<string, number> = {};
  (recentPoems || []).forEach(p => {
    const day = p.created_at.slice(0, 10);
    dailyCounts[day] = (dailyCounts[day] || 0) + 1;
  });

  return NextResponse.json({
    users: userCount || 0,
    verifiedUsers: verifiedCount || 0,
    withdrawalPending: withdrawalCount || 0,
    poems: poemCount || 0,
    hiddenPoems: hiddenCount || 0,
    dailyCounts,
  });
}
