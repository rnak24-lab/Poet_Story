import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/supabase';

export async function POST(req: NextRequest) {
  try {
    const { paymentKey, orderId, amount } = await req.json();

    if (!paymentKey || !orderId || !amount) {
      return NextResponse.json({ error: '결제 정보가 올바르지 않습니다.' }, { status: 400 });
    }

    const supabase = createServerSupabase();
    if (!supabase) {
      return NextResponse.json({ error: 'DB가 연결되지 않았습니다.' }, { status: 503 });
    }

    const { data: order } = await supabase
      .from('payments')
      .select('*')
      .eq('order_id', orderId)
      .eq('status', 'pending')
      .single();

    if (!order) {
      return NextResponse.json({ error: '주문을 찾을 수 없습니다.' }, { status: 404 });
    }

    if (order.amount !== amount) {
      return NextResponse.json({ error: '결제 금액이 일치하지 않습니다.' }, { status: 400 });
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

    const { data: user } = await supabase
      .from('users')
      .select('pencils')
      .eq('id', order.user_id)
      .single();

    if (user) {
      await supabase
        .from('users')
        .update({ pencils: (user.pencils || 0) + order.pencils })
        .eq('id', order.user_id);
    }

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
