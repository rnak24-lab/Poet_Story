import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/supabase';

// POST /api/poems/[id]/report — report a poem
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const supabase = createServerSupabase();
    if (!supabase) return NextResponse.json({ error: 'DB 연결 실패' }, { status: 503 });

    const { reporterId, reporterName, reason } = await req.json();
    if (!reporterId || !reason?.trim()) {
      return NextResponse.json({ error: '신고 사유를 입력해주세요.' }, { status: 400 });
    }

    const { error } = await supabase.from('reports').insert({
      poem_id: params.id,
      reporter_id: reporterId,
      reporter_name: reporterName || '익명',
      reason: reason.trim(),
      status: 'pending',
    });

    if (error) {
      console.error('Report insert error:', error);
      return NextResponse.json({ error: '신고 실패' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: '서버 오류' }, { status: 500 });
  }
}
