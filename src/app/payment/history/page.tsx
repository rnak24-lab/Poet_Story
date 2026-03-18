'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAppStore } from '@/store/useAppStore';
import Link from 'next/link';

interface PaymentRecord {
  id: string;
  orderId: string;
  amount: number;
  pencils: number;
  status: string;
  paymentKey: string | null;
  confirmedAt: string;
  createdAt: string;
  refundedPencils: number;
  refundedAmount: number;
  refundedAt: string | null;
  daysSincePayment: number;
  isWithin7Days: boolean;
  refundable: boolean;
  refundablePencils: number;
  refundableAmount: number;
  refundDenyReason: string;
}

export default function PaymentHistoryPage() {
  const { user, isLoggedIn, setUser } = useAppStore();
  const [mounted, setMounted] = useState(false);
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [currentPencils, setCurrentPencils] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [refundingId, setRefundingId] = useState<string | null>(null);
  const [confirmRefund, setConfirmRefund] = useState<PaymentRecord | null>(null);
  const [refundResult, setRefundResult] = useState<{ success: boolean; message: string } | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Always fetch fresh data on mount and when user changes
  useEffect(() => {
    if (mounted && isLoggedIn && user) {
      fetchHistory();
    }
  }, [mounted, isLoggedIn, user?.id]);

  // Also re-fetch when page becomes visible (tab switch back)
  useEffect(() => {
    const handleVisibility = () => {
      if (document.visibilityState === 'visible' && mounted && isLoggedIn && user) {
        fetchHistory();
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, [mounted, isLoggedIn, user?.id]);

  const fetchHistory = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setError('');
    try {
      // Cache-busting: append timestamp to prevent browser/CDN caching
      const res = await fetch(
        `/api/user/payment-history?userId=${user.id}&_t=${Date.now()}`,
        { cache: 'no-store' }
      );
      const data = await res.json();
      if (res.ok) {
        setPayments(data.payments || []);
        setCurrentPencils(data.currentPencils || 0);
        // Sync Zustand user pencils with DB value
        if (data.currentPencils != null && user.pencils !== data.currentPencils) {
          setUser({ ...user, pencils: data.currentPencils });
        }
      } else {
        setError(data.error || '결제 내역을 불러오는데 실패했습니다.');
      }
    } catch {
      setError('결제 내역을 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  }, [user, setUser]);

  // When user clicks "환불 요청" button on a card, re-fetch first to get latest data
  const handleRefundClick = useCallback(async (paymentId: string) => {
    if (!user) return;
    // Re-fetch latest data before showing modal
    try {
      const res = await fetch(
        `/api/user/payment-history?userId=${user.id}&_t=${Date.now()}`,
        { cache: 'no-store' }
      );
      const data = await res.json();
      if (res.ok) {
        setPayments(data.payments || []);
        setCurrentPencils(data.currentPencils || 0);
        if (data.currentPencils != null && user.pencils !== data.currentPencils) {
          setUser({ ...user, pencils: data.currentPencils });
        }
        // Find the fresh version of this payment
        const freshPayment = (data.payments || []).find((p: PaymentRecord) => p.id === paymentId);
        if (freshPayment && freshPayment.refundable) {
          setConfirmRefund(freshPayment);
        } else if (freshPayment) {
          setRefundResult({
            success: false,
            message: freshPayment.refundDenyReason || '환불이 불가능한 상태입니다.',
          });
        } else {
          setRefundResult({ success: false, message: '결제 내역을 찾을 수 없습니다.' });
        }
      }
    } catch {
      setRefundResult({ success: false, message: '데이터를 불러오는 중 오류가 발생했습니다.' });
    }
  }, [user, setUser]);

  const handleRefund = async (payment: PaymentRecord) => {
    if (!user) return;
    setRefundingId(payment.id);
    setRefundResult(null);
    try {
      const res = await fetch('/api/user/refund', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, paymentId: payment.id }),
      });
      const data = await res.json();
      if (data.success) {
        setRefundResult({ success: true, message: data.message });
        // Update local user pencils from API response
        if (data.remainingPencils != null) {
          setUser({ ...user, pencils: data.remainingPencils });
        }
      } else {
        setRefundResult({ success: false, message: data.error || '환불 처리에 실패했습니다.' });
      }
    } catch {
      setRefundResult({ success: false, message: '환불 요청 중 오류가 발생했습니다.' });
    } finally {
      setRefundingId(null);
      setConfirmRefund(null);
      // Always re-fetch after refund attempt (success or fail) to show accurate state
      await fetchHistory();
    }
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '-';
    const d = new Date(dateStr);
    return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`;
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'confirmed': return { text: '결제 완료', color: 'bg-sage-100 text-sage-600' };
      case 'refunded': return { text: '전액 환불', color: 'bg-red-100 text-red-600' };
      case 'partial_refunded': return { text: '부분 환불', color: 'bg-amber-100 text-amber-700' };
      case 'pending': return { text: '결제 진행중', color: 'bg-blue-100 text-blue-600' };
      case 'failed': return { text: '결제 실패', color: 'bg-red-100 text-red-500' };
      default: return { text: status, color: 'bg-gray-100 text-gray-600' };
    }
  };

  if (!mounted) return null;

  return (
    <div className="min-h-screen bg-warm-50 pb-12">
      {/* Header */}
      <div className="px-6 pt-8 pb-4">
        <Link href="/payment" className="text-ink-300 text-sm">&larr; 연필 구매</Link>
        <h1 className="text-2xl font-bold text-ink-700 mt-4">결제 내역</h1>
        <p className="text-sm text-ink-400 mt-1">결제 내역을 확인하고 환불을 요청할 수 있어요</p>
        {isLoggedIn && (
          <p className="text-sm text-amber-600 mt-2 font-medium">현재 보유: ✏️ {currentPencils}자루</p>
        )}
      </div>

      {/* Login required */}
      {!isLoggedIn && (
        <div className="px-6">
          <div className="bg-warm-100 rounded-xl p-6 text-center">
            <p className="text-sm text-ink-500 mb-2">로그인 후 결제 내역을 확인할 수 있어요</p>
            <Link href="/profile" className="text-sm text-ink-600 underline font-medium">로그인하기 &rarr;</Link>
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="px-6 mb-4">
          <div className="bg-red-50 text-red-600 rounded-xl p-3 text-sm">{error}</div>
        </div>
      )}

      {/* Refund result toast */}
      {refundResult && (
        <div className="px-6 mb-4">
          <div className={`rounded-xl p-3 text-sm font-medium ${
            refundResult.success ? 'bg-sage-100 text-sage-600' : 'bg-red-50 text-red-600'
          }`}>
            {refundResult.message}
          </div>
        </div>
      )}

      {/* Loading */}
      {loading && isLoggedIn && (
        <div className="px-6">
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-white rounded-xl p-5 animate-pulse">
                <div className="h-4 bg-warm-100 rounded w-1/3 mb-3"></div>
                <div className="h-3 bg-warm-50 rounded w-1/2 mb-2"></div>
                <div className="h-3 bg-warm-50 rounded w-1/4"></div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty state */}
      {!loading && isLoggedIn && payments.length === 0 && (
        <div className="px-6">
          <div className="bg-white rounded-xl p-8 text-center">
            <div className="text-4xl mb-3">📋</div>
            <p className="text-sm text-ink-400 mb-3">아직 결제 내역이 없어요</p>
            <Link href="/payment" className="text-sm text-ink-600 underline font-medium">연필 구매하러 가기 &rarr;</Link>
          </div>
        </div>
      )}

      {/* Payment list */}
      {!loading && isLoggedIn && payments.length > 0 && (
        <div className="px-6 space-y-3">
          {payments.map(p => {
            const statusInfo = getStatusLabel(p.status);
            return (
              <div key={p.id} className="bg-white rounded-xl p-5 shadow-sm">
                {/* Top row: product info & status */}
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-lg">✏️</span>
                      <span className="font-bold text-ink-700">연필 {p.pencils}자루</span>
                    </div>
                    <p className="text-xs text-ink-300 mt-1">{formatDate(p.confirmedAt || p.createdAt)}</p>
                  </div>
                  <div className="text-right">
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${statusInfo.color}`}>
                      {statusInfo.text}
                    </span>
                    <p className="text-lg font-bold text-ink-700 mt-1">{p.amount.toLocaleString()}원</p>
                  </div>
                </div>

                {/* Refund info (if refunded) */}
                {(p.refundedPencils > 0) && (
                  <div className="bg-red-50 rounded-lg p-3 mb-3 text-xs text-red-600">
                    <p>환불: {p.refundedPencils}자루 / {p.refundedAmount.toLocaleString()}원</p>
                    {p.refundedAt && <p className="text-red-400 mt-0.5">환불일: {formatDate(p.refundedAt)}</p>}
                  </div>
                )}

                {/* Refund eligibility info */}
                <div className="border-t border-warm-100 pt-3">
                  {p.refundable ? (
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <div className="text-xs text-ink-400">
                          <p>환불 가능: <span className="font-medium text-ink-600">{p.refundablePencils}자루</span></p>
                          <p className="mt-0.5">예상 환불 금액: <span className="font-medium text-sage-600">{p.refundableAmount.toLocaleString()}원</span></p>
                          {p.isWithin7Days && (
                            <p className="mt-0.5 text-amber-500">남은 기간: {7 - p.daysSincePayment}일</p>
                          )}
                        </div>
                      </div>
                      <button
                        onClick={() => handleRefundClick(p.id)}
                        disabled={!!refundingId}
                        className="w-full py-2.5 rounded-xl text-sm font-medium bg-red-50 text-red-600 hover:bg-red-100 transition-colors disabled:opacity-50"
                      >
                        {refundingId === p.id ? '처리 중...' : '환불 요청'}
                      </button>
                    </div>
                  ) : (
                    <p className="text-xs text-ink-300">{p.refundDenyReason}</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Refund policy notice */}
      <div className="px-6 mt-6">
        <div className="bg-cream-100 rounded-xl p-4 text-xs text-ink-400 space-y-1.5">
          <p className="font-medium text-ink-500">환불 규정 안내</p>
          <p>• 결제 후 7일 이내, 미사용 시 전액 환불</p>
          <p>• 결제 후 7일 이내, 일부 사용 시 미사용분 부분 환불</p>
          <p>• 결제 후 7일 경과 시 환불 불가</p>
          <p>• 무상 지급 연필(이벤트, 추천코드 등)은 환불 불가</p>
          <p>• 환불은 원래 결제 수단으로 3~7영업일 내 처리</p>
          <p>• 문의: support@sigeuldam.kr</p>
          <p className="mt-1">
            <a href="/terms#refund" className="text-ink-500 underline">환불 규정 전문 보기 &rarr;</a>
          </p>
        </div>
      </div>

      {/* Confirm refund modal */}
      {confirmRefund && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-6">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-xl">
            <h3 className="text-lg font-bold text-ink-700 mb-3">환불 요청 확인</h3>
            <div className="space-y-2 text-sm text-ink-500 mb-4">
              <p>구매: 연필 {confirmRefund.pencils}자루 ({confirmRefund.amount.toLocaleString()}원)</p>
              <p>환불 대상: <span className="font-medium text-ink-700">{confirmRefund.refundablePencils}자루</span></p>
              <p>예상 환불 금액: <span className="font-bold text-sage-600">{confirmRefund.refundableAmount.toLocaleString()}원</span></p>
              <div className="bg-warm-50 rounded-lg p-2.5 mt-2">
                <p className="text-xs text-ink-400">현재 보유: <span className="font-medium text-ink-600">✏️ {currentPencils}자루</span></p>
                <p className="text-xs text-ink-400 mt-1">환불 후: <span className="font-bold text-amber-600">✏️ {Math.max(0, currentPencils - confirmRefund.refundablePencils)}자루</span></p>
              </div>
              {confirmRefund.refundablePencils < confirmRefund.pencils - confirmRefund.refundedPencils && (
                <p className="text-amber-600 text-xs mt-1">
                  * 일부 연필이 사용되어 부분 환불됩니다.
                </p>
              )}
            </div>
            <div className="bg-warm-50 rounded-lg p-3 mb-4 text-xs text-ink-400">
              <p>환불 처리 시 해당 연필이 차감되며, 원래 결제 수단으로 환불됩니다. (3~7영업일 소요)</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmRefund(null)}
                className="flex-1 py-2.5 rounded-xl text-sm font-medium bg-warm-100 text-ink-500 hover:bg-warm-200 transition-colors"
              >
                취소
              </button>
              <button
                onClick={() => handleRefund(confirmRefund)}
                disabled={!!refundingId}
                className="flex-1 py-2.5 rounded-xl text-sm font-medium bg-red-500 text-white hover:bg-red-600 transition-colors disabled:opacity-50"
              >
                {refundingId === confirmRefund.id ? '처리 중...' : '환불 요청'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
