'use client';

import { useEffect, useRef, useState } from 'react';

interface AdBannerProps {
  slot: string;
  format?: 'auto' | 'rectangle' | 'horizontal' | 'vertical';
  className?: string;
}

// Banner ad component for feed, poem detail, etc.
export function AdBanner({ slot, format = 'auto', className = '' }: AdBannerProps) {
  const adRef = useRef<HTMLDivElement>(null);
  const adClientId = process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID;

  useEffect(() => {
    if (!adClientId) return;
    try {
      ((window as any).adsbygoogle = (window as any).adsbygoogle || []).push({});
    } catch {}
  }, [adClientId]);

  // Don't render if AdSense is not configured
  if (!adClientId) return null;

  return (
    <div ref={adRef} className={`overflow-hidden ${className}`}>
      <ins
        className="adsbygoogle"
        style={{ display: 'block' }}
        data-ad-client={adClientId}
        data-ad-slot={slot}
        data-ad-format={format}
        data-full-width-responsive="true"
      />
    </div>
  );
}

interface RewardedAdProps {
  onRewardEarned: () => void;
  onAdClosed?: () => void;
  disabled?: boolean;
  children: React.ReactNode;
}

// Rewarded ad button with countdown simulation
// For web, uses AdSense interstitial or simulated countdown
// For native apps, would use AdMob rewarded ads
export function RewardedAdButton({ onRewardEarned, onAdClosed, disabled, children }: RewardedAdProps) {
  const [showAd, setShowAd] = useState(false);
  const [countdown, setCountdown] = useState(5);

  useEffect(() => {
    if (!showAd) return;
    setCountdown(5);
    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [showAd]);

  const handleClick = () => {
    setShowAd(true);
  };

  const handleComplete = () => {
    setShowAd(false);
    onRewardEarned();
    onAdClosed?.();
  };

  return (
    <>
      <button onClick={handleClick} disabled={disabled || showAd}>
        {children}
      </button>

      {/* Ad overlay with countdown */}
      {showAd && (
        <div className="fixed inset-0 z-[70] bg-black/70 flex items-center justify-center">
          <div className="bg-white rounded-card w-[90%] max-w-[360px] p-6 text-center">
            <p className="text-lg font-bold text-ink-700 mb-4">📺 광고 시청</p>
            <div className="bg-cream-100 rounded-xl p-8 mb-4 relative overflow-hidden">
              <div className="min-h-[180px] flex flex-col items-center justify-center">
                {/* Placeholder for real ad content */}
                <div className="text-5xl mb-3 gentle-float">🌸</div>
                <p className="text-ink-500 text-sm font-medium">시글담 — 나만의 시를 담다</p>
                <p className="text-ink-300 text-xs mt-2">당신의 마음을 시로 표현해보세요</p>
                <p className="text-ink-200 text-[10px] mt-3">
                  (사업자등록 후 실제 광고가 표시됩니다)
                </p>
              </div>
            </div>
            {countdown > 0 ? (
              <p className="text-ink-400 text-sm">{countdown}초 후에 닫을 수 있어요...</p>
            ) : (
              <button
                onClick={handleComplete}
                className="w-full py-3 rounded-xl bg-ink-700 text-white font-medium hover:bg-ink-600 transition-colors"
              >
                ✏️ 연필 1자루 받기!
              </button>
            )}
          </div>
        </div>
      )}
    </>
  );
}
