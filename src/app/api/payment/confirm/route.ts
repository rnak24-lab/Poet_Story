import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/supabase';
import { getSessionUserId } from '@/lib/user-auth';

export async function POST(req: NextRequest) {
  try {
    const { paymentKey, orderId, amount } = await req.json();

    if (!paymentKey || !orderId || !amount) {
      return NextResponse.json({ error: '결제 정보가 올바르지 않습니다.' }, { status: 400 });
    }

    // 세션 필수 — 남의 주문을 승인/지급하지 못하도록.
    const sessionUserId = getSessionUserId(req);
    if (!sessionUserId) return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 });

    const supabase = createServerSupabase();
    if (!supabase) {
      return NextResponse.json({ error: 'DB가 연결되지 않았습니다.' }, { status: 503 });
    }

    // 먼저 주문을 조회해 금액을 검증한다 (아직 상태는 바꾸지 않음)
    const { data: order } = await supabase
      .from('payments')
      .select('*')
      .eq('order_id', orderId)
      .single();

    if (!order) {
      return NextResponse.json({ error: '주문을 찾을 수 없습니다.' }, { status: 404 });
    }

    // 주문 소유자만 승인 가능.
    if (order.user_id !== sessionUserId) {
      return NextResponse.json({ error: '본인의 주문만 승인할 수 있습니다.' }, { status: 403 });
    }

    // 이미 승인된 주문이면 멱등 응답 (재요청/새로고침으로 인한 이중 지급 방지)
    if (order.status === 'confirmed') {
      return NextResponse.json({
        success: true,
        pencils: order.pencils,
        message: `연필 ${order.pencils}자루가 지급되었습니다!`,
        alreadyConfirmed: true,
      });
    }

    if (order.status !== 'pending') {
      return NextResponse.json({ error: '처리할 수 없는 주문 상태입니다.' }, { status: 400 });
    }

    if (order.amount !== amount) {
      return NextResponse.json({ error: '결제 금액이 일치하지 않습니다.' }, { status: 400 });
    }

    // 단일 처리 보장: pending → confirming 원자적 전환에 성공한 요청만 승인을 진행한다.
    // 동시 요청 중 하나만 이 update의 소유권을 얻으므로 Toss 이중 승인/이중 지급을 막는다.
    const { data: claimed } = await supabase
      .from('payments')
      .update({ status: 'confirming' })
      .eq('order_id', orderId)
      .eq('status', 'pending')
      .select()
      .single();

    if (!claimed) {
      // 다른 요청이 먼저 선점 → 이미 처리 중이므로 멱등 성공 처리
      return NextResponse.json({
        success: true,
        pencils: order.pencils,
        message: `연필 ${order.pencils}자루가 지급되었습니다!`,
        alreadyConfirmed: true,
      });
    }

    // Toss Payments confirm API
    const tossSecretKey = process.env.TOSS_SECRET_KEY;
    if (!tossSecretKey) {
      return NextResponse.json({ error: '결제 시스템 설정 오류' }, { status: 500 });
    }

    const confirmResponse = await fetch('https://api.tosspayments.com/v1/payments/confirm', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${Buffer.from(tossSecretKey + ':').toString('base64')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ paymentKey, orderId, amount }),
    });

    if (!confirmResponse.ok) {
      const errData = await confirmResponse.json().catch(() => ({}));
      console.error('Toss confirm failed:', errData);

      await supabase
        .from('payments')
        .update({ status: 'failed' })
        .eq('order_id', orderId);

      return NextResponse.json({
        error: (errData as any).message || '결제 승인에 실패했습니다.',
      }, { status: 400 });
    }

    // Payment success - grant pencils
    await supabase
      .from('payments')
      .update({
        status: 'confirmed',
        payment_key: paymentKey,
        confirmed_at: new Date().toISOString(),
      })
      .eq('order_id', orderId);

    // 원자적 지급 (동시요청·읽고쓰기 경쟁 방지).
    await supabase.rpc('increment_pencils', { p_user_id: order.user_id, p_delta: order.pencils });

    return NextResponse.json({
      success: true,
      pencils: order.pencils,
      message: `연필 ${order.pencils}자루가 지급되었습니다!`,
    });

  } catch (error) {
    console.error('Payment confirm error:', error);
    return NextResponse.json({ error: '결제 처리 중 오류가 발생했습니다.' }, { status: 500 });
  }
}
