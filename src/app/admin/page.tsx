'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAppStore } from '@/store/useAppStore';

export default function CostAnalysisPage() {
  const { user } = useAppStore();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);
  if (!mounted) return null;
  if (!user?.isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="text-center">
          <p className="text-ink-400 mb-4">관리자만 접근 가능합니다.</p>
          <button onClick={() => router.push('/profile')} className="text-ink-600 underline text-sm">로그인하기</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-12">
      <div className="px-6 pt-8 pb-4">
        <button onClick={() => router.back()} className="text-ink-300 text-sm mb-4">← 뒤로</button>
        <h1 className="text-2xl font-bold text-ink-700">📊 API 비용 vs 광고 수익 분석</h1>
        <p className="text-sm text-ink-400 mt-1">시글담 자동완성 수익 모델 비교</p>
      </div>

      {/* API Cost Section */}
      <div className="px-6 mb-6">
        <h2 className="font-bold text-ink-600 mb-3">💰 OpenAI API 비용 (GPT-4o-mini 기준)</h2>
        <div className="bg-cream-50 rounded-card p-4 space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-ink-400">Input 가격</span>
            <span className="text-ink-600 font-medium">$0.150 / 1M tokens</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-ink-400">Output 가격</span>
            <span className="text-ink-600 font-medium">$0.600 / 1M tokens</span>
          </div>
          <div className="border-t border-cream-200 pt-2" />
          <div className="text-sm text-ink-500">
            <p className="font-medium mb-2">시 1편 자동완성 기준 예상:</p>
            <ul className="space-y-1 text-xs text-ink-400">
              <li>- Input: 사용자 QA 데이터 + 프롬프트 ≈ 800 tokens</li>
              <li>- Output: 생성된 시 ≈ 300 tokens</li>
              <li>- <span className="font-bold text-ink-600">1회당 비용: 약 $0.0003 (≈ 0.4원)</span></li>
            </ul>
          </div>
          <div className="bg-warm-100 rounded-xl p-3">
            <p className="text-sm font-bold text-ink-600">월간 비용 예상</p>
            <table className="w-full mt-2 text-xs">
              <thead><tr className="text-ink-400"><th className="text-left py-1">일 사용량</th><th className="text-right">월 비용</th><th className="text-right">원화</th></tr></thead>
              <tbody className="text-ink-600">
                <tr><td className="py-1">100회/일</td><td className="text-right">$0.90</td><td className="text-right">≈ ₩1,200</td></tr>
                <tr><td className="py-1">500회/일</td><td className="text-right">$4.50</td><td className="text-right">≈ ₩6,000</td></tr>
                <tr><td className="py-1">1,000회/일</td><td className="text-right">$9.00</td><td className="text-right">≈ ₩12,000</td></tr>
                <tr><td className="py-1">5,000회/일</td><td className="text-right">$45.00</td><td className="text-right">≈ ₩60,000</td></tr>
                <tr className="font-bold"><td className="py-1">10,000회/일</td><td className="text-right">$90.00</td><td className="text-right">≈ ₩120,000</td></tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Ad Revenue Section */}
      <div className="px-6 mb-6">
        <h2 className="font-bold text-ink-600 mb-3">📺 광고 수익 예상 (Google AdMob / AdSense 기준)</h2>
        <div className="bg-cream-50 rounded-card p-4 space-y-3">
          <div className="text-sm text-ink-500">
            <p className="font-medium mb-2">리워드 동영상 광고 (5초 시청):</p>
            <ul className="space-y-1 text-xs text-ink-400">
              <li>- 한국 시장 eCPM: ₩3,000 ~ ₩8,000 (1,000회 노출당)</li>
              <li>- <span className="font-bold text-ink-600">광고 1회 시청당: 약 ₩3 ~ ₩8</span></li>
            </ul>
          </div>
          <div className="bg-sage-100 rounded-xl p-3">
            <p className="text-sm font-bold text-ink-600">월간 광고 수익 예상</p>
            <table className="w-full mt-2 text-xs">
              <thead><tr className="text-ink-400"><th className="text-left py-1">일 시청량</th><th className="text-right">월 수익 (보수적)</th><th className="text-right">월 수익 (낙관적)</th></tr></thead>
              <tbody className="text-ink-600">
                <tr><td className="py-1">100회/일</td><td className="text-right">₩9,000</td><td className="text-right">₩24,000</td></tr>
                <tr><td className="py-1">500회/일</td><td className="text-right">₩45,000</td><td className="text-right">₩120,000</td></tr>
                <tr><td className="py-1">1,000회/일</td><td className="text-right">₩90,000</td><td className="text-right">₩240,000</td></tr>
                <tr><td className="py-1">5,000회/일</td><td className="text-right">₩450,000</td><td className="text-right">₩1,200,000</td></tr>
                <tr className="font-bold"><td className="py-1">10,000회/일</td><td className="text-right">₩900,000</td><td className="text-right">₩2,400,000</td></tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Comparison */}
      <div className="px-6 mb-6">
        <h2 className="font-bold text-ink-600 mb-3">⚖️ 비교 분석</h2>
        <div className="bg-purple-50 rounded-card p-4">
          <table className="w-full text-xs">
            <thead><tr className="text-ink-400"><th className="text-left py-1">일 사용량</th><th className="text-right">API 비용</th><th className="text-right">광고 수익</th><th className="text-right text-sage-500">순수익</th></tr></thead>
            <tbody className="text-ink-600">
              <tr><td className="py-2">100회</td><td className="text-right text-red-500">-₩1,200</td><td className="text-right text-sage-500">+₩9,000</td><td className="text-right font-bold text-sage-600">+₩7,800</td></tr>
              <tr><td className="py-2">500회</td><td className="text-right text-red-500">-₩6,000</td><td className="text-right text-sage-500">+₩45,000</td><td className="text-right font-bold text-sage-600">+₩39,000</td></tr>
              <tr><td className="py-2">1,000회</td><td className="text-right text-red-500">-₩12,000</td><td className="text-right text-sage-500">+₩90,000</td><td className="text-right font-bold text-sage-600">+₩78,000</td></tr>
              <tr><td className="py-2">5,000회</td><td className="text-right text-red-500">-₩60,000</td><td className="text-right text-sage-500">+₩450,000</td><td className="text-right font-bold text-sage-600">+₩390,000</td></tr>
              <tr className="font-bold"><td className="py-2">10,000회</td><td className="text-right text-red-500">-₩120,000</td><td className="text-right text-sage-500">+₩900,000</td><td className="text-right font-bold text-sage-600">+₩780,000</td></tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Conclusion */}
      <div className="px-6 mb-6">
        <h2 className="font-bold text-ink-600 mb-3">📋 결론</h2>
        <div className="bg-warm-100 rounded-card p-5 space-y-3 text-sm text-ink-500">
          <div className="flex items-start gap-2">
            <span className="text-green-500 text-lg">✅</span>
            <div>
              <p className="font-bold text-ink-700">광고 모델이 압도적으로 유리</p>
              <p className="text-xs text-ink-400">API 비용 대비 광고 수익이 7.5배~20배 높음</p>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-green-500 text-lg">✅</span>
            <div>
              <p className="font-bold text-ink-700">GPT-4o-mini 비용이 매우 저렴</p>
              <p className="text-xs text-ink-400">시 1편 자동완성에 0.4원 수준으로 부담 없음</p>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-green-500 text-lg">✅</span>
            <div>
              <p className="font-bold text-ink-700">사용자 경험 측면에서도 유리</p>
              <p className="text-xs text-ink-400">결제 허들 없이 5초 광고로 이용 가능 → 전환율 높음</p>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-yellow-500 text-lg">⚠️</span>
            <div>
              <p className="font-bold text-ink-700">하이브리드 모델 추천</p>
              <p className="text-xs text-ink-400">기본: 광고 시청으로 무료 이용 + 프리미엄: 광고 없이 구독 (₩2,900/월)</p>
            </div>
          </div>
        </div>
      </div>

      {/* Revenue Projections */}
      <div className="px-6 mb-6">
        <h2 className="font-bold text-ink-600 mb-3">🚀 수익 시나리오 (6개월 기준)</h2>
        <div className="bg-cream-50 rounded-card p-4 text-xs text-ink-500 space-y-2">
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white rounded-xl p-3">
              <p className="font-bold text-ink-700">보수적</p>
              <p>DAU 500명, 전환율 10%</p>
              <p className="text-sage-600 font-bold text-lg mt-1">₩45,000/월</p>
            </div>
            <div className="bg-white rounded-xl p-3">
              <p className="font-bold text-ink-700">낙관적</p>
              <p>DAU 5,000명, 전환율 15%</p>
              <p className="text-sage-600 font-bold text-lg mt-1">₩675,000/월</p>
            </div>
          </div>
          <p className="text-ink-300 text-[10px]">* eCPM ₩3,000, GPT-4o-mini 기준 산출</p>
        </div>
      </div>
    </div>
  );
}
