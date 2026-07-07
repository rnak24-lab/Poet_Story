import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/supabase';
import { getSessionUserId } from '@/lib/user-auth';

/**
 * POST /api/payment/confirm-test
 * Test-mode payment confirmation — no Toss API call.
 * Marks a pending payment as 'confirmed' and grants pencils to the user.
 * Only works when TOSS_SECRET_KEY is not set (test environment).
 */
export async function POST(req: NextRequest) {
  try {
    // If real Toss key is configured, reject test-mode confirms
    if (process.env.TOSS_SECRET_KEY) {
      return NextResponse.json(
        { error: '테스트 모드가 아닙니다.' },
        { status: 403 }
      );
    }

    const { orderId } = await req.json();
    const userId = getSessionUserId(req);

    if (!orderId || !userId) {
      return NextResponse.json(
        { error: '주문 정보가 올바르지 않습니다.' },
        { status: 400 }
      );
    }

    const supabase = createServerSupabase();
    if (!supabase) {
      return NextResponse.json({ error: 'DB 연결 실패' }, { status: 503 });
    }

    // Find the pending payment
    const { data: order } = await supabase
      .from('payments')
      .select('*')
      .eq('order_id', orderId)
      .eq('user_id', userId)
      .eq('status', 'pending')
      .single();

    if (!order) {
      return NextResponse.json(
        { error: '주문을 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    // Mark as confirmed (test mode — no real payment key)
    await supabase
      .from('payments')
      .update({
        status: 'confirmed',
        payment_key: `test_${orderId}`,
        confirmed_at: new Date().toISOString(),
      })
      .eq('order_id', orderId);

    // Grant pencils to user (원자적)
    await supabase.rpc('increment_pencils', { p_user_id: userId, p_delta: order.pencils });

    return NextResponse.json({
      success: true,
      pencils: order.pencils,
      message: `연필 ${order.pencils}자루가 지급되었습니다! (테스트)`,
    });
  } catch (error) {
    console.error('Test payment confirm error:', error);
    return NextResponse.json(
      { error: '결제 처리 중 오류' },
      { status: 500 }
    );
  }
}
