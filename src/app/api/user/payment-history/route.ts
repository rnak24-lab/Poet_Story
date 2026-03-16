import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

// GET /api/user/payment-history — 결제 내역 조회
export async function GET(req: NextRequest) {
  try {
    const userId = req.nextUrl.searchParams.get('userId');
    if (!userId) {
      return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 });
    }

    const supabase = createServerSupabase();
    if (!supabase) {
      return NextResponse.json({ error: 'DB 연결 실패' }, { status: 503 });
    }

    // Fetch confirmed / refunded payments for this user
    const { data: payments, error } = await supabase
      .from('payments')
      .select('*')
      .eq('user_id', userId)
      .in('status', ['confirmed', 'refunded', 'partial_refunded'])
      .order('confirmed_at', { ascending: false });

    if (error) {
      console.error('Payment history fetch error:', error);
      return NextResponse.json({ error: '결제 내역 조회 실패' }, { status: 500 });
    }

    // Get user's current pencil count
    const { data: user } = await supabase
      .from('users')
      .select('pencils')
      .eq('id', userId)
      .single();

    const currentPencils = user?.pencils || 0;

    // Calculate refund eligibility for each payment
    const history = (payments || []).map((p: any) => {
      const confirmedAt = p.confirmed_at ? new Date(p.confirmed_at) : null;
      const now = new Date();
      const daysSincePayment = confirmedAt
        ? Math.floor((now.getTime() - confirmedAt.getTime()) / (1000 * 60 * 60 * 24))
        : 999;

      const isWithin7Days = daysSincePayment <= 7;
      const isAlreadyRefunded = p.status === 'refunded' || p.status === 'partial_refunded';
      const refundedPencils = p.refunded_pencils || 0;
      const remainingPencils = p.pencils - refundedPencils; // pencils from this order that haven't been refunded

      // Determine refund eligibility
      let refundable = false;
      let refundablePencils = 0;
      let refundableAmount = 0;
      let refundDenyReason = '';

      if (isAlreadyRefunded && remainingPencils <= 0) {
        refundDenyReason = '이미 환불 처리된 결제입니다.';
      } else if (!isWithin7Days) {
        refundDenyReason = '결제일로부터 7일이 경과하여 환불이 불가합니다.';
      } else if (!confirmedAt) {
        refundDenyReason = '결제 확인 정보가 없습니다.';
      } else {
        // Within 7 days — check how many pencils the user still has
        // Refundable = min(remaining pencils from this order, user's current total pencils)
        refundablePencils = Math.min(remainingPencils, currentPencils);
        if (refundablePencils <= 0) {
          refundDenyReason = '구매한 연필을 모두 사용하여 환불이 불가합니다.';
        } else {
          refundable = true;
          // Pro-rate: (refundable pencils / total pencils in order) * order amount
          const perPencilPrice = p.amount / p.pencils;
          refundableAmount = Math.round(perPencilPrice * refundablePencils);
        }
      }

      return {
        id: p.id,
        orderId: p.order_id,
        amount: p.amount,
        pencils: p.pencils,
        status: p.status,
        paymentKey: p.payment_key,
        confirmedAt: p.confirmed_at,
        createdAt: p.created_at,
        refundedPencils,
        refundedAmount: p.refunded_amount || 0,
        refundedAt: p.refunded_at || null,
        // Refund eligibility
        daysSincePayment,
        isWithin7Days,
        refundable,
        refundablePencils,
        refundableAmount,
        refundDenyReason,
      };
    });

    return NextResponse.json({
      payments: history,
      currentPencils,
    });
  } catch (error) {
    console.error('Payment history error:', error);
    return NextResponse.json({ error: '결제 내역 조회 중 오류' }, { status: 500 });
  }
}
