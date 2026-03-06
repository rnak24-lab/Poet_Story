'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAppStore } from '@/store/useAppStore';
import Link from 'next/link';

const PRODUCTS = [
  { id: 'pencil-3', name: '연필 3자루', pencils: 3, price: 1000, discount: '', perUnit: 333 },
  { id: 'pencil-10', name: '연필 10자루', pencils: 10, price: 2500, discount: '25% 할인', perUnit: 250 },
  { id: 'pencil-30', name: '연필 30자루', pencils: 30, price: 5000, discount: '50% 할인', perUnit: 167 },
];

export default function PaymentPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="text-4xl gentle-float">✏️</div></div>}>
      <PaymentContent />
    </Suspense>
  );
}

function PaymentContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, isLoggedIn, buyPencils } = useAppStore();
  const [mounted, setMounted] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    setMounted(true);
    // Check for success/fail from Toss redirect
    if (searchParams.get('fail')) {
      setError('결제가 취소되었거나 실패했습니다.');
    }
  }, []);

  // Handle Toss success redirect (paymentKey, orderId, amount come as query params)
  useEffect(() => {
    const paymentKey = searchParams.get('paymentKey');
    const orderId = searchParams.get('orderId');
    const amount = searchParams.get('amount');

    if (paymentKey && orderId && amount) {
      confirmPayment(paymentKey, orderId, Number(amount));
    }
  }, [searchParams]);

  const confirmPayment = async (paymentKey: string, orderId: string, amount: number) => {
    setIsProcessing(true);
    try {
      const res = await fetch('/api/payment/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paymentKey, orderId, amount }),
      });
      const data = await res.json();

      if (data.success) {
        // Also update local store
        buyPencils(data.pencils);
        setSuccess(data.message || `연필 ${data.pencils}자루가 지급되었습니다!`);
        // Clear URL params
        router.replace('/payment');
      } else {
        setError(data.error || '결제 확인 중 오류가 발생했습니다.');
      }
    } catch {
      setError('결제 확인 중 오류가 발생했습니다.');
    } finally {
      setIsProcessing(false);
    }
  };

  if (!mounted) return null;

  const handlePurchase = async (productId: string) => {
    if (!isLoggedIn || !user) {
      setError('로그인이 필요합니다.');
      return;
    }

    setIsProcessing(true);
    setError('');
    setSelectedProduct(productId);

    try {
      // 1. Create order
      const orderRes = await fetch('/api/payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId, userId: user.id }),
      });
      const orderData = await orderRes.json();

      if (!orderRes.ok) {
        setError(orderData.error || '주문 생성 실패');
        setIsProcessing(false);
        return;
      }

      // 2. Invoke Toss Payments widget
      const clientKey = process.env.NEXT_PUBLIC_TOSS_CLIENT_KEY;
      if (!clientKey) {
        // No Toss key configured - use local-only mode for now
        buyPencils(orderData.pencils);
        setSuccess(`연필 ${orderData.pencils}자루가 지급되었습니다! (테스트 모드)`);
        setIsProcessing(false);
        return;
      }

      const { loadTossPayments } = await import('@tosspayments/tosspayments-sdk');
      const tossPayments = await loadTossPayments(clientKey);
      const payment = tossPayments.payment({
        customerKey: `customer_${user.id}`,
      });

      await payment.requestPayment({
        method: 'CARD',
        amount: { currency: 'KRW', value: orderData.amount },
        orderId: orderData.orderId,
        orderName: orderData.orderName,
        successUrl: `${window.location.origin}/payment?orderId=${orderData.orderId}`,
        failUrl: `${window.location.origin}/payment?fail=true`,
      });

    } catch (err: any) {
      if (err?.code === 'USER_CANCEL') {
        // User cancelled - do nothing
      } else {
        setError('결제 처리 중 문제가 발생했습니다.');
      }
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-warm-50 pb-12">
      <div className="px-6 pt-8 pb-4">
        <Link href="/profile" className="text-ink-300 text-sm">← 돌아가기</Link>
        <h1 className="text-2xl font-bold text-ink-700 mt-4">연필 구매 ✏️</h1>
        <p className="text-sm text-ink-400 mt-1">연필로 AI 시 쓰기 기능을 이용하세요</p>
        {isLoggedIn && user && (
          <p className="text-sm text-amber-600 mt-2 font-medium">현재 보유: ✏️ {user.pencils || 0}자루</p>
        )}
      </div>

      {!isLoggedIn && (
        <div className="px-6 mb-4">
          <div className="bg-warm-100 rounded-xl p-4 text-center">
            <p className="text-sm text-ink-500 mb-2">로그인 후 연필을 구매할 수 있어요</p>
            <Link href="/profile" className="text-sm text-ink-600 underline font-medium">로그인하기 →</Link>
          </div>
        </div>
      )}

      {error && (
        <div className="px-6 mb-4">
          <div className="bg-red-50 text-red-600 rounded-xl p-3 text-sm">{error}</div>
        </div>
      )}

      {success && (
        <div className="px-6 mb-4">
          <div className="bg-sage-100 text-sage-500 rounded-xl p-3 text-sm font-medium">{success}</div>
        </div>
      )}

      <div className="px-6 space-y-3">
        {PRODUCTS.map(product => (
          <button
            key={product.id}
            onClick={() => handlePurchase(product.id)}
            disabled={isProcessing || !isLoggedIn}
            className={`w-full text-left p-5 rounded-card transition-all border-2 ${
              selectedProduct === product.id
                ? 'border-warm-400 bg-warm-50'
                : 'border-transparent bg-white hover:shadow-sm'
            } ${isProcessing || !isLoggedIn ? 'opacity-50' : ''}`}
          >
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-lg">✏️</span>
                  <span className="font-bold text-ink-700">{product.name}</span>
                  {product.discount && (
                    <span className="text-xs bg-red-100 text-red-500 px-2 py-0.5 rounded-full font-medium">
                      {product.discount}
                    </span>
                  )}
                </div>
                <p className="text-xs text-ink-300 mt-1">자동 완성 {product.pencils}회 이용 가능</p>
              </div>
              <div className="text-right">
                <p className="text-lg font-bold text-ink-700">{product.price.toLocaleString()}원</p>
                <p className="text-xs text-ink-300">자루당 {product.perUnit}원</p>
              </div>
            </div>
          </button>
        ))}
      </div>

      <div className="px-6 mt-8">
        <div className="bg-cream-100 rounded-xl p-4 text-xs text-ink-400 space-y-1.5">
          <p className="font-medium text-ink-500">안내사항</p>
          <p>• 연필 1자루로 AI 시 쓰기 1회 이용 가능</p>
          <p>• 구매한 연필은 사용 기한이 없습니다</p>
          <p>• 결제 완료 후 즉시 지급됩니다</p>
          <p>• 추천 코드 입력으로도 연필을 받을 수 있어요!</p>
          <p>• 결제 관련 문의: support@sigeuldam.kr</p>
        </div>
      </div>

      {/* Free alternatives */}
      <div className="px-6 mt-4">
        <div className="bg-purple-50 rounded-xl p-4 text-xs text-ink-400 space-y-1.5">
          <p className="font-medium text-purple-600">연필 받는 방법</p>
          <p>🎁 추천인 코드 입력 → 서로 1자루씩</p>
        </div>
      </div>
    </div>
  );
}
