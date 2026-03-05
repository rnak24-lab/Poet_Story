import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

// Admin auth check helper
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

// GET /api/admin/stats — dashboard overview
export async function GET(req: NextRequest) {
  const admin = await checkAdmin(req);
  if (!admin) return NextResponse.json({ error: '관리자 권한이 없습니다.' }, { status: 403 });

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
