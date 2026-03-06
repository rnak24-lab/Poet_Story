import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/supabase';

const PENCIL_PRODUCTS: Record<string, { pencils: number; price: number; name: string }> = {
  'pencil-3': { pencils: 3, price: 1000, name: '연필 3자루' },
  'pencil-10': { pencils: 10, price: 2500, name: '연필 10자루' },
  'pencil-30': { pencils: 30, price: 5000, name: '연필 30자루' },
};

// POST: create payment order
export async function POST(req: NextRequest) {
  try {
    const { productId, userId } = await req.json();

    const product = PENCIL_PRODUCTS[productId];
    if (!product) {
      return NextResponse.json({ error: '존재하지 않는 상품입니다.' }, { status: 400 });
    }
    if (!userId) {
      return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 });
    }

    const orderId = `order_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

    const supabase = createServerSupabase();
    if (supabase) {
      await supabase.from('payments').insert({
        user_id: userId,
        order_id: orderId,
        amount: product.price,
        pencils: product.pencils,
        status: 'pending',
      });
    }

    return NextResponse.json({
      orderId,
      amount: product.price,
      orderName: product.name,
      pencils: product.pencils,
    });

  } catch (error) {
    console.error('Payment create error:', error);
    return NextResponse.json({ error: '주문 생성 실패' }, { status: 500 });
  }
}

// GET: product list
export async function GET() {
  return NextResponse.json({
    products: Object.entries(PENCIL_PRODUCTS).map(([id, p]) => ({
      id,
      ...p,
    })),
  });
}
