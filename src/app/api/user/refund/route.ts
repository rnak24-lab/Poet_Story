import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/supabase';

// POST /api/user/refund — 환불 요청 처리
export async function POST(req: NextRequest) {
  try {
    const { userId, paymentId } = await req.json();

    if (!userId || !paymentId) {
      return NextResponse.json({ error: '필수 정보가 없습니다.' }, { status: 400 });
    }

    const supabase = createServerSupabase();
    if (!supabase) {
      return NextResponse.json({ error: 'DB 연결 실패' }, { status: 503 });
    }

    // 1. Get the payment record
    const { data: payment, error: paymentError } = await supabase
      .from('payments')
      .select('*')
      .eq('id', paymentId)
      .eq('user_id', userId)
      .single();

    if (paymentError || !payment) {
      return NextResponse.json({ error: '결제 내역을 찾을 수 없습니다.' }, { status: 404 });
    }

    // 2. Validate payment status
    if (payment.status === 'refunded') {
      return NextResponse.json({ error: '이미 전액 환불된 결제입니다.' }, { status: 400 });
    }
    if (payment.status !== 'confirmed' && payment.status !== 'partial_refunded') {
      return NextResponse.json({ error: '환불 가능한 상태가 아닙니다.' }, { status: 400 });
    }

    // 3. Check 7-day window
    const confirmedAt = payment.confirmed_at ? new Date(payment.confirmed_at) : null;
    if (!confirmedAt) {
      return NextResponse.json({ error: '결제 확인 정보가 없습니다.' }, { status: 400 });
    }

    const now = new Date();
    const daysSincePayment = Math.floor(
      (now.getTime() - confirmedAt.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (daysSincePayment > 7) {
      return NextResponse.json({
        error: '결제일로부터 7일이 경과하여 환불이 불가합니다.',
      }, { status: 400 });
    }

    // 4. Get user's current pencils
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('pencils')
      .eq('id', userId)
      .single();

    if (userError || !user) {
      return NextResponse.json({ error: '사용자 정보를 찾을 수 없습니다.' }, { status: 404 });
    }

    const currentPencils = user.pencils || 0;
    const alreadyRefundedPencils = payment.refunded_pencils || 0;
    const remainingFromOrder = payment.pencils - alreadyRefundedPencils;

    // Refundable pencils = min(remaining from this order, user's current pencils)
    const refundablePencils = Math.min(remainingFromOrder, currentPencils);

    if (refundablePencils <= 0) {
      return NextResponse.json({
        error: '환불 가능한 연필이 없습니다. 구매한 연필을 모두 사용한 경우 환불이 불가합니다.',
      }, { status: 400 });
    }

    // 5. Calculate refund amount
    const perPencilPrice = payment.amount / payment.pencils;
    const refundAmount = Math.round(perPencilPrice * refundablePencils);
    const totalRefundedPencils = alreadyRefundedPencils + refundablePencils;
    const totalRefundedAmount = (payment.refunded_amount || 0) + refundAmount;
    const isFullRefund = totalRefundedPencils >= payment.pencils;

    // 6. Try Toss Payments cancel (if payment_key exists)
    const tossSecretKey = process.env.TOSS_SECRET_KEY;
    if (payment.payment_key && tossSecretKey) {
      try {
        const cancelResponse = await fetch(
          `https://api.tosspayments.com/v1/payments/${payment.payment_key}/cancel`,
          {
            method: 'POST',
            headers: {
              'Authorization': `Basic ${Buffer.from(tossSecretKey + ':').toString('base64')}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              cancelReason: isFullRefund
                ? '사용자 청약철회 (전액 환불)'
                : `사용자 부분 환불 (${refundablePencils}자루 / ${payment.pencils}자루)`,
              cancelAmount: refundAmount,
            }),
          }
        );

        if (!cancelResponse.ok) {
          const errData = await cancelResponse.json().catch(() => ({}));
          console.error('Toss cancel failed:', errData);
          return NextResponse.json({
            error: (errData as any).message || '결제 취소 처리 중 오류가 발생했습니다. support@sigeuldam.kr로 문의해주세요.',
          }, { status: 400 });
        }
      } catch (tossErr) {
        console.error('Toss cancel network error:', tossErr);
        return NextResponse.json({
          error: '결제 취소 서버 통신 오류. support@sigeuldam.kr로 문의해주세요.',
        }, { status: 500 });
      }
    }

    // 7. Update payment record
    const { error: updatePaymentError } = await supabase
      .from('payments')
      .update({
        status: isFullRefund ? 'refunded' : 'partial_refunded',
        refunded_pencils: totalRefundedPencils,
        refunded_amount: totalRefundedAmount,
        refunded_at: now.toISOString(),
      })
      .eq('id', paymentId);

    if (updatePaymentError) {
      console.error('Payment update error:', updatePaymentError);
      return NextResponse.json({ error: '환불 기록 업데이트 실패' }, { status: 500 });
    }

    // 8. Deduct pencils from user
    const newPencils = Math.max(0, currentPencils - refundablePencils);
    const { error: updateUserError } = await supabase
      .from('users')
      .update({ pencils: newPencils })
      .eq('id', userId);

    if (updateUserError) {
      console.error('User pencils update error:', updateUserError);
      // Revert payment status on user update failure
      await supabase
        .from('payments')
        .update({
          status: payment.status,
          refunded_pencils: alreadyRefundedPencils,
          refunded_amount: payment.refunded_amount || 0,
          refunded_at: payment.refunded_at || null,
        })
        .eq('id', paymentId);
      return NextResponse.json({ error: '연필 차감 실패. 다시 시도해주세요.' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: isFullRefund
        ? `전액 환불이 완료되었습니다. (${refundAmount.toLocaleString()}원)`
        : `부분 환불이 완료되었습니다. (${refundablePencils}자루, ${refundAmount.toLocaleString()}원)`,
      refundedPencils: refundablePencils,
      refundedAmount: refundAmount,
      remainingPencils: newPencils,
      isFullRefund,
    });

  } catch (error) {
    console.error('Refund error:', error);
    return NextResponse.json({ error: '환불 처리 중 오류가 발생했습니다.' }, { status: 500 });
  }
}
